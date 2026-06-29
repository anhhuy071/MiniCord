#!/usr/bin/env node
'use strict';

const { collectSessionSnapshot } = require('./lib/orchestration-session');
const { listOrchestrationSessions } = require('./lib/orchestration-paths');
const { normalizeDmuxSnapshot } = require('./lib/session-adapters/canonical-session');

function usage() {
  return [
    'Usage:',
    '  node scripts/orchestration-status.js --list',
    '  node scripts/orchestration-status.js --session <name>',
    '  node scripts/orchestration-status.js --worker <slug> --session <name>',
    '  node scripts/orchestration-status.js --json [--session <name>]',
    '  node scripts/orchestration-status.js --watch --session <name>',
  ].join('\n');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    help: args.includes('--help') || args.includes('-h'),
    json: args.includes('--json'),
    list: args.includes('--list'),
    watch: args.includes('--watch'),
    session: valueAfter(args, '--session'),
    worker: valueAfter(args, '--worker'),
  };
}

function valueAfter(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function printHuman(snapshot) {
  console.log(`Session: ${snapshot.sessionName}`);
  console.log(`Workers: ${snapshot.workerCount}  Panes: ${snapshot.paneCount}`);
  console.log(`States: ${JSON.stringify(snapshot.workerStates)}`);
  for (const worker of snapshot.workers || []) {
    console.log(`\n- ${worker.workerSlug} (${worker.status.state || 'unknown'})`);
    if (worker.task?.objective) {
      console.log(`  Objective: ${worker.task.objective.split('\n')[0]}`);
    }
    if (worker.handoff?.summary?.length) {
      console.log(`  Handoff: ${worker.handoff.summary.join('; ')}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  if (args.list) {
    const sessions = listOrchestrationSessions();
    const output = { sessions };
    console.log(args.json ? JSON.stringify(output, null, 2) : sessions.join('\n') || '(none)');
    return;
  }

  if (!args.session) {
    console.error('--session <name> or --list is required');
    process.exit(1);
  }

  const run = () => {
    const snapshot = collectSessionSnapshot(args.session);
    if (args.worker) {
      const worker = (snapshot.workers || []).find(item => item.workerSlug === args.worker);
      if (!worker) {
        console.error(`Worker not found: ${args.worker}`);
        process.exit(1);
      }
      const output = args.json ? worker : worker;
      console.log(args.json ? JSON.stringify(output, null, 2) : JSON.stringify(worker, null, 2));
      return;
    }

    const canonical = normalizeDmuxSnapshot(snapshot, { id: args.session, label: args.session });
    const output = args.json ? { snapshot, canonical } : snapshot;
    if (args.json) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      printHuman(snapshot);
    }
  };

  if (args.watch) {
    run();
    setInterval(run, 5000);
    return;
  }

  run();
}

main();
