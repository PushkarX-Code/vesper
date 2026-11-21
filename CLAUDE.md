# Vesper: rules for working on this repo

Vesper is a single file PWA chat app (`index.html`) served by GitHub Pages from `main`. No backend, no build step, no accounts, no analytics. Keys and chats live only in the browser's localStorage under `vesper.v1`.

## Owner's standing rules
- Free only. No paid services or paid dependencies (this is why fonts and scripts are self hosted in `fonts/` and `vendor/`).
- Settings is always shown with the real gear icon: the Lucide `settings` gear, symbol `#i-settings`. Never a sun, dial, sliders or any other icon for Settings.
- Fonts: Inter (standard AI app sans). No serif fonts anywhere, and no monospace for labels (monospace only inside code).
- No dashes in written copy: no hyphens between words and no en or em dashes, in the app, README or images. Short, direct wording.
- Neutral wording. No "roleplay" or "uncensored" wording anywhere. The owner wants Companions (custom personalities) and a hidden adult option, named neutrally: "Companions" and "Open conversation" (Settings, Personalize, More options; no pop up). The open option only removes disclaimers and allows mature themes for adults; never write prompts meant to defeat a provider's safety rules, and never allow sexual content involving minors.
- Never commit or paste API keys.
- Design: pure black, quiet, premium, Grok like feel but original. Accent blue `#6ea8ff`. The logo is five curved chrome blades around a star shaped opening: `mark.webp` (3D), `logo.svg` (flat), source in `design/logo/`.
- Ships as a PWA (the owner cannot sideload APKs).

## How the UI works
- Every panel (drawer, bottom sheet, full screen page, dialog) is a layer opened with `open(id, factory, swap)` and closed with `closeTop()` or `closeAll()`. Layers sit in one stack mirrored in browser history, so Android back closes the top one.
- A layer ignores taps while it slides in (`.settling`) and the moment it starts closing. Opens requested during a close wait in a queue. Keep this, it fixes taps landing on the wrong thing.
- App icon finishes: `ICONS` in index.html. Chrome uses the root icons and `manifest.webmanifest`; each other finish has `icons/<id>/` (icons, mark, preview) and `manifest-<id>.webmanifest`. All manifests share `"id": "./"` so switching never makes a second app. Render new finishes with `design/logo/r3d.html` (tint, glow, mid, base, rim params).
- Each app icon finish also themes the app: `applyIcon()` sets --accent, --surface, --raised, --line and --glow from `ICONS`.
- Memory: the model ends a reply with `[[remember: fact]]` when it learns something lasting (see MEMORY_RULE). `generate()` strips the tag, saves to `S.memory`, and `systemPrompt()` sends saved facts with every chat. Private chats never save.
- Companions live in `S.companions`; a chat with `companion` set uses `companionPrompt()` instead of the Vesper prompt.
- Models are keyed `provider::id` (see `mk()`). Discovered models start hidden; only shown models appear in the picker.
- Local models are OpenAI compatible connections in `S.conns`. Calls to private addresses pass `targetAddressSpace` so Chrome allows them from the https page.

## Windows app (desktop/)
- Tauri 2 wraps the same web app: `desktop/scripts/copy-web.mjs` copies the site into `desktop/dist`. Native code is `desktop/src-tauri/src/lib.rs`: `system_info` (RAM, cores, GPU and VRAM via DXGI), `list_models`, `download_model` (Hugging Face only, resumable, `dl-progress` events), `cancel_download`, `delete_model`, `start_engine` (bundled llama-server on 127.0.0.1, GPU first then processor), `stop_engine`, `engine_status`.
- In index.html, `DESKTOP` is true inside the app. PC models use the connection id `pc` and keys like `pc::<file>.gguf`; `pcEnsure()` starts the engine before sending. The catalog `PC_MODELS` lists verified Hugging Face GGUF files: check new entries exist before adding them.
- `.github/workflows/desktop.yml` builds on windows-latest: it downloads the llama.cpp Vulkan build (`LLAMA_CPP_TAG`) into `desktop/src-tauri/engine/`, then `npm run build`. Pull requests get a test build; pushing a tag `desktop-vX.Y.Z` publishes a release. Bump the version in `desktop/src-tauri/tauri.conf.json`, `Cargo.toml` and `desktop/package.json` together.
- Check native code locally with `cargo check --target x86_64-pc-windows-msvc` in `desktop/src-tauri` (after `node desktop/scripts/copy-web.mjs`).

## Releasing
- Bump `CACHE` in `sw.js` on every release, or phones keep the old copy.
- Test in a phone sized Playwright run (412 by 915) before pushing.
