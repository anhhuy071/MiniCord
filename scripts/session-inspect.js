#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { buildObservabilitySnapshot, readLiveMetrics } = require('./lib/observability-snapshot');
const { readJsonlTail, metricsDir, ensureMetricsDir } = require('./lib/observability-lib');
const { sanitizeSessionId } = require('./lib/session-bridge');

function usage() {
  return [
    'Usage:',
    '  node scripts/session-inspect.js [--session <id>] [--live] [--subagents] [--loops]',
    '  node scripts/session-inspect.js [--cost] [--orchestration] [--gan] [--json]',
    '',
    'Options:',
    '  --session <id>         Session / conversation id',
    '  --live                 Latest bridge metrics + recent logs',
    '  --subagents            Subagent event log',
    '  --loops                Tool loop detection from bridge',
    '  --cost                 Cost rows from costs.jsonl',
    '  --orchestration <name> Orchestration worker snapshot',
    '  --gan                  GAN harness iteration state',
    '  --json                 Machine-readable output',
    '  --help                 Show help',
  ].join('\n');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    help: args.includes('--help') || args.includes('-h'),
    json: args.includes('--json'),
    live: args.includes('--live'),
    subagents: args.includes('--subagents'),
    loops: args.includes('--loops'),
    cost: args.includes('--cost'),
    gan: args.includes('--gan'),
    session: valueAfter(args, '--session'),
    orchestration: valueAfter(args, '--orchestration'),
  };
}

function valueAfter(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function printCostSummary(sessionId) {
  const rows = readJsonlTail('costs.jsonl', 500);
  const filtered = sessionId
    ? rows.filter(row => row.session_id === sessionId)
    : rows;
  const latest = filtered[filtered.length - 1] || null;
  return { rows: filtered.slice(-10), latest };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  ensureMetricsDir();
  const sessionId = sanitizeSessionId(args.session);
  let output = {};

  if (args.live || (!args.subagents && !args.loops && !args.cost && !args.gan && !args.orchestration)) {
    output = buildObservabilitySnapshot({
      sessionId,
      orchestrationSession: args.orchestration,
    });
  }

  if (args.subagents) {
    output.subagents = buildObservabilitySnapshot({ sessionId }).subagents;
  }
  if (args.loops) {
    output.loops = buildObservabilitySnapshot({ sessionId }).loops;
  }
  if (args.cost) {
    output.cost = printCostSummary(sessionId);
  }
  if (args.gan) {
    output.gan = buildObservabilitySnapshot({}).gan;
  }
  if (args.orchestration && !args.live) {
    output.orchestration = buildObservabilitySnapshot({
      orchestrationSession: args.orchestration,
    }).orchestration;
  }

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`Metrics dir: ${metricsDir()}`);
  if (output.sessionId) {
    console.log(`Session: ${output.sessionId}`);
  }
  if (output.live) {
    console.log('\nLive metrics:');
    console.log(JSON.stringify(output.live, null, 2));
  }
  if (output.loops?.detected) {
    console.log('\nLoop warning: repeated tool pattern detected');
  }
  if (output.subagents?.length) {
    console.log(`\nSubagent events: ${output.subagents.length}`);
    for (const row of output.subagents.slice(-10)) {
      console.log(`  ${row.ts} ${row.event} ${row.agent}`);
    }
  }
  if (output.harnessLog?.length) {
    console.log(`\nHarness log (last ${Math.min(5, output.harnessLog.length)}):`);
    for (const row of output.harnessLog.slice(-5)) {
      console.log(`  [${row.level}] ${row.component}: ${row.message}`);
    }
  }
}

main();
