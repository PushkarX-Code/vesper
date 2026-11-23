# Vesper Windows native app migration

## Decision

Build a dedicated native Windows client with **WinUI 3 and the Windows App SDK**. Keep `index.html` as the independent PWA. Keep the current Tauri app available while the native client reaches feature parity; do not replace the current installer early.

WinUI 3 is Microsoft's recommended native UI framework for new Windows desktop apps. It provides XAML based Windows controls, Fluent styling, accessibility and system integration. Tauri's Windows UI is a WebView2 surface, so styling the current page can improve it but cannot turn it into native controls. Sources: [Microsoft WinUI 3](https://learn.microsoft.com/windows/apps/winui), [Tauri architecture](https://v2.tauri.app/concept/architecture/), [Tauri WebView versions](https://tauri.app/reference/webview-versions/).

## Product boundary

- **Vesper PWA:** stays in the current web source. It remains installable and usable in browsers.
- **Vesper for Windows:** becomes a separate WinUI 3 application. It uses Windows controls and does not render `index.html`.
- **Vesper services:** own chat orchestration, provider connections, local persistence, Supabase sync, and local model lifecycle behind an interface the UI can call.
- **Local inference:** reuse the existing llama.cpp engine behavior and model catalog. Keep model downloads and inference on the device. Expose them through a typed service contract, not view code.
- **Cloud providers:** continue to receive requests directly from the user's selected provider connection. Vesper does not become a proxy for model prompts.

## Suggested repository layout

```text
index.html                         # PWA, maintained separately
desktop/                           # Current Tauri build, retained during parity work
windows/
  Vesper.sln                       # Native Windows solution
  Vesper.App/                      # WinUI 3 views, navigation, resources
  Vesper.Core/                     # Chat, provider, account, and sync services
  Vesper.LocalRuntime/             # Adapter for the existing Rust/llama.cpp runtime
contracts/
  windows-services.md              # UI to service contracts and error states
```

Keep the first native implementation small and inspectable. Do not copy the current `index.html` into a WebView. The view calls typed service interfaces. Services own storage, network calls, and process management. Keep provider keys out of view state and store Windows credentials using a protected Windows credential mechanism.

The PWA and native client can share product behavior and API contracts, but their UI implementations remain separate. Avoid trying to share one presentation layer across the browser and WinUI.

## Existing functionality to preserve

| Area | Current behavior to carry forward |
| --- | --- |
| Chat | New and saved chats, streaming, markdown, retry, edit, model selection, private chats |
| Providers | User supplied provider keys, provider model discovery, hidden model controls, clear provider errors |
| Local AI | Hardware fit suggestions, GGUF catalog, download progress/cancel/resume, installed model management, local llama.cpp inference, Ollama/LM Studio/custom server connections |
| Organization | Projects, chat history, sidebar search and navigation |
| Personalization | Characters, custom characters, memory, response style, personalization settings |
| Inputs and output | Image and text attachments, voice input, read aloud, share chat |
| Account | Optional Google and email sign in, cross device account sync, signed out use |
| App | Settings, themes/icons, chat backgrounds, updates, support, learn pages |
| Future features | Keep coming soon pages honest; do not add pretend image, video, or voice generation controls |

Before each feature is considered complete, record its old behavior, native behavior, data impact, failure states, and parity result. Private chats, API keys, and local server credentials remain device only unless the owner changes that rule.

## Backend and data rules

- Use local SQLite for native app structured state only if needed; keep schema migrations local, versioned, and easy to inspect. The existing PWA continues using its current storage format.
- Keep Supabase as optional authentication and sync. Preserve the current account payload during the first native milestone so existing accounts do not need a database migration.
- Never include a Supabase service role or secret key in the app. Enforce each user's row ownership with RLS.
- Store provider credentials with Windows protected credential storage, separate from synced chat data.
- The current sync merge has no deletion tombstones. Fix deletion propagation and account data removal before promising that a deletion on one device removes the cloud copy.
- Do not add paid services or paid dependencies without the owner's explicit request.

## Phased delivery

### Phase 0: contracts and build foundation

- Inventory the current features and create a parity checklist.
- Decide the native app's storage, auth callback, local runtime, provider, and update interfaces.
- Create a separate WinUI 3 solution without touching the current PWA or Tauri installer.
- Establish package identity, signing approach, supported Windows versions, and build workflow before store submission work.

### Phase 1: native shell and local chat

- Build the WinUI window, navigation, sidebar, settings shell, composer, and message surface with keyboard and accessibility support.
- Support saved chats, private chats, model selection, and one provider connection end to end.
- Keep storage local and use test credentials only during development.

### Phase 2: providers and account sync

- Add provider management and discovery behind service interfaces.
- Add optional sign in, secure token storage, and compatible account sync.
- Verify sign out, sync conflicts, private data exclusion, and deletion behavior.

### Phase 3: local models

- Port the model catalog and hardware fit guidance.
- Reuse downloads, resume, progress, cancellation, and llama.cpp process lifecycle through a typed native service.
- Add Ollama, LM Studio, and custom compatible server checks.

### Phase 4: remaining product parity

- Bring over projects, characters, memory, attachments, voice, read aloud, settings, updates, support, and learn flows.
- Keep unfinished product features visibly marked as in development.

### Phase 5: release gate

- Compare each parity checklist item on the native app and PWA.
- Run clean install, upgrade, offline model, account sync, local credential, and data deletion scenarios.
- Produce a signed MSIX and review Store metadata only after feature and data checks pass.
- Keep the current Windows package available until the native replacement has an approved release.

## Claude interface prompt

> Build the **native Windows interface** for Vesper using WinUI 3 and the Windows App SDK, following `docs/WINDOWS_NATIVE_MIGRATION.md`. The current Windows app is a Tauri WebView and the PWA is a separate product. Do not wrap the PWA in another WebView or replace the current Tauri package before feature parity.
>
> Create a premium, compact Windows AI chat experience with native window behavior, a clear resizable or collapsible sidebar, full width desktop layout, consistent small typography, aligned icons, keyboard navigation, visible focus, accessible labels, and reduced motion support. Follow Windows conventions while keeping Vesper's own black visual identity. Treat other AI apps as interaction references only; do not copy their exact screens or branding.
>
> Keep presentation code in `Vesper.App`. Call typed services from `Vesper.Core`; do not put model API calls, database rules, secret storage, or process management in the views. Every visible control must work. Do not delete, hide, or fake an existing feature to simplify a screen. When a needed service is missing, write the request and contract for Codex rather than mocking it.
>
> Work in small reviewable slices. Start by making the shell and one real chat flow. Before replacing a file or changing a contract, list the impact. At the end of each slice, report changed files, features preserved, any backend work required, and the checks actually run. Do not claim parity, preview, build, or release until it has been observed.

