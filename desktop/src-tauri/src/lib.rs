// Vesper for Windows. The window shows the same app as the web version; this file adds what a web page
// cannot do: read the PC's memory and graphics card, download models, and run them with the bundled
// llama.cpp engine (llama-server), which speaks the same chat API the app already uses.
use futures_util::StreamExt;
use serde::Serialize;
use std::{
    collections::HashMap,
    path::PathBuf,
    process::{Child, Command},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WindowEvent,
};
use tokio::io::AsyncWriteExt;

#[derive(Default)]
struct Engine {
    child: Option<Child>,
    port: u16,
    model: String,
}

struct AppState {
    engine: Mutex<Engine>,
    cancels: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

#[derive(Serialize)]
struct SysInfo {
    ram_gb: f64,
    vram_gb: f64,
    gpu_name: String,
    cores: usize,
}

#[derive(Serialize)]
struct ModelFile {
    file: String,
    bytes: u64,
}

#[derive(Serialize, Clone)]
struct Progress {
    file: String,
    done: u64,
    total: u64,
}

#[derive(Serialize)]
struct Status {
    running: bool,
    port: u16,
    model: String,
}

fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("models");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

// Only plain .gguf file names: no folders, no climbing out of the models folder.
fn safe_name(file: &str) -> Result<String, String> {
    let ok = !file.is_empty()
        && file.len() < 200
        && !file.contains('/')
        && !file.contains('\\')
        && !file.contains("..")
        && file.to_lowercase().ends_with(".gguf");
    if ok {
        Ok(file.to_string())
    } else {
        Err("That model file name isn't allowed.".into())
    }
}

#[cfg(windows)]
fn gpu() -> (String, f64) {
    use windows::Win32::Graphics::Dxgi::{CreateDXGIFactory1, IDXGIFactory1, DXGI_ADAPTER_FLAG_SOFTWARE};
    unsafe {
        let factory: IDXGIFactory1 = match CreateDXGIFactory1() {
            Ok(f) => f,
            Err(_) => return (String::new(), 0.0),
        };
        let mut best = (String::new(), 0usize);
        let mut i = 0u32;
        while let Ok(adapter) = factory.EnumAdapters1(i) {
            i += 1;
            if let Ok(d) = adapter.GetDesc1() {
                if d.Flags & (DXGI_ADAPTER_FLAG_SOFTWARE.0 as u32) != 0 {
                    continue;
                }
                if d.DedicatedVideoMemory > best.1 {
                    let name = String::from_utf16_lossy(&d.Description);
                    best = (name.trim_end_matches('\0').trim().to_string(), d.DedicatedVideoMemory);
                }
            }
        }
        (best.0, best.1 as f64 / 1_073_741_824.0)
    }
}

#[cfg(not(windows))]
fn gpu() -> (String, f64) {
    (String::new(), 0.0)
}

#[tauri::command]
fn system_info() -> SysInfo {
    let mut sys = sysinfo::System::new();
    sys.refresh_memory();
    let (gpu_name, vram_gb) = gpu();
    SysInfo {
        ram_gb: sys.total_memory() as f64 / 1_073_741_824.0,
        vram_gb,
        gpu_name,
        cores: std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4),
    }
}

#[tauri::command]
fn list_models(app: AppHandle) -> Result<Vec<ModelFile>, String> {
    let mut out = Vec::new();
    for entry in std::fs::read_dir(models_dir(&app)?).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.to_lowercase().ends_with(".gguf") {
            out.push(ModelFile {
                file: name,
                bytes: entry.metadata().map(|m| m.len()).unwrap_or(0),
            });
        }
    }
    Ok(out)
}

