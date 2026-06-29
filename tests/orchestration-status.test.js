'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'scripts', 'orchestration-status.js');

test('orchestration-status --list --json exits 0', () => {
  const result = spawnSync(process.execPath, [script, '--list', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.ok(Array.isArray(payload.sessions));
});

test('telemetry-exporter defaults to none mode', () => {
  const exporter = path.join(repoRoot, 'scripts', 'telemetry-exporter.js');
  const env = { ...process.env, ECC_TELEMETRY_EXPORT: 'none' };
  const result = spawnSync(process.execPath, [exporter], { cwd: repoRoot, encoding: 'utf8', env });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /none/i);
});

test('telemetry-exporter prometheus prints metrics', () => {
  const { buildPrometheusMetrics } = require('../scripts/lib/telemetry-exporter.js');
  const body = buildPrometheusMetrics();
  assert.match(body, /ecc_subagent_events_total/);
  assert.match(body, /ecc_tool_usage_events_total/);
});
