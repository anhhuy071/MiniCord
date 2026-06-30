#!/usr/bin/env node
'use strict';

const { ensureHarnessStores } = require('./lib/harness-bootstrap');

function usage() {
  return [
    'Usage:',
    '  node scripts/harness-bootstrap.js [--json]',
    '',
    'Creates ~/.claude/ecc2.db and ~/.claude/ecc/state.db when missing.',
  ].join('\n');
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(usage());
    process.exit(0);
  }

  const result = await ensureHarnessStores();
  const json = process.argv.includes('--json');

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const [label, entry] of [
      ['Context graph', result.contextDatabase],
      ['State store', result.stateDatabase],
    ]) {
      const action = entry.created ? 'created' : 'already present';
      console.log(`${label}: ${action} (${entry.dbPath})`);
    }
  }
}

main().catch(error => {
  console.error(`[ECC] harness-bootstrap failed: ${error.message}`);
  process.exit(1);
});