// Downloads a model from Hugging Face into the models folder. Resumes a broken download.
#[tauri::command]
async fn download_model(app: AppHandle, state: State<'_, AppState>, url: String, file: String) -> Result<(), String> {
    let file = safe_name(&file)?;
    if !url.starts_with("https://huggingface.co/") {
        return Err("Models can only be downloaded from Hugging Face.".into());
    }
    let dir = models_dir(&app)?;
    let part = dir.join(format!("{file}.part"));
    let dest = dir.join(&file);
    let cancel = Arc::new(AtomicBool::new(false));
    state.cancels.lock().unwrap().insert(file.clone(), cancel.clone());

    let result: Result<(), String> = async {
        let have = tokio::fs::metadata(&part).await.map(|m| m.len()).unwrap_or(0);
        let client = reqwest::Client::builder()
            .user_agent("Vesper")
            .build()
            .map_err(|e| e.to_string())?;
        let mut req = client.get(&url);
        if have > 0 {
            req = req.header("Range", format!("bytes={have}-"));
        }
        let resp = req.send().await.map_err(|e| e.to_string())?;
        let status = resp.status();
        if !status.is_success() {
            return Err(format!("The download failed (error {}).", status.as_u16()));
        }
        let resume = status.as_u16() == 206;
        let start = if resume { have } else { 0 };
        let total = resp.content_length().map(|l| l + start).unwrap_or(0);
        let mut out = tokio::fs::OpenOptions::new()
            .create(true)
            .write(true)
            .append(resume)
            .truncate(!resume)
            .open(&part)
            .await
            .map_err(|e| e.to_string())?;
        let mut done = start;
        let mut last = Instant::now();
        let mut stream = resp.bytes_stream();
        while let Some(chunk) = stream.next().await {
            if cancel.load(Ordering::Relaxed) {
                return Err("cancelled".into());
            }
            let chunk = chunk.map_err(|e| e.to_string())?;
            out.write_all(&chunk).await.map_err(|e| e.to_string())?;
            done += chunk.len() as u64;
            if last.elapsed() > Duration::from_millis(250) {
                last = Instant::now();
                let _ = app.emit("dl-progress", Progress { file: file.clone(), done, total });
            }
        }
        out.flush().await.map_err(|e| e.to_string())?;
        drop(out);
        tokio::fs::rename(&part, &dest).await.map_err(|e| e.to_string())?;
        let size = total.max(done);
        let _ = app.emit("dl-progress", Progress { file: file.clone(), done: size, total: size });
        Ok(())
    }
    .await;

    state.cancels.lock().unwrap().remove(&file);
    result
}

#[tauri::command]
fn cancel_download(state: State<'_, AppState>, file: String) {
    if let Some(flag) = state.cancels.lock().unwrap().get(&file) {
        flag.store(true, Ordering::Relaxed);
    }
}

