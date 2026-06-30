'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const initSqlJs = require('sql.js');
const {
  ensureContextGraphDb,
  ensureHarnessStores,
  ensureStateDb,
} = require('../scripts/lib/harness-bootstrap');

function tempHarnessDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-harness-bootstrap-'));
}

test('ensureContextGraphDb creates ecc2 schema tables', async () => {
  const dir = tempHarnessDir();
  const dbPath = path.join(dir, 'ecc2.db');

  const result = await ensureContextGraphDb(dbPath);
  assert.equal(result.created, true);
  assert.equal(fs.existsSync(dbPath), true);

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const tables = [];
  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  while (stmt.step()) {
    tables.push(stmt.getAsObject().name);
  }
  stmt.free();
  db.close();

  assert.ok(tables.includes('sessions'));
  assert.ok(tables.includes('context_graph_entities'));
});

test('ensureStateDb creates state store schema', async () => {
  const dir = tempHarnessDir();
  const dbPath = path.join(dir, 'ecc', 'state.db');

  const result = await ensureStateDb(dbPath);
  assert.equal(result.created, true);
  assert.equal(fs.existsSync(dbPath), true);
});

test('ensureHarnessStores is idempotent', async () => {
  const dir = tempHarnessDir();
  const first = await ensureHarnessStores({
    dbPath: path.join(dir, 'ecc2.db'),
    stateDbPath: path.join(dir, 'ecc', 'state.db'),
  });
  const second = await ensureHarnessStores({
    dbPath: path.join(dir, 'ecc2.db'),
    stateDbPath: path.join(dir, 'ecc', 'state.db'),
  });

  assert.equal(first.contextDatabase.created, true);
  assert.equal(first.stateDatabase.created, true);
  assert.equal(second.contextDatabase.created, false);
  assert.equal(second.stateDatabase.created, false);
});
