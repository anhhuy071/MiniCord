'use strict';

const fs = require('fs');
const path = require('path');

const initSqlJs = require('sql.js');

const { createStateStore } = require('./state-store');
const { defaultDbPath, defaultStateDbPath } = require('./harness-paths');

const ECC2_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  task TEXT,
  project TEXT,
  task_group TEXT,
  agent_type TEXT,
  harness TEXT,
  detected_harnesses_json TEXT,
  working_dir TEXT,
  state TEXT,
  pid INTEGER,
  worktree_path TEXT,
  worktree_branch TEXT,
  worktree_base TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  tool_calls INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  duration_secs REAL DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  last_heartbeat_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_session TEXT,
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS context_graph_entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  entity_type TEXT,
  name TEXT,
  path TEXT,
  summary TEXT,
  metadata_json TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS context_graph_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  entity_id INTEGER,
  observation_type TEXT,
  priority INTEGER DEFAULT 1,
  pinned INTEGER DEFAULT 0,
  summary TEXT,
  details_json TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS context_graph_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_entity_id INTEGER,
  to_entity_id INTEGER
);

CREATE TABLE IF NOT EXISTS context_graph_connector_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connector_name TEXT,
  updated_at TEXT
);
`;

function resolvePaths(options = {}) {
  const env = options.env || process.env;
  return {
    contextDbPath: path.resolve(options.dbPath || env.ECC2_DB_PATH || defaultDbPath(env)),
    stateDbPath: path.resolve(options.stateDbPath || env.ECC_STATE_DB_PATH || defaultStateDbPath(env)),
  };
}

async function ensureContextGraphDb(dbPath) {
  if (fs.existsSync(dbPath)) {
    return { dbPath, created: false, exists: true };
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const SQL = await initSqlJs();
  const rawDb = new SQL.Database();
  try {
    rawDb.run(ECC2_SCHEMA_SQL);
    fs.writeFileSync(dbPath, Buffer.from(rawDb.export()));
  } finally {
    rawDb.close();
  }

  return { dbPath, created: true, exists: true };
}

async function ensureStateDb(stateDbPath) {
  if (fs.existsSync(stateDbPath)) {
    return { dbPath: stateDbPath, created: false, exists: true };
  }

  const store = await createStateStore({ dbPath: stateDbPath });
  const created = true;
  store.close();
  return { dbPath: stateDbPath, created, exists: true };
}

async function ensureHarnessStores(options = {}) {
  const { contextDbPath, stateDbPath } = resolvePaths(options);
  const stateDatabase = await ensureStateDb(stateDbPath);
  const contextDatabase = await ensureContextGraphDb(contextDbPath);

  return {
    ok: true,
    stateDatabase,
    contextDatabase,
  };
}

module.exports = {
  ECC2_SCHEMA_SQL,
  ensureContextGraphDb,
  ensureHarnessStores,
  ensureStateDb,
  resolvePaths,
};
