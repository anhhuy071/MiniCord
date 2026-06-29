# ECC Harness Template (Agtest)

Portable **Cursor agent harness** with **full observability logging**. Copy into any project root.

## Copy into a new project

```powershell
Copy-Item -Recurse "path\to\Agtest\.cursor" ".\.cursor"
Copy-Item -Recurse "path\to\Agtest\scripts" ".\scripts"
Copy-Item "path\to\Agtest\package.json" ".\package.json"
Copy-Item -Recurse "path\to\Agtest\schemas" ".\schemas"
Copy-Item -Recurse "path\to\Agtest\tests" ".\tests"
```

**Do not copy:** `.git/`, `ecc-install-state.json` (machine-specific install provenance).

**Canonical runtime:** `.cursor/scripts/` holds hook runtime. Root `scripts/` is a junction → `.cursor/scripts/` on this template (Windows). When copying to a new project, copy `.cursor/` and either recreate the junction or copy `.cursor/scripts` to `scripts/` at project root.

## Verify

```bash
npm run observability:ready
npm run test
npm run observability:inspect
```

Open dashboard: `npm run observability:dashboard` → http://127.0.0.1:8765

## Observability logs

| File | Purpose |
|------|---------|
| `~/.claude/metrics/harness.log.jsonl` | Component log (stderr + JSONL) |
| `~/.claude/metrics/subagents.jsonl` | Subagent spawn/complete |
| `~/.claude/metrics/telemetry-events.jsonl` | Tool telemetry dispatch |
| `~/.claude/metrics/tool-usage.jsonl` | Per-tool activity |
| `~/.claude/metrics/costs.jsonl` | Session costs (stop hook) |
| `~/.claude/metrics/orchestration.jsonl` | Orchestrator events |
| `~/.claude/metrics/eval-runs.jsonl` | Eval results |
| `%TEMP%/ecc-metrics-{session}.json` | Live session bridge |

Env overrides: `ECC_METRICS_DIR`, `ECC_HOOK_PROFILE`, `ECC_DISABLED_HOOKS`, `ECC_ORCHESTRATION_ROOT`.

## Key commands

| Command | Purpose |
|---------|---------|
| `/observability` | Readiness + live inspect |
| `/multi-agent` | Pattern selection runbook |
| `/orchestration-status` | Worker/handoff grid |
| `/plan` | Plan before coding |
| `/gan-build` | Generator-evaluator loop |
| `/harness-audit` | Harness quality scorecard |

## CLI reference

```bash
node scripts/session-inspect.js --live
node scripts/orchestration-status.js --list
node scripts/control-pane.js --read-only
node scripts/eval-runner.js check
```

## Start building

1. `/plan <feature>`
2. `/feature-dev` or `/gan-build "<brief>"`
3. `/observability inspect` during long runs
