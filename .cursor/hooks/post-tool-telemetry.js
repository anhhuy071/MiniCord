#!/usr/bin/env node
'use strict';

const path = require('path');
const { getPluginRoot, hookEnabled } = require('./adapter');

function loadTelemetry() {
  return require(path.join(getPluginRoot(), 'scripts', 'lib', 'cursor-telemetry.js'));
}

function telemetryEnabled(hookId) {
  return hookEnabled(hookId, ['minimal', 'standard', 'strict']);
}

function runToolTelemetry(cursorInput, eventType, options = {}) {
  if (!telemetryEnabled(`telemetry:${eventType}`)) {
    return;
  }
  const telemetry = loadTelemetry();
  telemetry.dispatchToolTelemetry(cursorInput, eventType, {
    contextMonitor: hookEnabled('telemetry:context-monitor', ['standard', 'strict']),
    ...options,
  });
}

function runSubagentSpawn(cursorInput) {
  if (!hookEnabled('telemetry:subagent', ['minimal', 'standard', 'strict'])) {
    return;
  }
  loadTelemetry().trackSubagentSpawn(cursorInput);
}

function runSubagentComplete(cursorInput) {
  if (!hookEnabled('telemetry:subagent', ['minimal', 'standard', 'strict'])) {
    return;
  }
  loadTelemetry().trackSubagentComplete(cursorInput);
}

module.exports = {
  loadTelemetry,
  runSubagentComplete,
  runSubagentSpawn,
  runToolTelemetry,
  telemetryEnabled,
};
