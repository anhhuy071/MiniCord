#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { createControlPaneServer, parseArgs, usage } = require('./lib/control-pane/server');

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  const repoRoot = path.resolve(options.repoRoot || require('./lib/observability-lib').resolveRepoRoot(process.cwd()));
  const pane = createControlPaneServer({
    repoRoot,
    host: args.host,
    port: args.port,
    dbPath: args.dbPath,
    stateDbPath: args.stateDbPath,
    configPath: args.configPath,
    query: args.query,
    allowActions: args.allowActions,
  });

  await pane.listen();
  console.error(`[ECC] Control pane listening at ${pane.url}`);

  if (args.openBrowser && process.platform === 'win32') {
    const { spawn } = require('child_process');
    spawn('cmd', ['/c', 'start', '', pane.url], { detached: true, stdio: 'ignore' }).unref();
  } else if (args.openBrowser) {
    const { spawn } = require('child_process');
    spawn('xdg-open', [pane.url], { detached: true, stdio: 'ignore' }).unref();
  }
}

main().catch(error => {
  console.error(`[ECC] control-pane failed: ${error.message}`);
  process.exit(1);
});
