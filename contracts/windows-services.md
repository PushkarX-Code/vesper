# Native Windows service contracts

This is the boundary between the WinUI presentation layer and app behavior. Views bind to service state and call services; views do not own storage, network requests, credentials, or model processes.

## Rules

- Each operation returns a typed result or a user safe error category. Do not pass raw stack traces into the UI.
- Streaming and downloads expose progress events and cancellation handles.
- Every long operation can be cancelled when its view closes, unless it is explicitly a background task.
- The services layer decides online versus local behavior and reports that state to the UI.
- Tests can substitute service implementations without rendering a window or reaching production services.

## Service groups

### Chat and history

Own chat creation, message editing, retry, streaming, private mode, local history, projects, and chat deletion. The UI receives chat summaries and message updates through observable state. A private chat must never enter persistence, logs, analytics, or account sync.

### Provider connections

Own provider configuration, protected credential lookup, model discovery, connection checks, streaming requests, and normalized error categories such as invalid key, rate limit, model unavailable, timeout, offline, and provider failure. A provider connection is online; do not label it private or offline.

### Account and sync

Own optional sign in, sign out, token renewal, account sync, conflict resolution, and account data removal. Sync must use the existing user ownership boundary. Do not sync provider keys, local server credentials, temporary chats, or private chats. Define deletion markers before implementing cross device delete.

### Local model runtime

Own PC hardware info, model catalog and fit suggestions, installed and partial downloads, download progress and cancellation, resume, delete, engine start and stop, and ready or failure state. The current Rust command surface is in `desktop/src-tauri/src/lib.rs`; preserve its behavior behind this service boundary while the native app is built.

Current command names:

| Command | Result |
| --- | --- |
| `system_info` | RAM, CPU cores, GPU name, VRAM |
| `list_models` | Installed model file names and byte counts |
| `list_model_downloads` | Partial model files and byte counts |
| `download_model` | Resumable download with `dl-progress` events |
| `cancel_download` | Cancel active model download |
| `delete_model` | Remove a model or partial download |
| `start_engine` | Start llama.cpp and return its local port |
| `stop_engine` | Stop the current local model |
| `engine_status` | Whether the local engine is ready, and selected model |

### Files and voice

Own local attachment reads, image resizing, text extraction, speech input and read aloud. Make permissions and destination clear. Do not send a local attachment to a cloud model without showing that the selected provider receives it.

## First native slice

Start with an interface implementation of local chat storage plus one provider stream. Keep interfaces small and mockable. Add local runtime and account sync only after the shell and first message flow are stable. The PWA and current Tauri app remain unchanged during this slice.

