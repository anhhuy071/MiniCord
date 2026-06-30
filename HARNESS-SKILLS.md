# Harness + Skills Guide (MiniCord)

How to use the ECC Cursor harness together with project skills when building MiniCord.

## How the pieces fit

| Layer | What it does | How you interact |
|-------|----------------|------------------|
| **Harness** | Hooks, metrics, orchestration, safety gates | `/observability`, `npm run …`, log files |
| **Skills** | Step-by-step workflows (TDD, React, backend, etc.) | Mention in chat, or agent auto-picks |
| **Rules** | Always-on constraints (80% tests, security, immutability) | Automatic |
| **Commands** | Structured workflows that reference skills | `/plan`, `/feature-dev`, etc. |

```
You (Cursor chat)
    → Slash commands (/plan, /feature-dev)
    → Skills (auto or explicit)
    → Agent → MiniCord code
    → Hooks → ~/.claude/metrics logs (automatic)
```

## Setup

```bash
npm install
npm run observability:ready
npm run test
npm run observability:inspect
```

See [HARNESS.md](./HARNESS.md) for log locations, CLI reference, and environment variables.

## Observability (CLI + logs)

**Use the terminal, not a web UI.** Harness metrics are written automatically during Cursor Agent sessions. Inspect them with npm scripts or by reading JSONL files directly.

### Quick commands

| Goal | Command |
|------|---------|
| Health check | `npm run observability:ready` |
| Full snapshot (JSON) | `npm run observability:inspect` |
| Human-readable summary | `node scripts/session-inspect.js --live` |
| Subagents only | `node scripts/session-inspect.js --subagents` |
| Costs | `node scripts/session-inspect.js --cost` |
| Orchestration workers | `npm run orchestration:status` |
| In chat | `/observability` or `/observability inspect` |

### Log directory

Default (Windows): `%USERPROFILE%\.claude\metrics\`

Override: set `ECC_METRICS_DIR` to a custom path.

| File | What it contains |
|------|------------------|
| `harness.log.jsonl` | Eval results, orchestrator events, component log |
| `subagents.jsonl` | Subagent spawn / complete (bugbot, security-review, etc.) |
| `tool-usage.jsonl` | Per-tool activity (sanitized) |
| `telemetry-events.jsonl` | Telemetry dispatch |
| `costs.jsonl` | Session cost totals |
| `orchestration.jsonl` | Pipeline gates, worker handoffs |
| `eval-runs.jsonl` | Eval runner results |

**Live session bridge** (only while an agent session is active):

`%TEMP%\ecc-metrics-{sessionId}.json`

### Tail logs (PowerShell)

```powershell
Get-Content $env:USERPROFILE\.claude\metrics\harness.log.jsonl -Tail 10
Get-Content $env:USERPROFILE\.claude\metrics\subagents.jsonl -Tail 10
Get-Content $env:USERPROFILE\.claude\metrics\tool-usage.jsonl -Tail 10
```

### When logs look empty

`observability:inspect` often shows `"sessionId": null` and `"subagents": []` when **no agent work is running**. That is normal.

Data appears when you:

- Use Cursor Agent in this repo (tools, edits, shell commands)
- Spawn subagents (`/multi-agent`, bugbot, security-review)
- Run orchestration pipelines (`/orch-*`)

`harness.log.jsonl` may still have historical `eval: PASS` lines even when live fields are empty.

### Recurring check (optional)

```
/loop 5m npm run observability:inspect and summarize subagents + harness log
```

---

## Typical workflow for MiniCord

MiniCord stack: **React + TypeScript + Vite** (frontend), **Node/Express + Socket.IO + Prisma + MongoDB** (backend).

### 1. Plan (harness command)

```
/plan Add member presence indicators to the members sidebar
```

Creates a phased plan, mirrors existing patterns, and waits for approval before coding.

### 2. Implement (domain skills)

After confirming the plan:

```
Implement the approved plan using tdd-workflow.
Follow backend-patterns for API/socket changes and react-patterns for UI.
```

| Task area | Skill |
|-----------|-------|
| API / socket logic | `backend-patterns`, `api-design`, `error-handling` |
| React components / hooks | `react-patterns`, `frontend-patterns` |
| Tests | `tdd-workflow`, `react-testing`, `e2e-testing` |
| UI polish | `make-interfaces-feel-better`, `motion-ui` |
| Pre-launch check | `production-audit` |
| Library docs | `documentation-lookup` |

### 3. Monitor (harness observability)

```
/observability inspect
```

Or in terminal:

```bash
npm run observability:inspect
npm run orchestration:status
```

### 4. Review and ship

```
/code-review
/security-scan
/pr
```

## Three ways to combine harness + skills

### A. Command → skill chain (most common)

```
/plan <feature>     → wait for yes
→ "implement with tdd-workflow"
→ /code-review
→ /pr
```

### B. Structured feature pipeline

```
/feature-dev Add real-time member online status
```

Phases: discovery → exploration → design → implementation → review. Add stack skills during implementation.

### C. Multi-agent + observability (bigger work)

```
/multi-agent
```

Use `multi-agent-playbook` skill. Before spawning agents:

```bash
npm run observability:ready
npm run observability:inspect
```

## What runs automatically

Via `.cursor/rules/` and `.cursor/hooks.json`:

- Security gates (no `--no-verify`, validation reminders)
- TDD expectation (80% coverage, unit + integration + E2E)
- Development workflow (plan → TDD → review → commit)
- Session hooks (tool usage, costs, subagent events → metrics files)
- Post-edit hooks (formatting / typecheck)

## Example prompts

**Bug fix:**

```
Fix the socket reconnect logic. Use tdd-workflow and error-handling.
```

**New feature:**

```
/plan Show online/offline status for server members in MembersSidebar

[after approval]
Implement with tdd-workflow. Mirror existing useSocket patterns.
Use react-testing for frontend and backend-patterns for socket events.
```

**Discover skills:**

```
/ecc-guide skills
/ecc-guide find: socket
```

## Quick reference

| Goal | Use |
|------|-----|
| Plan before coding | `/plan` |
| Full feature workflow | `/feature-dev` |
| TDD implementation | `tdd-workflow` skill |
| Check harness health | `/observability` or `npm run observability:ready` |
| Watch agent activity | `/observability inspect` or tail `subagents.jsonl` |
| Multi-agent pattern | `/multi-agent` + `multi-agent-playbook` |
| Find the right skill | `/ecc-guide find: <topic>` |
| MiniCord stack patterns | `backend-patterns`, `react-patterns`, `e2e-testing` |

## Mental model

- **Harness** = operating system (logging, hooks, commands, safety)
- **Skills** = specialized manuals (TDD, React, API design)
- **Rules** = laws that always apply
- **Commands** = recipes that tell the agent which manuals to open

Skills are invoked through chat or auto-selected by the agent; the harness records and guards everything in the background via log files and hooks.
