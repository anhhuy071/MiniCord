#!/usr/bin/env node
const { hookEnabled, readStdin, runExistingHook, transformToClaude } = require('./adapter');
const { runToolTelemetry } = require('./post-tool-telemetry');

readStdin().then(raw => {
  try {
    const input = JSON.parse(raw || '{}');
    runToolTelemetry(input, 'file_edit');

    const claudeInput = transformToClaude(input, {
      tool_input: { file_path: input.path || input.file || '' },
    });
    const claudeStr = JSON.stringify(claudeInput);

    runExistingHook('post-edit-accumulator.js', claudeStr);
    runExistingHook('post-edit-console-warn.js', claudeStr);
    if (hookEnabled('post:edit:design-quality-check', ['standard', 'strict'])) {
      runExistingHook('design-quality-check.js', claudeStr);
    }
  } catch {
    // noop
  }
  process.stdout.write(raw);
}).catch(() => process.exit(0));
