---
description: Check harness observability readiness, inspect live session metrics, and open the control pane dashboard.
---

# /observability

Agent/harness observability entry point.

## Usage

```text
/observability
/observability ready
/observability inspect
/observability dashboard
```

## Actions

1. **ready** — run `node scripts/observability-readiness.js --json` and summarize pass/fail checks.
2. **inspect** — run `node scripts/session-inspect.js --live --json` and summarize live metrics, subagents, loops, harness log.
3. **dashboard** — instruct the user to run `npm run observability:dashboard` in a terminal (loopback UI on port 8765).

## Log sinks

All observability events append to `~/.claude/metrics/` (override with `ECC_METRICS_DIR`):

| File | Contents |
|------|----------|
| `harness.log.jsonl` | Harness component log (subagents, eval, orchestrator) |
| `subagents.jsonl` | Subagent spawn/complete events |
| `telemetry-events.jsonl` | Tool telemetry dispatch events |
| `tool-usage.jsonl` | Sanitized per-tool activity |
| `costs.jsonl` | Session cost totals (stop hook) |
| `orchestration.jsonl` | Pipeline gates, worker handoffs |
| `eval-runs.jsonl` | Eval runner results |

Live bridge metrics: `%TEMP%/ecc-metrics-{sessionId}.json` (or OS temp dir).
