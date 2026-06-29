'use strict';

const fs = require('fs');
const path = require('path');
const { loopsDir, readJsonIfExists } = require('./observability-lib');

function readLoopSnapshots(env = process.env) {
  const dir = loopsDir(env);
  const indexPath = path.join(dir, 'index.json');
  const index = readJsonIfExists(indexPath);
  if (!index) {
    return { dir, index: null, sessions: [] };
  }

  const rows = Array.isArray(index) ? index : (index.sessions || index.rows || []);
  const sessions = rows.map(row => {
    const sessionId = row.session_id || row.sessionId || row.id;
    const snapshotPath = row.path || (sessionId ? path.join(dir, `${sessionId}.json`) : null);
    return {
      ...row,
      snapshot: snapshotPath ? readJsonIfExists(snapshotPath) : null,
    };
  });

  return { dir, index, sessions };
}

function ingestLoopSnapshots(env = process.env) {
  const data = readLoopSnapshots(env);
  if (!fs.existsSync(data.dir)) {
    return data;
  }
  return data;
}

module.exports = { ingestLoopSnapshots, readLoopSnapshots };
