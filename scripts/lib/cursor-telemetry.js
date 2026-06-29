'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { sanitizeSessionId } = require('./session-bridge');
const { appendJsonl, logHarness } = require('./observability-lib');
const { recordOrchestrationEvent } = require('./orchestration-collector');

const SUBAGENT_SPAWN_DIR = path.join(os.tmpdir(), 'ecc-subagent-spawns');

function redactSecrets(value) {
  return String(value || '')
    .replace(/\bAKIA[A-Z0-9]{16}\b/g, '<REDACTED>')
    .replace(/\bghp_[A-Za-z0-9_]+\b/g, '<REDACTED>')
    .replace(/\bgho_[A-Za-z0-9_]+\b/g, '<REDACTED>')
    .replace(/password[= ][^ ]*/gi, 'password=<REDACTED>');
}

function resolveSessionId(cursorInput) {
  const raw = cursorInput.conversation_id
    || cursorInput.session_id
    || cursorInput.sessionId
    || cursorInput._cursor?.conversation_id
    || process.env.ECC_SESSION_ID
    || process.env.CLAUDE_SESSION_ID;
  return sanitizeSessionId(raw);
}

function normalizeToolEvent(cursorInput, eventType) {
  const sessionId = resolveSessionId(cursorInput);
  let toolName = 'Unknown';
  let toolInput = {};
  let toolOutput = {};

  switch (eventType) {
    case 'bash':
      toolName = 'Bash';
      toolInput = { command: redactSecrets(cursorInput.command || cursorInput.args?.command || '') };
      toolOutput = { output: redactSecrets(String(cursorInput.output || cursorInput.result || '').slice(0, 4000)) };
      break;
    case 'mcp':
      toolName = 'MCP';
      toolInput = {
        server: cursorInput.server || cursorInput.mcp_server || 'unknown',
        tool: cursorInput.tool || cursorInput.mcp_tool || 'unknown',
      };
      toolOutput = {
        output: cursorInput.error
          ? redactSecrets(String(cursorInput.error))
          : redactSecrets(String(cursorInput.result || cursorInput.output || 'ok').slice(0, 2000)),
      };
      break;
    case 'file_edit':
      toolName = 'Edit';
      toolInput = { file_path: cursorInput.path || cursorInput.file || cursorInput.args?.filePath || '' };
      toolOutput = { output: 'edited' };
      break;
    default:
      toolInput = { eventType };
      toolOutput = {};
  }

  return {
    tool_name: toolName,
    tool_input: toolInput,
    tool_output: toolOutput,
    session_id: sessionId,
    transcript_path: cursorInput.transcript_path || cursorInput.transcriptPath || '',
  };
}

function ensureSpawnDir() {
  fs.mkdirSync(SUBAGENT_SPAWN_DIR, { recursive: true });
}

function trackSubagentSpawn(cursorInput) {
  const sessionId = resolveSessionId(cursorInput);
  const agent = cursorInput.agent_name || cursorInput.agent || 'unknown';
  const ts = Date.now();

  if (sessionId) {
    ensureSpawnDir();
    const spawnFile = path.join(SUBAGENT_SPAWN_DIR, `${sessionId}.json`);
    let map = {};
    try {
      map = JSON.parse(fs.readFileSync(spawnFile, 'utf8'));
    } catch {
      map = {};
    }
    map[agent] = ts;
    fs.writeFileSync(spawnFile, JSON.stringify(map), 'utf8');
  }

  const row = {
    ts: new Date(ts).toISOString(),
    event: 'spawn',
    agent,
    parent_session: sessionId,
    model: cursorInput.model || cursorInput._cursor?.model || null,
  };
  appendJsonl('subagents.jsonl', row);
  logHarness('info', 'subagent', `Agent spawned: ${agent}`, { session_id: sessionId, agent });
  recordOrchestrationEvent('subagent_spawn', { session: sessionId, worker: agent, state: 'running' });
  return row;
}

function trackSubagentComplete(cursorInput) {
  const sessionId = resolveSessionId(cursorInput);
  const agent = cursorInput.agent_name || cursorInput.agent || 'unknown';
  const now = Date.now();
  let durationMs = null;

  if (sessionId) {
    ensureSpawnDir();
    const spawnFile = path.join(SUBAGENT_SPAWN_DIR, `${sessionId}.json`);
    try {
      const map = JSON.parse(fs.readFileSync(spawnFile, 'utf8'));
      if (map[agent]) {
        durationMs = now - map[agent];
        delete map[agent];
        fs.writeFileSync(spawnFile, JSON.stringify(map), 'utf8');
      }
    } catch {
      // best effort
    }
  }

  const row = {
    ts: new Date(now).toISOString(),
    event: 'complete',
    agent,
    parent_session: sessionId,
    duration_ms: durationMs,
    status: cursorInput.error ? 'error' : 'ok',
  };
  appendJsonl('subagents.jsonl', row);
  logHarness('info', 'subagent', `Agent completed: ${agent}`, { session_id: sessionId, agent, duration_ms: durationMs });
  recordOrchestrationEvent('subagent_complete', {
    session: sessionId,
    worker: agent,
    state: row.status === 'ok' ? 'done' : 'failed',
    duration_ms: durationMs,
  });
  return row;
}

function runHookScript(scriptName, payload, env = process.env) {
  const scriptsRoot = path.resolve(__dirname, '..');
  const scriptPath = path.join(scriptsRoot, 'hooks', scriptName);
  if (!fs.existsSync(scriptPath)) {
    return;
  }

  const hookEnv = { ...env, CLAUDE_HOOK_EVENT_NAME: 'PostToolUse' };
  if (payload.session_id) {
    hookEnv.ECC_SESSION_ID = payload.session_id;
    hookEnv.CLAUDE_SESSION_ID = payload.session_id;
  }

  try {
    execFileSync('node', [scriptPath], {
      input: JSON.stringify(payload),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000,
      env: hookEnv,
      cwd: process.cwd(),
    });
  } catch {
    // non-blocking
  }
}

function dispatchToolTelemetry(cursorInput, eventType, options = {}) {
  const normalized = normalizeToolEvent(cursorInput, eventType);
  if (!normalized.session_id) {
    return normalized;
  }

  appendJsonl('telemetry-events.jsonl', {
    ts: new Date().toISOString(),
    event_type: eventType,
    session_id: normalized.session_id,
    tool_name: normalized.tool_name,
  });

  if (options.metricsBridge !== false) {
    runHookScript('ecc-metrics-bridge.js', normalized, options.env);
  }
  if (options.activityTracker !== false) {
    runHookScript('session-activity-tracker.js', normalized, options.env);
  }
  if (options.contextMonitor) {
    runHookScript('ecc-context-monitor.js', normalized, options.env);
  }

  return normalized;
}

module.exports = {
  dispatchToolTelemetry,
  normalizeToolEvent,
  redactSecrets,
  resolveSessionId,
  runHookScript,
  trackSubagentComplete,
  trackSubagentSpawn,
};
