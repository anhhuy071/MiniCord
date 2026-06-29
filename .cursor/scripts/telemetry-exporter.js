#!/usr/bin/env node
'use strict';

const { exportTelemetry } = require('./lib/telemetry-exporter');

function usage() {
  return [
    'Usage:',
    '  node scripts/telemetry-exporter.js [--serve]',
    '',
    'Environment:',
    '  ECC_TELEMETRY_EXPORT=none|prometheus|otlp',
    '  ECC_TELEMETRY_PROM_PORT=8766',
  ].join('\n');
}

function main() {
  const serve = process.argv.includes('--serve');
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(usage());
    process.exit(0);
  }

  const mode = String(process.env.ECC_TELEMETRY_EXPORT || 'none').toLowerCase();
  if (mode === 'none') {
    console.log('ECC_TELEMETRY_EXPORT=none (set otlp or prometheus to enable)');
    process.exit(0);
  }

  try {
    const result = exportTelemetry({ mode, serve });
    if (result.server) {
      console.log(`Prometheus metrics on http://127.0.0.1:${result.port}/metrics`);
      return;
    }
    if (typeof result.body === 'string') {
      process.stdout.write(result.body);
      return;
    }
    console.log(JSON.stringify(result.body, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
