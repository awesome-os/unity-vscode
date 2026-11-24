/**
 * @file src/extension.mts
 * @description MIT Unity 6 extension for Awesome-OS Code - OSS & Eclipse Theia.
 *
 * Replaces the ~20 GB Visual Studio + standalone .NET installer prerequisite for Unity C#
 * development by hydrating rolling-latest .NET 11 SDK + b8g-ghost-abi + libsectium_display
 * directly from `awesome-os/b8g-ghost @ cas-v1`, while integrating cleanly with your
 * locally installed Unity Editor (zero redistribution of proprietary Unity binaries).
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const GHOST_INDEX_URL =
  process.env.B8G_GHOST_INDEX_URL ??
  'https://raw.githubusercontent.com/awesome-os/b8g-ghost/main/manifests/index.json';

export const GHOST_CAS_BASE_URL =
  process.env.B8G_GHOST_CAS_URL ??
  'https://github.com/awesome-os/b8g-ghost/releases/download/cas-v1';

export interface GhostCasEntry {
  readonly filename: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly version?: string;
  readonly download_url: string;
}

export interface GhostIndex {
  readonly schema: string;
  readonly total_entries: number;
  readonly entries: Record<string, GhostCasEntry>;
}

export interface UnityProjectInfo {
  readonly projectPath: string;
  readonly isUnityProject: boolean;
  readonly editorVersion: string | null;
  readonly solutionFile: string | null;
}

export interface UnityGhostPlan {
  readonly platform: NodeJS.Platform;
  readonly cacheDir: string;
  readonly dotnetSdk: GhostCasEntry;
  readonly ghostAbi: GhostCasEntry;
  readonly sectiumDisplay: GhostCasEntry;
  readonly dotnetInstallDir: string;
  readonly unityEditorPath: string | null;
}

export interface CommandSpec {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Record<string, string>;
}

export function getGhostCacheDir(): string {
  return process.env.B8G_GHOST_CACHE_DIR ?? join(homedir(), '.b8g', 'cas');
}

export function getDotnetSdkAssetKey(platform: NodeJS.Platform = process.platform): string {
  if (platform === 'win32') return 'dotnet-sdk-win64.tar.zst';
  return 'dotnet-sdk-linux-x64.tar.zst';
}

export function getGhostAbiAssetKey(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
): string {
  if (platform === 'win32') return 'b8g-ghost-abi-win64.node';
  if (platform === 'darwin') return 'b8g-ghost-abi-macos-arm64.node';
  return arch === 'arm64' ? 'b8g-ghost-abi-linux-arm64.node' : 'b8g-ghost-abi-linux-x64.node';
}

export function getSectiumDisplayAssetKey(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
): string {
  if (platform === 'win32') return 'libsectium_display.dll';
  if (platform === 'darwin') return 'libsectium_display-macos-arm64.dylib';
  return arch === 'arm64' ? 'libsectium_display-linux-arm64.so' : 'libsectium_display-linux-x64.so';
}

export async function fetchGhostIndex(): Promise<GhostIndex> {
  const res = await fetch(GHOST_INDEX_URL, {
    headers: { 'User-Agent': 'awesome-os-unity-vscode/0.1.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${GHOST_INDEX_URL}`);
  }
  return (await res.json()) as GhostIndex;
}

export function detectUnityProject(workspaceDir: string): UnityProjectInfo {
  const projectPath = resolve(workspaceDir);
  const versionFile = join(projectPath, 'ProjectSettings', 'ProjectVersion.txt');
  if (!existsSync(versionFile)) {
    return { projectPath, isUnityProject: false, editorVersion: null, solutionFile: null };
  }
  const text = readFileSync(versionFile, 'utf8');
  const m = /m_EditorVersion:\s*([^\r\n]+)/.exec(text);
  const editorVersion = m ? m[1].trim() : null;
  const folderName = projectPath.split(/[/\\]/).pop() ?? 'Assembly-CSharp';
  const candidateSln = join(projectPath, `${folderName}.sln`);
  return {
    projectPath,
    isUnityProject: true,
    editorVersion,
    solutionFile: existsSync(candidateSln) ? candidateSln : null,
  };
}

export function findUnityEditorBinary(
  editorVersion?: string | null,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  if (env.UNITY_EDITOR_PATH && existsSync(env.UNITY_EDITOR_PATH)) {
    return env.UNITY_EDITOR_PATH;
  }
  if (!editorVersion) return null;
  const candidates =
    platform === 'win32'
      ? [
          join('C:\\Program Files\\Unity\\Hub\\Editor', editorVersion, 'Editor', 'Unity.exe'),
          join('D:\\Unity\\Hub\\Editor', editorVersion, 'Editor', 'Unity.exe'),
        ]
      : platform === 'darwin'
        ? [join('/Applications/Unity/Hub/Editor', editorVersion, 'Unity.app/Contents/MacOS/Unity')]
        : [join(homedir(), 'Unity/Hub/Editor', editorVersion, 'Editor/Unity')];

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

export async function resolveUnityGhostPlan(
  options: {
    platform?: NodeJS.Platform;
    arch?: string;
    editorVersion?: string | null;
    index?: GhostIndex;
  } = {},
): Promise<UnityGhostPlan> {
  const platform = options.platform ?? process.platform;
  const arch = options.arch ?? process.arch;
  const idx = options.index ?? (await fetchGhostIndex());

  const dotnetKey = getDotnetSdkAssetKey(platform);
  const abiKey = getGhostAbiAssetKey(platform, arch);
  const displayKey = getSectiumDisplayAssetKey(platform, arch);

  const dotnetSdk = idx.entries[dotnetKey];
  const ghostAbi = idx.entries[abiKey];
  const sectiumDisplay = idx.entries[displayKey];

  if (!dotnetSdk) throw new Error(`Missing "${dotnetKey}" in b8g-ghost cas-v1 index`);
  if (!ghostAbi) throw new Error(`Missing "${abiKey}" in b8g-ghost cas-v1 index`);
  if (!sectiumDisplay) throw new Error(`Missing "${displayKey}" in b8g-ghost cas-v1 index`);

  const cacheDir = getGhostCacheDir();
  return {
    platform,
    cacheDir,
    dotnetSdk,
    ghostAbi,
    sectiumDisplay,
    dotnetInstallDir: join(cacheDir, 'dotnet', dotnetSdk.sha256),
    unityEditorPath: findUnityEditorBinary(options.editorVersion ?? null, platform),
  };
}

export function buildDotnetRoslynCommand(
  plan: UnityGhostPlan,
  projectPath: string,
  configuration = 'Debug',
): CommandSpec {
  const dotnetBin = join(
    plan.dotnetInstallDir,
    plan.platform === 'win32' ? 'dotnet.exe' : 'dotnet',
  );
  return {
    command: dotnetBin,
    args: ['build', '--configuration', configuration, '--nologo'],
    cwd: resolve(projectPath),
    env: {
      DOTNET_ROOT: plan.dotnetInstallDir,
      DOTNET_CLI_TELEMETRY_OPTOUT: '1',
      B8G_GHOST_CACHE_DIR: plan.cacheDir,
    },
  };
}

export function buildUnityBatchCommand(
  editorPath: string,
  projectPath: string,
  mode: 'open' | 'test-editmode' | 'test-playmode' = 'open',
): CommandSpec {
  const baseArgs = ['-projectPath', resolve(projectPath)];
  if (mode === 'test-editmode') {
    baseArgs.push('-batchmode', '-runTests', '-testPlatform', 'EditMode', '-logFile', '-');
  } else if (mode === 'test-playmode') {
    baseArgs.push('-batchmode', '-runTests', '-testPlatform', 'PlayMode', '-logFile', '-');
  }
  return {
    command: editorPath,
    args: baseArgs,
    cwd: resolve(projectPath),
    env: {
      DOTNET_CLI_TELEMETRY_OPTOUT: '1',
      B8G_GHOST_CACHE_DIR: getGhostCacheDir(),
    },
  };
}

export async function activate(context?: { subscriptions?: Array<{ dispose(): void }> }): Promise<void> {
  try {
    const vscode = (await import('vscode' as string)) as {
      commands: { registerCommand: (id: string, cb: () => Promise<void>) => { dispose(): void } };
      window: { showInformationMessage: (msg: string) => void };
    };
    const sub = vscode.commands.registerCommand('unityGhost.hydrateToolchain', async () => {
      const plan = await resolveUnityGhostPlan();
      vscode.window.showInformationMessage(
        `[Unity Ghost] Resolved .NET ${plan.dotnetSdk.version ?? '11'} + Ghost ABI from cas-v1.`,
      );
    });
    context?.subscriptions?.push(sub);
  } catch {
    // Headless / Node test mode without VS Code host
  }
}

export function deactivate(): void {
  // No persistent handles to release
}
