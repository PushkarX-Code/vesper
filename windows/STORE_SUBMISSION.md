# Windows release handoff

## Preview securely

To let people test the app without lowering their Windows security settings, use the Microsoft Store private audience / package flight path after the Store submission passes certification. Invite testers through Partner Center and distribute the Store link. The Store-delivered package is signed by Microsoft. Local developer builds are unsigned and can be blocked by Smart App Control; do not ask testers to disable Smart App Control or code-integrity protections.

## Build and upload

1. Push the native app source and workflow to the GitHub repository.
2. In GitHub, choose **Actions → Native Vesper Store package → Run workflow**.
3. Download and extract the `vesper-native-msixupload` artifact.
4. In Partner Center, upload the `.msixupload` under **Packages**.
5. Verify the package identity matches this existing product, run Microsoft's package validation, and submit for certification.
6. After certification, set the Store listing audience to private for a controlled test, or publish publicly when ready.

## Current release boundary

This package is a native Windows client for direct, user-supplied cloud provider API keys and local conversation history. It is not a finished replacement for every Vesper website / Tauri capability. In particular, this native client currently does not include the existing bundled local model runtime, Vesper account sign-in, Supabase chat sync, external app OAuth connectors, image generation, voice, or file indexing. Those features need implementation and separate review before the Store listing claims them.

The package workflow is manual and has not been triggered from this handoff. The code in this folder is source only; this zip does not contain a signed installer, certificate, API keys, or a Partner Center submission artifact.

