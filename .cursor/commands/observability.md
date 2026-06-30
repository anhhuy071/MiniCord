---
description: Check harness observability readiness and inspect live session metrics via CLI and log files.
---

# /observability

Agent/harness observability entry point. **Use CLI and JSONL logs** — not a web dashboard.

## Usage

```text
/observability
/observability ready
/observability inspect
```

## Actions

1. **ready** — run `node scripts/observability-readiness.js --json` and summarize pass/fail checks.
2. **inspect** — run `node scripts/session-inspect.js --live --json` and summarize:
   - `sessionId`, `live` bridge
   - `subagents` (recent events)
   - `toolActivity`
   - `harnessLog` tail
   - `orchestrationLog` tail if present
   - Explain when `null` / empty arrays are expected (idle, no active agent session)

## Log sinks

All observability events append to `~/.claude/metrics/` (Windows: `%USERPROFILE%\.claude\metrics\`). Override with `ECC_METRICS_DIR`:

| File | Contents |
|------|----------|
| `harness.log.jsonl` | Harness component log (eval, orchestrator) |
| `subagents.jsonl` | Subagent spawn/complete events |
| `telemetry-events.jsonl` | Tool telemetry dispatch events |
| `tool-usage.jsonl` | Sanitized per-tool activity |
| `costs.jsonl` | Session cost totals (stop hook) |
| `orchestration.jsonl` | Pipeline gates, worker handoffs |
| `eval-runs.jsonl` | Eval runner results |

Live bridge metrics: `%TEMP%/ecc-metrics-{sessionId}.json` (or OS temp dir).

## Tail logs (user terminal)

```powershell
Get-Content $env:USERPROFILE\.claude\metrics\harness.log.jsonl -Tail 10
Get-Content $env:USERPROFILE\.claude\metrics\subagents.jsonl -Tail 10
```

See [HARNESS.md](../../HARNESS.md) and [HARNESS-SKILLS.md](../../HARNESS-SKILLS.md) for full reference.
