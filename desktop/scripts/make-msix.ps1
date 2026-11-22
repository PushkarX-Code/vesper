# Packs the built app into an MSIX for the Microsoft Store. Run after `npm run build` in desktop/.
# The Store signs the package, so it is left unsigned here.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$tauri = Join-Path $root "src-tauri"
$ver = (Get-Content (Join-Path $tauri "tauri.conf.json") -Raw | ConvertFrom-Json).version
$stage = Join-Path $root "msix-stage"
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force (Join-Path $stage "assets"), (Join-Path $stage "engine") | Out-Null
Copy-Item (Join-Path $tauri "target/release/vesper.exe") $stage
Copy-Item (Join-Path $tauri "engine/*") (Join-Path $stage "engine")
foreach ($f in "StoreLogo.png", "Square150x150Logo.png", "Square44x44Logo.png") { Copy-Item (Join-Path $tauri "icons/$f") (Join-Path $stage "assets") }
(Get-Content (Join-Path $root "msix/AppxManifest.xml") -Raw).Replace("__VERSION__", "$ver.0") | Set-Content (Join-Path $stage "AppxManifest.xml") -Encoding utf8
$makeappx = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\makeappx.exe" | Sort-Object FullName -Descending | Select-Object -First 1
if (-not $makeappx) { throw "makeappx.exe not found" }
$out = Join-Path $root "Vesper_$ver.msix"
& $makeappx.FullName pack /d $stage /p $out /o
if ($LASTEXITCODE -ne 0) { throw "makeappx failed" }
Get-Item $out | Format-Table Name, Length
