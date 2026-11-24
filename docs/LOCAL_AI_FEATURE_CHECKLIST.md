# Vesper local AI feature checklist

## Product goal

Make local models easy to choose, install, run, and use with personal work. Keep the free local experience clear about what stays on the PC and what needs the internet.

## Already in Vesper

- [x] The Windows app detects memory, CPU cores, graphics card, and graphics memory.
- [x] The Windows app has a curated GGUF model catalog, fit suggestions, model downloads, progress, cancellation, model listing, deletion, and a bundled local inference engine.
- [x] The Local models settings support connecting to Ollama, LM Studio, llama.cpp, and other compatible servers.
- [x] The external server setup includes model fit guidance for the computer running the server.
- [x] Projects and local chat history are available.
- [ ] Redesign the existing local model flows around these capabilities. Do not create a second catalog or pretend a missing capability is working.

## Priority 1: Make local models easy to start

### Code checklist

- [x] Windows recommendations already use detected PC hardware. Keep manual hardware entry for phones and remote computers.
- [x] Explain recommendations in plain language: best quality that fits, fastest, and smallest download.
- [x] Show model details before downloading: approximate file size, minimum weight memory, quantization, Vesper's context size, supported task, and a link to the source and license.
- [x] Show installed, starting, ready, downloading, paused, failed, and removed states.
- [x] Provide download progress, pause, retry, and resume for partial downloads. Show estimated disk space needed before starting.
- [x] Make start, stop, and delete actions clear. Confirm before deleting a downloaded model.
- [x] Test Ollama, LM Studio, and custom compatible server connections. Report reachability and available models.
- [x] Keep local model downloads and chats separate from cloud provider keys and usage.

### Design handoff for Claude

- [ ] Design one Local models home with clear sections for recommendations, installed models, downloads, and adding a model.
- [ ] Design compact model cards with fit, size, task, and license details visible at a glance.
- [ ] Design the model detail view, including a primary Download or Load action.
- [ ] Design empty, loading, downloading, interrupted, failed, and no space states.
- [ ] Design the remote server connection flow, including an endpoint test and useful error state.
- [ ] Keep the existing Vesper sidebar and full width Windows layout. Make the layout adapt cleanly to phone screens.

## Priority 2: Chat with personal files on the PC

### Code checklist

- [ ] Let users create named local collections from selected folders or files.
- [ ] Start with a small, clearly listed set of supported document formats.
- [ ] Index and search files on the device. Do not upload file contents or use a cloud embedding service.
- [ ] Let users choose a collection for a chat, and show which files informed each answer.
- [ ] Let users pause indexing, rebuild a collection, remove a file, and delete a whole collection.
- [ ] Keep collections separate by project and make storage use visible.
- [ ] Make it clear that answers can miss information and provide a way to inspect the cited source.

### Design handoff for Claude

- [ ] Design a Library tab for Chats, Projects, Models, and Knowledge.
- [ ] Design collection creation, indexing progress, ready state, and file management.
- [ ] Design source references in answers and a source preview panel.
- [ ] Design permission and privacy explanations before the app reads a selected folder.

## Priority 3: Help users get better answers

### Code checklist

- [ ] Add saved settings presets for common tasks such as everyday chat, writing, coding, and long documents.
- [ ] Show which capabilities a model supports, such as vision, tool use, and long context.
- [ ] Show useful performance information: time to first response, generation speed, memory use, and context use.
- [ ] Add a way to compare two installed models on the same prompt without mixing their chat histories.
- [ ] Add recovery guidance for out of memory, model load failure, full context, and slow generation.

### Design handoff for Claude

- [ ] Design a simple preset picker with advanced settings kept out of the main flow.
- [ ] Design a compact model status view with speed, memory, context, and capability indicators.
- [ ] Design side by side model comparison with clear labels and a way to save the preferred result.
- [ ] Design errors as short next steps, not technical stack traces.

## Priority 4: Add optional local tools and media

### Code checklist

- [ ] Add local tools only with explicit user approval for each permission and action.
- [ ] Start with safe tools such as calculator and selected file search. Add code execution only with a restricted environment and clear controls.
- [ ] Detect vision and audio support from the selected model before showing those actions.
- [ ] Add an optional local API server for users who want other apps to use Vesper's local model.
- [ ] Keep network connectors clearly marked as online. Never label an online action as private or offline.

### Design handoff for Claude

- [ ] Design an opt in tools panel with permission details, connection state, and a disconnect action.
- [ ] Design image and voice controls that appear only when the selected model supports them.
- [ ] Design the local API panel with address, access control, start and stop state, and a warning before allowing network access.

## Design rules for the handoff

- [ ] Use Vesper's existing black theme, Inter font, Lucide icons, and compact sidebar.
- [ ] Keep the controls quiet and consistent. Use labels and tooltips so icons are understandable.
- [ ] Design the Windows app first, then adapt the same flows for phone screens.
- [ ] Show real states and real capabilities. Do not add decorative controls that do nothing.
- [ ] Avoid paid services and paid dependencies.
- [ ] Return screen designs for the Local models home, model details, download manager, connection flow, and Knowledge library before expanding to later priorities.

## Suggested build order

1. Redesign the current Local models and Models on this PC screens using the native features that already exist.
2. Improve external server setup and clearly label local versus cloud chats.
3. Build local document collections with source references.
4. Add performance information, saved presets, and model comparison.
5. Explore tools, vision, voice, and the local API server after their permissions and runtime requirements are settled.

## Reference behavior

- [Jan model management](https://docs.jan.ai/desktop/manage-models) for model fit, downloads, imports, and installed model management.
- [GPT4All LocalDocs](https://docs.gpt4all.io/gpt4all_desktop/localdocs.html) for local document collections and visible sources.
- [LM Studio offline operation](https://lmstudio.ai/docs/app/offline) for explaining what works offline and what needs a connection.
- [Jan local API server](https://docs.jan.ai/desktop/api-server) for an optional local endpoint.
