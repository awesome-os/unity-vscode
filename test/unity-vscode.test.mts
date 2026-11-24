import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  activate,
  buildDotnetRoslynCommand,
  buildUnityBatchCommand,
  deactivate,
  detectUnityProject,
  resolveUnityGhostPlan,
} from '../src/extension.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

describe('@awesome-os/unity-vscode', () => {
  it('has valid Open VSX / VS Code manifest and aligned engines', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      name: string;
      publisher: string;
      engines: { vscode: string; node: string };
      contributes: { commands: Array<{ command: string }>; taskDefinitions: Array<{ type: string }> };
    };
    assert.equal(pkg.name, 'unity-ghost');
    assert.equal(pkg.publisher, 'awesome-os');
    assert.equal(pkg.engines.vscode, '^1.85.0');
    assert.equal(pkg.engines.node, '>=22.18.0');
    const cmds = pkg.contributes.commands.map((c) => c.command);
    assert.ok(cmds.includes('unityGhost.hydrateToolchain'));
    assert.ok(cmds.includes('unityGhost.buildScripts'));
    assert.ok(cmds.includes('unityGhost.runTests'));
    assert.equal(pkg.contributes.taskDefinitions[0]?.type, 'unity-ghost');
  });

  it('resolves live .NET 11 SDK + b8g-ghost-abi + libsectium_display from cas-v1', async () => {
    const plan = await resolveUnityGhostPlan({ platform: 'win32', arch: 'x64' });
    assert.equal(plan.dotnetSdk.filename, 'dotnet-sdk-win64.tar.zst');
    assert.match(plan.dotnetSdk.sha256, /^[0-9a-f]{64}$/);
    assert.ok(plan.dotnetSdk.bytes > 10_000_000);
    assert.equal(plan.ghostAbi.filename, 'b8g-ghost-abi-win64.node');
    assert.equal(plan.sectiumDisplay.filename, 'libsectium_display.dll');

    const cmd = buildDotnetRoslynCommand(plan, ROOT, 'Release');
    assert.ok(cmd.command.endsWith('dotnet.exe'));
    assert.deepEqual(cmd.args, ['build', '--configuration', 'Release', '--nologo']);
    assert.equal(cmd.env.DOTNET_CLI_TELEMETRY_OPTOUT, '1');
  });

  it('detects Unity ProjectVersion.txt and builds batchmode test commands', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'unity-ghost-test-'));
    try {
      mkdirSync(join(tmp, 'ProjectSettings'), { recursive: true });
      writeFileSync(
        join(tmp, 'ProjectSettings', 'ProjectVersion.txt'),
        'm_EditorVersion: 6000.0.28f1\nm_EditorVersionWithRevision: 6000.0.28f1 (abc123)\n',
        'utf8',
      );
      const info = detectUnityProject(tmp);
      assert.equal(info.isUnityProject, true);
      assert.equal(info.editorVersion, '6000.0.28f1');

      const testCmd = buildUnityBatchCommand('C:\\Unity\\Editor\\Unity.exe', tmp, 'test-editmode');
      assert.equal(testCmd.command, 'C:\\Unity\\Editor\\Unity.exe');
      assert.ok(testCmd.args.includes('-batchmode'));
      assert.ok(testCmd.args.includes('EditMode'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('supports headless activate() and deactivate() cleanly', async () => {
    await activate();
    deactivate();
  });
});
