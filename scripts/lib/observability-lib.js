'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { getClaudeDir } = require('./utils');

function metricsDir(env = process.env) {
  if (env.ECC_METRICS_DIR && String(env.ECC_METRICS_DIR).trim()) {
    return path.resolve(String(env.ECC_METRICS_DIR).trim());
  }
  return path.join(getClaudeDir(env), 'metrics');
}

function ensureMetricsDir(env = process.env) {
  const dir = metricsDir(env);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function appendJsonl(filename, row, env = process.env) {
  const dir = ensureMetricsDir(env);
  const filePath = path.join(dir, filename);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, 'utf8');
  return filePath;
}

function readJsonlTail(filename, limit = 50, env = process.env) {
  const filePath = path.join(metricsDir(env), filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-limit)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readJsonIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loopsDir(env = process.env) {
  if (env.ECC_LOOPS_DIR && String(env.ECC_LOOPS_DIR).trim()) {
    return path.resolve(String(env.ECC_LOOPS_DIR).trim());
  }
  return path.join(getClaudeDir(env), 'loops');
}

function stateDbPath(env = process.env) {
  if (env.ECC_STATE_DB_PATH && String(env.ECC_STATE_DB_PATH).trim()) {
    return path.resolve(String(env.ECC_STATE_DB_PATH).trim());
  }
  const home = env.HOME || env.USERPROFILE || os.homedir();
  return path.join(home, '.claude', 'ecc', 'state.db');
}

function isTmuxAvailable() {
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('tmux', ['-V'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return result.status === 0;
  } catch {
    return false;
  }
}

function resolveRepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (current && current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, '.cursor', 'hooks.json'))) {
      return current;
    }
    current = path.dirname(current);
  }

  // Fallback when invoked from .cursor/scripts via junction (scripts -> .cursor/scripts)
  const fromModule = path.resolve(__dirname, '..', '..');
  if (fs.existsSync(path.join(fromModule, '.cursor', 'hooks.json'))) {
    return fromModule;
  }

  return path.resolve(startDir);
}

function logHarness(level, component, message, extra = {}) {
  const row = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
    ...extra,
  };
  appendJsonl('harness.log.jsonl', row);
  const prefix = `[ECC:${component}]`;
  if (level === 'error') {
    process.stderr.write(`${prefix} ERROR: ${message}\n`);
  } else if (level === 'warn') {
    process.stderr.write(`${prefix} WARN: ${message}\n`);
  } else {
    process.stderr.write(`${prefix} ${message}\n`);
  }
}

module.exports = {
  appendJsonl,
  ensureMetricsDir,
  isTmuxAvailable,
  logHarness,
  loopsDir,
  metricsDir,
  readJsonIfExists,
  readJsonlTail,
  resolveRepoRoot,
  stateDbPath,
};
