# MiniCord — Agent Instructions

Cursor Agent and ECC harness guidance for this repository.

## Stack

- **Frontend**: React 19, Vite, TypeScript (`frontend/`)
- **Backend**: Express 5, Socket.IO 4, Prisma 5, MongoDB (`backend/`)
- **Harness**: ECC Cursor template (`.cursor/`, root `scripts/` junction)

## Before coding

1. Read relevant codemaps under `docs/CODEMAPS/` when touching architecture.
2. Use `/plan` for multi-file features; wait for confirmation before implementation.
3. Follow **TDD** (`tdd-workflow` skill): tests first, then implementation.
4. Mirror existing patterns — service layer on backend, hooks + utils on frontend.

## Commands (daily)

| Goal | Command |
|------|---------|
| Plan | `/plan` |
| Implement with TDD | mention `tdd-workflow` skill |
| Review | `/code-review` |
| Harness health | `/observability` or `npm run observability:ready` |
| Audit scorecard | `npm run harness:audit` |

## Artifact paths (Cursor)

| Artifact | Path |
|----------|------|
| Plans | `.cursor/plans/` |
| PRDs | `.cursor/prds/` |
| TDD evidence | `.cursor/tdd/` |
| Reviews | `.cursor/reviews/` |

## Validation

```bash
cd backend && npm test && npm run build
cd frontend && npm test && npm run build
npm run test
npm run observability:ready
```

## Do not

- Commit `.env` or secrets
- Skip git hooks (`--no-verify`)
- Mutate state in place — prefer immutable updates

See [HARNESS-SKILLS.md](./HARNESS-SKILLS.md) for harness + skills workflow.
