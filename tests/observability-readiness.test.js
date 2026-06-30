'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runChecks } = require('../scripts/observability-readiness.js');

test('observability readiness passes for harness template', async () => {
  const report = await runChecks({ repoRoot: path.resolve(__dirname, '..') });
  assert.equal(report.ok, true, report.checks.filter(item => !item.ok).map(item => item.message).join('; '));
});
