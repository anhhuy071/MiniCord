'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { metricsDir, readJsonlTail } = require('./observability-lib');

function buildPrometheusMetrics() {
  const subagents = readJsonlTail('subagents.jsonl', 200);
  const toolUsage = readJsonlTail('tool-usage.jsonl', 200);
  const costs = readJsonlTail('costs.jsonl', 50);
  const latestCost = costs[costs.length - 1] || {};
  const loopWarnings = readJsonlTail('harness.log.jsonl', 100)
    .filter(row => String(row.message || '').toLowerCase().includes('loop')).length;

  const lines = [
    '# HELP ecc_subagent_events_total Subagent events in tail window',
    '# TYPE ecc_subagent_events_total gauge',
    `ecc_subagent_events_total ${subagents.length}`,
    '# HELP ecc_tool_usage_events_total Tool usage events in tail window',
    '# TYPE ecc_tool_usage_events_total gauge',
    `ecc_tool_usage_events_total ${toolUsage.length}`,
    '# HELP ecc_session_cost_usd Latest recorded session cost',
    '# TYPE ecc_session_cost_usd gauge',
    `ecc_session_cost_usd ${Number(latestCost.total_cost_usd || latestCost.cost || 0)}`,
    '# HELP ecc_loop_warnings_total Loop warnings in harness log tail',
    '# TYPE ecc_loop_warnings_total gauge',
    `ecc_loop_warnings_total ${loopWarnings}`,
  ];
  return lines.join('\n') + '\n';
}

function buildOtlpSummary() {
  const subagents = readJsonlTail('subagents.jsonl', 200);
  const toolUsage = readJsonlTail('tool-usage.jsonl', 200);
  const completed = subagents.filter(row => row.event === 'complete');
  const avgDuration = completed.length > 0
    ? completed.reduce((sum, row) => sum + (row.duration_ms || 0), 0) / completed.length
    : 0;

  return {
    resourceMetrics: [{
      scopeMetrics: [{
        metrics: [
          { name: 'ecc.subagent.events', gauge: { value: subagents.length } },
          { name: 'ecc.tool.usage.events', gauge: { value: toolUsage.length } },
          { name: 'ecc.subagent.duration_ms.avg', gauge: { value: avgDuration } },
        ],
      }],
    }],
    exportedAt: new Date().toISOString(),
    metricsDir: metricsDir(),
  };
}

function startPrometheusServer(port, options = {}) {
  const server = http.createServer((req, res) => {
    if (req.url === '/metrics' || req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
      res.end(buildPrometheusMetrics());
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, options.host || '127.0.0.1', () => {
    if (options.onListen) {
      options.onListen(port);
    }
  });
  return server;
}

function exportTelemetry(options = {}) {
  const mode = String(options.mode || process.env.ECC_TELEMETRY_EXPORT || 'none').toLowerCase();
  if (mode === 'none') {
    return { mode, exported: false };
  }

  if (mode === 'prometheus') {
    const port = Number(options.port || process.env.ECC_TELEMETRY_PROM_PORT || 8766);
    if (options.serve) {
      return { mode, port, server: startPrometheusServer(port, options) };
    }
    return { mode, body: buildPrometheusMetrics() };
  }

  if (mode === 'otlp') {
    return { mode, body: buildOtlpSummary() };
  }

  throw new Error(`Unsupported ECC_TELEMETRY_EXPORT mode: ${mode}`);
}

module.exports = {
  buildOtlpSummary,
  buildPrometheusMetrics,
  exportTelemetry,
  startPrometheusServer,
};
