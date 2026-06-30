---
name: skill-library
description: Router for MiniCord ECC LIBRARY surfaces — skills, commands, and rules kept off the default session load but reachable on demand. Use when you need eval harness, hookify, GAN, orchestration worktrees, or generic web rule packs.
---

# Skill Library (MiniCord)

ECC surfaces sorted by `agent-sort` into **DAILY** (default session) vs **LIBRARY** (searchable reference).

## When to use this router

- Task needs eval/GAN/orchestration/hookify workflows
- You want generic web rule guidance beyond React+TypeScript packs
- User explicitly asks for a demoted pack

## DAILY (default)

**Stack:** React 19 + Vite + TypeScript frontend; Node/Express + Socket.IO + Prisma + MongoDB backend; Vitest; ECC harness.

| Area | Location |
|------|----------|
| Skills | `.cursor/skills/` (17 packs) |
| Commands | `.cursor/commands/` (25 shims) |
| Rules | `.cursor/rules/common-*`, `react-*`, `typescript-*` |

**Trigger keywords → DAILY skills**

| Keywords | Skill |
|----------|-------|
| API, REST, routes, socket events | `api-design`, `backend-patterns` |
| React, hooks, components, Vite | `react-patterns`, `frontend-patterns`, `react-performance` |
| tests, TDD, coverage | `tdd-workflow`, `react-testing`, `e2e-testing`, `verification-loop` |
| errors, try/catch, validation | `error-handling` |
| UI polish, motion, design | `make-interfaces-feel-better`, `motion-ui`, `frontend-design-direction` |
| docs, library API | `documentation-lookup` |
| pre-launch, production | `production-audit` |
| multi-agent, harness | `multi-agent-playbook` |
| plan, feature, review, PR | slash commands in `.cursor/commands/` |

## LIBRARY (on demand)

Paths under `.cursor/library/`.

### Skills (`.cursor/library/skills/`)

| Skill | Trigger when |
|-------|----------------|
| `ai-regression-testing` | AI-assisted regression / sandbox API testing |
| `eval-harness` | Formal eval-driven development sessions |
| `hookify-rules` | Creating custom Cursor hook rules |
| `strategic-compact` | Manual context compaction strategy |

### Commands (`.cursor/library/commands/`)

| Command | Trigger when |
|---------|----------------|
| `eval-check`, `eval-define`, `eval-report` | ECC eval harness workflows |
| `gan-build`, `gan-design` | GAN harness generation |
| `hookify`, `hookify-configure`, `hookify-help`, `hookify-list` | Hookify rule authoring |
| `orch-*`, `orchestration-status` | Git worktree multi-agent orchestration |

### Rules (`.cursor/library/rules/`)

| Pack | Trigger when |
|------|----------------|
| `web-*` | Generic web patterns beyond React+TS path rules |

## How to load a library item

1. Read the file directly from `.cursor/library/...`
2. Or tell the agent: "use the library skill `eval-harness`"
3. Full classification evidence: `.cursor/agent-sort-plan.md`
