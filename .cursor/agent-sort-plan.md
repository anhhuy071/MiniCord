# Agent Sort Plan — MiniCord

**Date:** 2026-06-29  
**Stack evidence:** 39 TS/TSX source files (`frontend/src`, `backend/src`); React 19 + Vite 7; Express 5 + Socket.IO 4 + Prisma 5 + MongoDB; Vitest backend tests; Docker Compose; ECC harness template (`package.json`, `HARNESS.md`, `HARNESS-SKILLS.md`).

## STACK

| Layer | Evidence |
|-------|----------|
| Frontend | `frontend/package.json` — react, vite, react-router-dom, socket.io-client, bootstrap |
| Backend | `backend/package.json` — express, socket.io, prisma, bcryptjs, jsonwebtoken |
| Language | TypeScript throughout; no Python/Go/Rust/Java/Dart/PHP/Swift source |
| Tests | `backend` vitest; harness `tests/*.test.js`; no Jest/Playwright in frontend yet |
| Ops | `docker-compose.yml`, `DEPLOYMENT.md` |

---

## DAILY (18 skills, 25 commands, 20 rules)

Always-loaded surfaces for every MiniCord session.

### Skills — `.cursor/skills/`

| Skill | Evidence |
|-------|----------|
| `api-design` | REST routes in `backend/src/routes/*`, socket events in `index.ts` |
| `backend-patterns` | Express + Prisma + Socket.IO monolith |
| `coding-standards` | TS/React/Node per `HARNESS-SKILLS.md` |
| `documentation-lookup` | Prisma, Socket.IO, Vite doc lookups |
| `e2e-testing` | Critical chat/DM flows (planned) |
| `error-handling` | `sendError`, socket auth guards |
| `frontend-design-direction` | Bootstrap custom UI in `styles.css` |
| `frontend-patterns` | React 19 app shell |
| `make-interfaces-feel-better` | MembersSidebar, chat UI polish |
| `motion-ui` | UI motion when polishing |
| `multi-agent-playbook` | Harness multi-agent commands active |
| `production-audit` | Pre-deploy checks (`DEPLOYMENT.md`) |
| `react-patterns` | 28 `.tsx` components |
| `react-performance` | `useSocket`, layout state |
| `react-testing` | Frontend test gap-fill |
| `skill-library` | Router to LIBRARY packs |
| `tdd-workflow` | `common-testing.mdc` mandates TDD |
| `verification-loop` | Harness verification |

### Commands — `.cursor/commands/`

`plan`, `plan-prd`, `feature-dev`, `code-review`, `review-pr`, `pr`, `security-scan`, `build-fix`, `react-build`, `react-test`, `react-review`, `test-coverage`, `refactor-clean`, `observability`, `harness-audit`, `quality-gate`, `multi-agent`, `multi-plan`, `multi-frontend`, `multi-execute`, `update-codemaps`, `update-docs`, `setup-pm`, `checkpoint`, `ecc-guide`

### Rules — `.cursor/rules/`

| Pack | Evidence |
|------|----------|
| `common-*` (10) | Universal workflow, security, TDD — `alwaysApply: true` |
| `typescript-*` (5) | All `.ts` source — promoted to `alwaysApply: true` |
| `react-*` (5) | Path globs on `**/*.tsx`, components — already active |

### Hooks & scripts

**DAILY** — full harness runtime (`.cursor/hooks.json`, `.cursor/scripts/*`) — repo is `ecc-harness-template@2.0.0`.

---

## LIBRARY (4 skills, 15 commands, 7 rules)

Kept under `.cursor/library/` — searchable, not default-loaded.

### Skills — `.cursor/library/skills/`

| Skill | Evidence |
|-------|----------|
| `ai-regression-testing` | Harness meta; not daily app dev |
| `eval-harness` | Occasional eval sessions only |
| `hookify-rules` | Custom hook authoring — rare |
| `strategic-compact` | Context trimming — occasional |

### Commands — `.cursor/library/commands/`

| Command | Evidence |
|---------|----------|
| `eval-check`, `eval-define`, `eval-report` | Eval harness — occasional |
| `gan-build`, `gan-design` | GAN harness — not MiniCord core |
| `hookify*` (4) | Hook customization — rare |
| `orch-*`, `orchestration-status` (6) | Worktree orchestration — opt-in |

### Rules — `.cursor/library/rules/`

| Pack | Evidence |
|------|----------|
| `web-*` (7) | Redundant with `react-*` + `typescript-*` for Vite/React stack; generic web guidance retained for reference |

---

## INSTALL PLAN (applied)

| Action | Target |
|--------|--------|
| MOVE | 4 skills → `.cursor/library/skills/` |
| MOVE | 15 commands → `.cursor/library/commands/` |
| MOVE | 7 web rules → `.cursor/library/rules/` |
| PROMOTE | `typescript-*` rules → `alwaysApply: true` |
| CREATE | `.cursor/skills/skill-library/SKILL.md` router |
| CREATE | `.cursor/agent-sort-plan.md` (this file) |

No off-stack language packs were installed (no python/golang/flutter rules present).

---

## VERIFICATION

```bash
npm run observability:ready
npm run test
```

| Check | Result |
|-------|--------|
| DAILY skills | 18 (17 + skill-library router) |
| LIBRARY skills | 4 |
| DAILY commands | 25 |
| LIBRARY commands | 15 |
| DAILY rules | 20 |
| LIBRARY rules | 7 |
| Stale language rules | None found |
| Incompatible hooks removed | None — harness hooks retained |

---

## Acceptance

- [x] Stack promoted to DAILY (typescript rules + core skills/commands)
- [x] Unused packs demoted to LIBRARY
- [x] skill-library router created
- [x] Evidence-backed plan artifact written
