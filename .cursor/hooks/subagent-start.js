#!/usr/bin/env node
const { readStdin } = require('./adapter');
const { runSubagentSpawn } = require('./post-tool-telemetry');

readStdin().then(raw => {
  try {
    const input = JSON.parse(raw || '{}');
    runSubagentSpawn(input);
    const agent = input.agent_name || input.agent || 'unknown';
    console.error(`[ECC] Agent spawned: ${agent}`);
  } catch {
    // noop
  }
  process.stdout.write(raw);
}).catch(() => process.exit(0));
