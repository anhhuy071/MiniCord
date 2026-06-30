'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveCoordinationRoot,
  listOrchestrationSessions,
} = require('../scripts/lib/orchestration-paths.js');

test('resolveCoordinationRoot prefers .orchestration', () => {
  const root = resolveCoordinationRoot(process.cwd(), { ECC_ORCHESTRATION_ROOT: '' });
  assert.ok(root.endsWith('.orchestration') || root.includes('orchestration'));
});

test('listOrchestrationSessions returns array', () => {
  assert.ok(Array.isArray(listOrchestrationSessions(process.cwd())));
});
