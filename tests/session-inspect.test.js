'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'scripts', 'session-inspect.js');

test('session-inspect --help exits 0', () => {
  const result = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /session-inspect/);
});

test('session-inspect --live --json returns snapshot shape', () => {
  const result = spawnSync(process.execPath, [script, '--live', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.ok(payload.schemaVersion || payload.sessionId !== undefined || payload.metricsDir);
});
