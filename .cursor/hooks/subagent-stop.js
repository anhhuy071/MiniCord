#!/usr/bin/env node
const { readStdin } = require('./adapter');
const { runSubagentComplete } = require('./post-tool-telemetry');

readStdin().then(raw => {
  try {
    const input = JSON.parse(raw || '{}');
    runSubagentComplete(input);
    const agent = input.agent_name || input.agent || 'unknown';
    console.error(`[ECC] Agent completed: ${agent}`);
  } catch {
    // noop
  }
  process.stdout.write(raw);
}).catch(() => process.exit(0));
