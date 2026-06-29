'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeToolEvent,
  resolveSessionId,
} = require('../scripts/lib/cursor-telemetry.js');

test('normalizeToolEvent maps bash payload', () => {
  const normalized = normalizeToolEvent({
    conversation_id: 'abc-123',
    command: 'npm test',
    output: 'ok',
  }, 'bash');

  assert.equal(normalized.tool_name, 'Bash');
  assert.equal(normalized.tool_input.command, 'npm test');
  assert.equal(normalized.session_id, 'abc-123');
});

test('resolveSessionId reads conversation id', () => {
  assert.equal(resolveSessionId({ conversation_id: 'abc-123-session' }), 'abc-123-session');
});
