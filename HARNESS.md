# ECC Harness Template (MiniCord)

Portable **Cursor agent harness** with **observability logging** via hooks and JSONL metrics. Copy into any project root.

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

## Observability (recommended)

Use **CLI + log files**. Metrics are appended automatically when Cursor Agent runs with hooks enabled.

### npm scripts

| Script | Purpose |
|--------|---------|
| `observability:ready` | Preflight: hooks, metrics dir, telemetry scripts |
| `observability:inspect` | JSON snapshot (live bridge, subagents, harness log tail) |
| `orchestration:status` | List orchestration sessions / workers |
| `observability:export` | Export telemetry |
| `harness:audit` | Harness quality scorecard |
| `eval:check` / `eval:report` | Eval runner |

### Log directory

| Platform | Default path |
|----------|--------------|
| Windows | `%USERPROFILE%\.claude\metrics\` |
| macOS / Linux | `~/.claude/metrics/` |

Override with `ECC_METRICS_DIR`.

### Log files

| File | Purpose |
|------|---------|
| `harness.log.jsonl` | Component log (eval, orchestrator, harness events) |
| `subagents.jsonl` | Subagent spawn/complete |
| `telemetry-events.jsonl` | Tool telemetry dispatch |
| `tool-usage.jsonl` | Per-tool activity |
| `costs.jsonl` | Session costs (stop hook) |
| `orchestration.jsonl` | Orchestrator pipeline events |
| `eval-runs.jsonl` | Eval results |

**Live bridge** (active agent session only): `%TEMP%/ecc-metrics-{session}.json`

Each line in `*.jsonl` files is one JSON object.

### CLI reference

```bash
# Snapshot (same as npm run observability:inspect)
node scripts/session-inspect.js --live --json

# Readable summary
node scripts/session-inspect.js --live

# Focused views
node scripts/session-inspect.js --subagents
node scripts/session-inspect.js --cost
node scripts/orchestration-status.js --list
node scripts/eval-runner.js check
```

### PowerShell: tail recent entries

```powershell
Get-Content $env:USERPROFILE\.claude\metrics\harness.log.jsonl -Tail 15
Get-Content $env:USERPROFILE\.claude\metrics\subagents.jsonl -Tail 15
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `ECC_METRICS_DIR` | Custom metrics directory |
| `ECC_HOOK_PROFILE` | `minimal` \| `standard` (default) \| `strict` |
| `ECC_DISABLED_HOOKS` | Comma-separated hook IDs to skip |
| `ECC_ORCHESTRATION_ROOT` | Orchestration state root |

### Interpreting empty inspect output

| Field | Idle meaning |
|-------|----------------|
| `sessionId: null` | No live Cursor agent bridge file |
| `live: null` | No active session metrics |
| `subagents: []` | No recent subagent events |
| `harnessLog: [...]` | Historical log lines may still be present |

Run agent work (`/plan`, `/multi-agent`, edits via Agent) then re-run `observability:inspect`.

## Key slash commands

| Command | Purpose |
|---------|---------|
| `/observability` | Readiness + live inspect |
| `/multi-agent` | Pattern selection runbook |
| `/orchestration-status` | Worker/handoff grid |
| `/plan` | Plan before coding |
| `/gan-build` | Generator-evaluator loop |
| `/harness-audit` | Harness quality scorecard |

## Start building

1. `/plan <feature>`
2. `/feature-dev` or implement with `tdd-workflow`
3. `/observability inspect` during long runs

See [HARNESS-SKILLS.md](./HARNESS-SKILLS.md) for MiniCord-specific workflow and skill pairings.
