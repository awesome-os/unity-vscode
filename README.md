# `awesome-os/unity-vscode` (`unity-ghost`)

> **MIT Unity 6 extension for Awesome-OS Code - OSS & Eclipse Theia — zero-Visual-Studio C#/Roslyn builds via `awesome-os/b8g-ghost @ cas-v1` (`.NET 11` + `b8g-ghost-abi` + `libsectium_display`) and Unity Editor batchmode/test runner.**

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