#[tauri::command]
fn delete_model(app: AppHandle, state: State<'_, AppState>, file: String) -> Result<(), String> {
    let file = safe_name(&file)?;
    if state.engine.lock().unwrap().model == file {
        stop(&state);
    }
    let dir = models_dir(&app)?;
    let _ = std::fs::remove_file(dir.join(format!("{file}.part")));
    match std::fs::remove_file(dir.join(&file)) {
        Ok(_) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

fn stop(state: &AppState) {
    let mut engine = state.engine.lock().unwrap();
    if let Some(mut child) = engine.child.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    engine.port = 0;
    engine.model.clear();
}

fn spawn_engine(exe: &PathBuf, model: &PathBuf, port: u16, ctx: u32, gpu_layers: &str) -> Result<Child, String> {
    let mut cmd = Command::new(exe);
    cmd.arg("-m")
        .arg(model)
        .args(["--host", "127.0.0.1", "--port", &port.to_string(), "-c", &ctx.to_string(), "-ngl", gpu_layers, "--jinja"]);
    if let Some(dir) = exe.parent() {
        cmd.current_dir(dir);
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // no console window
    }
    cmd.spawn().map_err(|e| e.to_string())
}

// Waits until the engine answers /health. Returns false if it exits or takes too long.
async fn wait_ready(state: &AppState, port: u16) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{port}/health");
    for _ in 0..600 {
        tokio::time::sleep(Duration::from_millis(500)).await;
        {
            let mut engine = state.engine.lock().unwrap();
            match engine.child.as_mut() {
                Some(child) => {
                    if let Ok(Some(code)) = child.try_wait() {
                        engine.child = None;
                        return Err(format!("the engine stopped while loading ({code})"));
                    }
                }
                None => return Err("the engine was stopped".into()),
            }
        }
        if let Ok(r) = client.get(&url).send().await {
            if r.status().is_success() {
                return Ok(());
            }
        }
    }
    Err("the model took too long to load".into())
}

// Starts the engine with a downloaded model. Tries the graphics card first, then the processor only.
#[tauri::command]
async fn start_engine(app: AppHandle, state: State<'_, AppState>, file: String, ctx: u32, gpu: bool) -> Result<u16, String> {
    let file = safe_name(&file)?;
    let model = models_dir(&app)?.join(&file);
    if !model.exists() {
        return Err("This model isn't downloaded yet.".into());
    }
    let exe_name = if cfg!(windows) { "llama-server.exe" } else { "llama-server" };
    let exe = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("engine")
        .join(exe_name);
    if !exe.exists() {
        return Err("The model engine is missing from this install. Reinstall Vesper.".into());
    }
    let attempts: &[&str] = if gpu { &["999", "0"] } else { &["0"] };
    let mut last_err = String::new();
    for layers in attempts {
        stop(&state);
        let port = {
            let listener = std::net::TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
            listener.local_addr().map_err(|e| e.to_string())?.port()
        };
        let child = spawn_engine(&exe, &model, port, ctx.clamp(2048, 32768), layers)?;
        {
            let mut engine = state.engine.lock().unwrap();
            engine.child = Some(child);
            engine.port = port;
            engine.model = file.clone();
        }
        match wait_ready(&state, port).await {
            Ok(()) => return Ok(port),
            Err(e) => {
                last_err = e;
                stop(&state);
            }
        }
    }
    Err(format!("Couldn't start the model: {last_err}"))
}

#[tauri::command]
fn stop_engine(state: State<'_, AppState>) {
    stop(&state);
}

#[tauri::command]
fn engine_status(state: State<'_, AppState>) -> Status {
    let mut engine = state.engine.lock().unwrap();
    let alive = match engine.child.as_mut() {
        Some(child) => matches!(child.try_wait(), Ok(None)),
        None => false,
    };
    if !alive {
        engine.child = None;
    }
    Status {
        running: alive,
        port: if alive { engine.port } else { 0 },
        model: if alive { engine.model.clone() } else { String::new() },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            engine: Mutex::new(Engine::default()),
            cancels: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            system_info,
            list_models,
            download_model,
            cancel_download,
            delete_model,
            start_engine,
            stop_engine,
            engine_status
        ])
        .setup(|app| {
            // Use the real bundled Vesper icon for the window and the system tray.
            if let Some(icon) = app.default_window_icon().cloned() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_icon(icon.clone());
                }
                let open = MenuItem::with_id(app, "open", "Open Vesper", true, None::<&str>)?;
                let quit = MenuItem::with_id(app, "quit", "Quit Vesper", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&open, &quit])?;
                TrayIconBuilder::new()
                    .icon(icon)
                    .tooltip("Vesper")
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            if let Some(window) = tray.app_handle().get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Vesper failed to start")
        .run(|app, event| {
            match event {
                // Closing the window sends the app to the tray instead of killing a local model.
                tauri::RunEvent::WindowEvent {
                    label,
                    event: WindowEvent::CloseRequested { api, .. },
                    ..
                } if label == "main" => {
                    api.prevent_close();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                tauri::RunEvent::Exit => stop(&app.state::<AppState>()),
                _ => {}
            }
        });
}
