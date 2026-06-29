'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  recordHandoff,
  recordPipelineGate,
  recordWorkerStateChange,
} = require('../scripts/lib/orchestration-collector.js');

test('recordPipelineGate writes orchestration event shape', () => {
  const row = recordPipelineGate({
    pipeline: 'orch-build-mvp',
    gate: 1,
    status: 'approved',
    slice: 'auth-endpoint',
    session: 'mvp-build',
  });
  assert.equal(row.event, 'pipeline_gate');
  assert.equal(row.pipeline, 'orch-build-mvp');
  assert.equal(row.gate, 1);
  assert.ok(row.ts);
});

test('recordWorkerStateChange includes worker metadata', () => {
  const row = recordWorkerStateChange({
    session: 'mvp-build',
    worker: 'backend',
    state: 'running',
    branch: 'orchestrator-mvp-build-backend',
  });
  assert.equal(row.event, 'worker_state_change');
  assert.equal(row.worker, 'backend');
});

test('recordHandoff captures summary and risks', () => {
  const row = recordHandoff({
    session: 'mvp-build',
    worker: 'backend',
    summary: ['API scaffold complete'],
    risks: ['auth untested'],
  });
  assert.equal(row.event, 'handoff');
  assert.deepEqual(row.summary, ['API scaffold complete']);
});
