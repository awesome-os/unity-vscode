# `awesome-os/unity-vscode` (`unity-ghost`)

> **MIT Unity 6 extension for Awesome-OS Code - OSS & Eclipse Theia — zero-Visual-Studio C#/Roslyn builds via `awesome-os/b8g-ghost @ cas-v1` (`.NET 11` + `b8g-ghost-abi` + `libsectium_display`) and Unity Editor batchmode/test runner.**

## Install & Usage

### 1-Command `.vsix` Install (Awesome-OS Code - OSS / Eclipse Theia / VS Code)

```powershell
gh release download -R awesome-os/unity-vscode --pattern "*.vsix" --dir "$HOME/.b8g/cas/extensions" --clobber
```

Or download the `.vsix` from [`Releases`](https://github.com/awesome-os/unity-vscode/releases/latest) and run `code-oss --install-extension <file>.vsix` (or install from Open VSX once published).

### Usage

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

- **Unity Ghost: Hydrate .NET 11 + Ghost ABI Toolchain (cas-v1)** (`unityGhost.hydrateToolchain`)
- **Unity Ghost: Build C# Assemblies via .NET 11 (Zero Visual Studio)** (`unityGhost.buildScripts`)
- **Unity Ghost: Open Project in Unity Editor** (`unityGhost.openEditor`)
- **Unity Ghost: Run EditMode / PlayMode Tests (Batchmode)** (`unityGhost.runTests`)
- **Unity Ghost: Inspect Burst / IL2CPP Toolchain Plan** (`unityGhost.inspectBurst`)

Run tests locally (Node.js 22+):

```powershell
node --test test/*.test.mts
```

## Why?
Unity's C++ core is proprietary/source-available (we never redistribute Unity binaries), but its C# scripting & Roslyn build pipeline does **not** need a 20 GB Visual Studio install. `unity-ghost` hydrates rolling-latest **.NET `11.0.100` SDK** from `awesome-os/b8g-ghost @ cas-v1` (`Keep-Last-5`, zero telemetry) and wires directly into your locally installed Unity Editor (`ProjectSettings/ProjectVersion.txt` or `UNITY_EDITOR_PATH`).

## Contributed Commands
- `unityGhost.hydrateToolchain` — Resolve & hydrate `.NET 11` SDK + `b8g-ghost-abi` + `libsectium_display`
- `unityGhost.buildScripts` — Build C# assemblies via `.NET 11` (zero Visual Studio)
- `unityGhost.openEditor` — Open active Unity project in Unity Editor
- `unityGhost.runTests` — Run EditMode / PlayMode tests in `-batchmode`
- `unityGhost.inspectBurst` — Inspect Burst / IL2CPP toolchain plan

## Verify Locally
```powershell
node --test test/unity-vscode.test.mts
```

## Quick Install & Run (Windows / Linux / macOS)

```powershell
# Windows (PowerShell) — 1-line VSIX install into Code - OSS / VS Code
gh release download -R awesome-os/unity-vscode -p "*.vsix" -O "unity-vscode.vsix" --clobber; code --install-extension "unity-vscode.vsix"
```

```sh
# Linux & macOS — 1-line VSIX install into Code - OSS / VS Code
gh release download -R awesome-os/unity-vscode -p "*.vsix" -O "unity-vscode.vsix" --clobber && code --install-extension "unity-vscode.vsix"
```
