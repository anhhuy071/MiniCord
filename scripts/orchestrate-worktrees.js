#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  buildOrchestrationPlan,
  executePlan,
  materializePlan,
} = require('./lib/tmux-worktree-orchestrator');
const { isTmuxAvailable, logHarness } = require('./lib/observability-lib');
const { listOrchestrationSessions } = require('./lib/orchestration-paths');

function usage() {
  return [
    'Usage:',
    '  node scripts/orchestrate-worktrees.js plan --session <name> --workers 3',
    '  node scripts/orchestrate-worktrees.js execute --plan .orchestration/plan.json',
    '  node scripts/orchestrate-worktrees.js status [--session <name>]',
  ].join('\n');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0];
  return {
    help: args.includes('--help') || args.includes('-h'),
    command,
    session: valueAfter(args, '--session') || 'default',
    workers: Number.parseInt(valueAfter(args, '--workers') || '2', 10),
    plan: valueAfter(args, '--plan'),
  };
}

function valueAfter(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.command) {
    console.log(usage());
    process.exit(args.command ? 0 : 1);
  }

  const repoRoot = process.cwd();

  if (args.command === 'status') {
    const sessions = listOrchestrationSessions(repoRoot);
    if (args.session && args.session !== 'default') {
      const { collectSessionSnapshot } = require('./lib/orchestration-session');
      console.log(JSON.stringify(collectSessionSnapshot(args.session, repoRoot), null, 2));
      return;
    }
    console.log(JSON.stringify({ sessions }, null, 2));
    return;
  }

  if (args.command === 'plan') {
    const plan = buildOrchestrationPlan({
      repoRoot,
      sessionName: args.session,
      launcherCommand: 'echo "Worker {worker_slug} ready"',
      workers: Array.from({ length: Math.max(1, args.workers) }, (_, index) => ({
        name: `worker-${index + 1}`,
        task: `Worker ${index + 1} objective — update task.md with real work.`,
      })),
    });
    const planPath = path.join(repoRoot, '.orchestration', 'plan.json');
    fs.mkdirSync(path.dirname(planPath), { recursive: true });
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');
    logHarness('info', 'orchestrator', `Plan written to ${planPath}`, { session: args.session });
    console.log(planPath);
    return;
  }

  if (args.command === 'execute') {
    if (!isTmuxAvailable()) {
      console.error('[ECC] tmux is not available. Use in-process subagents on Windows, or run under WSL.');
      process.exit(1);
    }
    const planPath = path.resolve(repoRoot, args.plan || '.orchestration/plan.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    materializePlan(plan);
    const result = executePlan(plan);
    logHarness('info', 'orchestrator', 'Worktree plan executed', { session: plan.sessionName });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.error(`Unknown command: ${args.command}`);
  console.log(usage());
  process.exit(1);
}

main();
