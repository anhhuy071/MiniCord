#!/usr/bin/env node
const { readStdin } = require('./adapter');
const { runToolTelemetry } = require('./post-tool-telemetry');

readStdin().then(raw => {
  try {
    const input = JSON.parse(raw || '{}');
    runToolTelemetry(input, 'mcp');

    const server = input.server || input.mcp_server || 'unknown';
    const tool = input.tool || input.mcp_tool || 'unknown';
    const success = input.error ? 'FAILED' : 'OK';
    console.error(`[ECC] MCP result: ${server}/${tool} - ${success}`);
  } catch {
    // noop
  }
  process.stdout.write(raw);
}).catch(() => process.exit(0));
