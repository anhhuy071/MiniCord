#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ensureMetricsDir, metricsDir, isTmuxAvailable, resolveRepoRoot } = require('./lib/observability-lib');
const { listOrchestrationSessions } = require('./lib/orchestration-paths');

function usage() {
  return [
    'Usage:',
    '  node scripts/observability-readiness.js [--format json]',
    '',
    'Exit 0 when observability surfaces are ready; exit 1 when gaps exist.',
  ].join('\n');
}

function checkHooksJson(repoRoot) {
  const hooksPath = path.join(repoRoot, '.cursor', 'hooks.json');
  if (!fs.existsSync(hooksPath)) {
    return { id: 'hooks-json', ok: false, message: 'Missing .cursor/hooks.json' };
  }
  const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  const events = Object.keys(hooks.hooks || {});
  const required = ['subagentStart', 'subagentStop', 'stop', 'afterShellExecution', 'afterMCPExecution', 'afterFileEdit'];
  const missing = required.filter(name => !events.includes(name));
  if (missing.length > 0) {
    return { id: 'hooks-events', ok: false, message: `Missing hook events: ${missing.join(', ')}` };
  }
  return { id: 'hooks-json', ok: true, message: 'Cursor hooks.json wired' };
}

function checkTelemetryScripts(repoRoot) {
  const required = [
    'scripts/lib/cursor-telemetry.js',
    'scripts/lib/observability-lib.js',
    'scripts/lib/observability-snapshot.js',
    'scripts/session-inspect.js',
    'scripts/control-pane.js',
    'scripts/orchestration-status.js',
    '.cursor/hooks/post-tool-telemetry.js',
  ];
  const missing = required.filter(rel => !fs.existsSync(path.join(repoRoot, rel)));
  if (missing.length > 0) {
    return { id: 'telemetry-scripts', ok: false, message: `Missing files: ${missing.join(', ')}` };
  }
  return { id: 'telemetry-scripts', ok: true, message: 'Telemetry scripts present' };
}

function checkMetricsWritable() {
  try {
    ensureMetricsDir();
    const probe = path.join(metricsDir(), '.write-probe');
    fs.writeFileSync(probe, 'ok', 'utf8');
    fs.unlinkSync(probe);
    return { id: 'metrics-dir', ok: true, message: `Metrics dir writable: ${metricsDir()}` };
  } catch (error) {
    return { id: 'metrics-dir', ok: false, message: error.message };
  }
}

function checkHookProfile() {
  const profile = String(process.env.ECC_HOOK_PROFILE || 'standard').toLowerCase();
  if (profile === 'minimal') {
    return { id: 'hook-profile', ok: true, message: 'ECC_HOOK_PROFILE=minimal (telemetry hooks still enabled)' };
  }
  return { id: 'hook-profile', ok: true, message: `ECC_HOOK_PROFILE=${profile}` };
}

function checkOrchestrationPaths(cwd) {
  const sessions = listOrchestrationSessions(cwd);
  return {
    id: 'orchestration-paths',
    ok: true,
    message: sessions.length > 0
      ? `Orchestration sessions: ${sessions.join(', ')}`
      : 'Orchestration root resolvable (no active sessions)',
  };
}

function checkBridgeReadable() {
  const { findLatestBridgeSession } = require('./lib/observability-snapshot');
  const latest = findLatestBridgeSession();
  if (!latest) {
    return {
      id: 'bridge-file',
      ok: true,
      message: 'No active bridge file (expected when no Cursor session is running)',
    };
  }
  try {
    JSON.parse(require('fs').readFileSync(latest.path, 'utf8'));
    return { id: 'bridge-file', ok: true, message: `Bridge readable: ${latest.sessionId}` };
  } catch (error) {
    return { id: 'bridge-file', ok: false, message: error.message };
  }
}

function checkStateStoreSchema(repoRoot) {
  const schemaPath = path.join(repoRoot, 'schemas', 'state-store.schema.json');
  if (!fs.existsSync(schemaPath)) {
    return { id: 'state-store-schema', ok: false, message: 'Missing schemas/state-store.schema.json' };
  }
  const stateDbPath = process.env.ECC_STATE_DB_PATH
    || path.join(require('os').homedir(), '.claude', 'ecc', 'state.db');
  const parent = path.dirname(stateDbPath);
  try {
    fs.mkdirSync(parent, { recursive: true });
    const probe = path.join(parent, '.write-probe');
    fs.writeFileSync(probe, 'ok', 'utf8');
    fs.unlinkSync(probe);
    return { id: 'state-store-schema', ok: true, message: `Schema present; state dir writable: ${parent}` };
  } catch (error) {
    return { id: 'state-store-schema', ok: false, message: error.message };
  }
}

function checkOrchestrationStatusCli(repoRoot) {
  const script = path.join(repoRoot, 'scripts', 'orchestration-status.js');
  if (!fs.existsSync(script)) {
    return { id: 'orchestration-status-cli', ok: false, message: 'Missing scripts/orchestration-status.js' };
  }
  const { spawnSync } = require('child_process');
  const result = spawnSync(process.execPath, [script, '--list', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 15000,
  });
  if (result.status !== 0) {
    return {
      id: 'orchestration-status-cli',
      ok: false,
      message: (result.stderr || result.stdout || 'orchestration-status failed').trim(),
    };
  }
  return { id: 'orchestration-status-cli', ok: true, message: 'orchestration-status --list OK' };
}

function checkMultiAgentPlaybook(repoRoot) {
  const skill = path.join(repoRoot, '.cursor', 'skills', 'multi-agent-playbook', 'SKILL.md');
  const command = path.join(repoRoot, '.cursor', 'commands', 'multi-agent.md');
  if (!fs.existsSync(skill) || !fs.existsSync(command)) {
    return { id: 'multi-agent-playbook', ok: false, message: 'Missing multi-agent-playbook skill or /multi-agent command' };
  }
  return { id: 'multi-agent-playbook', ok: true, message: 'Multi-agent playbook present' };
}

function runChecks(options = {}) {
  const repoRoot = options.repoRoot || resolveRepoRoot(options.cwd || process.cwd());
  const includeMultiAgent = options.multiAgent || process.argv.includes('--multi-agent');
  const checks = [
    checkHooksJson(repoRoot),
    checkTelemetryScripts(repoRoot),
    checkMetricsWritable(),
    checkHookProfile(),
    checkOrchestrationPaths(repoRoot),
    checkBridgeReadable(),
    checkStateStoreSchema(repoRoot),
    checkOrchestrationStatusCli(repoRoot),
    {
      id: 'tmux',
      ok: true,
      message: isTmuxAvailable() ? 'tmux available for worktree orchestration' : 'tmux unavailable (in-process orchestration only)',
    },
  ];
  if (includeMultiAgent) {
    checks.push(checkMultiAgentPlaybook(repoRoot));
  }

  const ok = checks.every(check => check.ok);
  return { ok, checks, generatedAt: new Date().toISOString() };
}

function main() {
  const json = process.argv.includes('--json') || process.argv.includes('--format') && process.argv.includes('json');
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(usage());
    process.exit(0);
  }

  const report = runChecks();
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Observability readiness');
    for (const check of report.checks) {
      console.log(`${check.ok ? 'OK' : 'FAIL'}  ${check.id}: ${check.message}`);
    }
  }
  process.exit(report.ok ? 0 : 1);
}

module.exports = { runChecks };

if (require.main === module) {
  main();
}
