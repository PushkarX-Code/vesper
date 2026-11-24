# Vesper AI for Windows

This folder contains the native Windows client built with WinUI 3 and the Windows App SDK. It is a separate Windows application; it does not embed the website in a WebView.

## What works in this build

- Native Windows navigation and full-width chat window.
- Connect and validate API keys for OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Mistral, and Cerebras.
- Store and remove provider keys in Windows Credential Locker.
- Send chat requests directly from the app to the selected provider. The model ID is editable in the chat header.
- Keep named conversations locally in the app's per-user data folder and reopen them from Library.
- Provider logos are bundled as app assets.

Provider API usage, quotas, and charges are controlled by each provider. The app does not include API credits. Chat history is stored locally by Windows app storage; the app does not currently sync it to an account. The existing local GGUF/llama.cpp runtime, account login, cloud sync, file search, and third-party OAuth connectors are not yet integrated into this native client. See `STORE_SUBMISSION.md` for the exact release boundary.

## Build locally

Requirements: Windows 10 version 1809 or later, .NET 10 SDK, Visual Studio 2022 Build Tools with the UWP/Windows App SDK packaging components, and Windows 10 SDK 10.0.26100.0 or newer.

From the repository root:

```powershell
dotnet build windows/Vesper.App/Vesper.App.csproj -c Debug -p:Platform=x64
```

To run from Visual Studio, open `windows/Vesper.sln`, choose the `x64` and `Debug` configuration, then start `Vesper.App`. Local unsigned development builds may be blocked by Smart App Control on some PCs. Do not turn off Windows security to test this app; use a Microsoft Store private flight after certification or obtain a trusted code-signing certificate for a local signed build.

## Create a Microsoft Store upload package

The repository includes a manual GitHub Actions workflow at `.github/workflows/native-windows-store.yml`. In GitHub, open **Actions → Native Vesper Store package → Run workflow**. It builds an unsigned `.msixupload` using Microsoft's Store packaging targets and uploads it as the artifact `vesper-native-msixupload`. Download the artifact, extract the `.msixupload`, and upload that file in Partner Center under **Packages**. Microsoft Store signs the app package after certification; do not self-sign the Store upload package.

Before submission, increment the four-part package `Version` in `Vesper.App/Package.appxmanifest` for each new Store package. Keep the Store identity and publisher unchanged. The upload workflow has not been run from this source handoff, so no Store package is included here.

## Package identity

- App: `Vesper AI`
- Package identity: `Nodefolds.VesperAI`
- Publisher: `CN=F5AB108F-EA45-4FCD-AC83-47EE912B9620`
- Current package version: `0.1.0.0`
- Architecture configured for Store workflow: x64

