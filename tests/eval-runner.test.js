'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

test('eval-runner define creates manifest and report computes passAtK', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-eval-'));
  const script = path.join(__dirname, '..', 'scripts', 'eval-runner.js');
  const define = spawnSync(process.execPath, [script, 'define', 'sample-eval'], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.equal(define.status, 0, define.stderr);

  const manifestPath = path.join(tmp, '.claude', 'evals', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath));

  const check = spawnSync(process.execPath, [script, 'check', 'sample-eval'], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.equal(check.status, 0, check.stderr);

  const report = spawnSync(process.execPath, [script, 'report'], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.equal(report.status, 0, report.stderr);
  const payload = JSON.parse(report.stdout);
  const entry = payload.summary.find(item => item.id === 'sample-eval');
  assert.ok(entry);
  assert.equal(entry.runs, 1);
  assert.equal(entry.passCount, 1);
  assert.equal(entry.passAtK, 1);
});
