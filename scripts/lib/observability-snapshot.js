'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { readBridge, sanitizeSessionId } = require('./session-bridge');
const {
  metricsDir,
  readJsonlTail,
  readJsonIfExists,
} = require('./observability-lib');
const { readGanHarnessState } = require('./gan-harness-reader');
const { ingestLoopSnapshots } = require('./loop-snapshot-ingest');
const { listOrchestrationSessions } = require('./orchestration-paths');
const { collectSessionSnapshot } = require('./orchestration-session');

function findLatestBridgeSession() {
  const tmp = os.tmpdir();
  let latest = null;
  try {
    for (const file of fs.readdirSync(tmp)) {
      if (!file.startsWith('ecc-metrics-') || !file.endsWith('.json')) {
        continue;
      }
      const sessionId = file.slice('ecc-metrics-'.length, -'.json'.length);
      const fullPath = path.join(tmp, file);
      const stat = fs.statSync(fullPath);
      if (!latest || stat.mtimeMs > latest.mtimeMs) {
        latest = { sessionId, path: fullPath, mtimeMs: stat.mtimeMs };
      }
    }
  } catch {
    return null;
  }
  return latest;
}

function readLiveMetrics(sessionId) {
  const safeId = sanitizeSessionId(sessionId);
  if (!safeId) {
    const latest = findLatestBridgeSession();
    if (!latest) {
      return null;
    }
    return readBridge(latest.sessionId);
  }
  return readBridge(safeId);
}

function buildSubagentTree(sessionId, limit = 100) {
  const rows = readJsonlTail('subagents.jsonl', limit);
  if (!sessionId) {
    return rows;
  }
  return rows.filter(row => row.parent_session === sessionId);
}

function detectLoopsFromBridge(bridge) {
  if (!bridge || !Array.isArray(bridge.recent_tools)) {
    return { detected: false, tools: [] };
  }
  const hashes = bridge.recent_tools.map(item => item.hash);
  const counts = {};
  for (const hash of hashes) {
    counts[hash] = (counts[hash] || 0) + 1;
  }
  const repeated = Object.entries(counts).filter(([, count]) => count >= 3);
  return {
    detected: repeated.length > 0,
    tools: bridge.recent_tools,
    repeated,
  };
}

function buildObservabilitySnapshot(options = {}) {
  const cwd = options.cwd || process.cwd();
  const sessionId = options.sessionId || null;
  const bridge = readLiveMetrics(sessionId);
  const resolvedSession = sessionId || bridge?.session_id || findLatestBridgeSession()?.sessionId || null;

  return {
    schemaVersion: 'ecc.observability.snapshot.v1',
    generatedAt: new Date().toISOString(),
    sessionId: resolvedSession,
    metricsDir: metricsDir(),
    live: bridge,
    loops: detectLoopsFromBridge(bridge),
    subagents: buildSubagentTree(resolvedSession, options.limit || 100),
    toolActivity: readJsonlTail('tool-usage.jsonl', options.limit || 50),
    harnessLog: readJsonlTail('harness.log.jsonl', options.limit || 50),
    orchestrationLog: readJsonlTail('orchestration.jsonl', options.limit || 50),
    gan: readGanHarnessState(cwd),
    loopSnapshots: ingestLoopSnapshots(),
    orchestrationSessions: listOrchestrationSessions(cwd),
    orchestration: options.orchestrationSession
      ? collectSessionSnapshot(options.orchestrationSession, cwd)
      : null,
  };
}

module.exports = {
  buildObservabilitySnapshot,
  buildSubagentTree,
  detectLoopsFromBridge,
  findLatestBridgeSession,
  readLiveMetrics,
};
