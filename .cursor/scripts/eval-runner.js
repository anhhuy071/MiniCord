#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { appendJsonl, logHarness } = require('./lib/observability-lib');

const EVALS_ROOT = path.join(process.cwd(), '.claude', 'evals');

function ensureEvalLayout() {
  const dirs = ['capability', 'regression', 'graders', 'results'];
  fs.mkdirSync(EVALS_ROOT, { recursive: true });
  for (const dir of dirs) {
    fs.mkdirSync(path.join(EVALS_ROOT, dir), { recursive: true });
  }
  const manifestPath = path.join(EVALS_ROOT, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, JSON.stringify({ evals: [] }, null, 2), 'utf8');
  }
  return manifestPath;
}

function loadManifest() {
  ensureEvalLayout();
  return JSON.parse(fs.readFileSync(path.join(EVALS_ROOT, 'manifest.json'), 'utf8'));
}

function runGrader(graderPath, cwd) {
  const result = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'sh', process.platform === 'win32'
    ? ['/c', graderPath]
    : [graderPath], {
    cwd,
    encoding: 'utf8',
    shell: false,
  });
  return {
    ok: result.status === 0,
    code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function commandDefine(name) {
  ensureEvalLayout();
  const evalId = name || 'sample-capability';
  const specPath = path.join(EVALS_ROOT, 'capability', `${evalId}.md`);
  if (!fs.existsSync(specPath)) {
    fs.writeFileSync(specPath, `# ${evalId}\n\nSuccess Criteria:\n- [ ] Example criterion\n`, 'utf8');
  }
  const graderPath = path.join(EVALS_ROOT, 'graders', `${evalId}.sh`);
  if (!fs.existsSync(graderPath)) {
    fs.writeFileSync(graderPath, '#!/usr/bin/env bash\nset -euo pipefail\necho "pass"\n', 'utf8');
  }
  const manifest = loadManifest();
  if (!manifest.evals.find(item => item.id === evalId)) {
    manifest.evals.push({ id: evalId, type: 'capability', spec: specPath, grader: graderPath });
    fs.writeFileSync(path.join(EVALS_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  }
  console.log(JSON.stringify({ evalId, specPath, graderPath }, null, 2));
}

function commandCheck(evalId) {
  const manifest = loadManifest();
  const targets = evalId
    ? manifest.evals.filter(item => item.id === evalId)
    : manifest.evals;
  const results = targets.map(item => {
    const grader = item.grader;
    const outcome = fs.existsSync(grader)
      ? runGrader(grader, process.cwd())
      : { ok: false, code: 127, stdout: '', stderr: 'grader missing' };
    return { id: item.id, ...outcome };
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const result of results) {
    const resultDir = path.join(EVALS_ROOT, 'results', result.id);
    fs.mkdirSync(resultDir, { recursive: true });
    fs.writeFileSync(path.join(resultDir, `${timestamp}.json`), JSON.stringify(result, null, 2), 'utf8');
    appendJsonl('eval-runs.jsonl', { ts: new Date().toISOString(), ...result });
    logHarness(result.ok ? 'info' : 'warn', 'eval', `Eval ${result.id}: ${result.ok ? 'PASS' : 'FAIL'}`);
  }

  console.log(JSON.stringify({ results }, null, 2));
  process.exit(results.every(result => result.ok) ? 0 : 1);
}

function commandReport() {
  const manifest = loadManifest();
  const summary = manifest.evals.map(item => {
    const resultDir = path.join(EVALS_ROOT, 'results', item.id);
    const runs = fs.existsSync(resultDir)
      ? fs.readdirSync(resultDir).filter(name => name.endsWith('.json')).sort()
      : [];
    const outcomes = runs.map(name => JSON.parse(fs.readFileSync(path.join(resultDir, name), 'utf8')));
    const passCount = outcomes.filter(row => row.ok).length;
    const k = outcomes.length;
    const passAtK = k > 0 ? passCount / k : 0;
    const last = outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;
    return { id: item.id, runs: k, passCount, passAtK, last };
  });
  console.log(JSON.stringify({ summary }, null, 2));
}

function main() {
  const [command, arg] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    console.log('Usage: node scripts/eval-runner.js <define|check|report> [eval-id]');
    process.exit(command ? 0 : 1);
  }
  if (command === 'define') return commandDefine(arg);
  if (command === 'check') return commandCheck(arg);
  if (command === 'report') return commandReport();
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main();
