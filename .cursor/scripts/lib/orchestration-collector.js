'use strict';

const { appendJsonl } = require('./observability-lib');

function recordOrchestrationEvent(event, payload = {}) {
  const row = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };
  appendJsonl('orchestration.jsonl', row);
  return row;
}

function recordPipelineGate({ pipeline, gate, status, slice, session }) {
  return recordOrchestrationEvent('pipeline_gate', { pipeline, gate, status, slice, session });
}

function recordWorkerStateChange({ session, worker, state, branch }) {
  return recordOrchestrationEvent('worker_state_change', { session, worker, state, branch });
}

function recordHandoff({ session, worker, summary, risks }) {
  return recordOrchestrationEvent('handoff', { session, worker, summary, risks });
}

module.exports = {
  recordHandoff,
  recordOrchestrationEvent,
  recordPipelineGate,
  recordWorkerStateChange,
};
