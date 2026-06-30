# MiniCord project memory

Durable notes for agents (not a substitute for codemaps or TDD evidence).

## Architecture

- Monorepo-style: `frontend/` (Vite React), `backend/` (Express + Socket.IO + Prisma), root harness scripts.
- Real-time: channel chat (`chat:*` events) and DMs (`dm:*` events) via Socket.IO.
- Channel delete-own-message: `chat-socket.service.ts` + `message.util.ts` (see `.cursor/tdd/delete-own-message.tdd.md`).
- DM user chat: `dm-socket.service.ts` + `useDirectMessages` (see `.cursor/tdd/dm-user-chat.tdd.md`).

## Harness

- Cursor hooks: `.cursor/hooks.json`
- Metrics default: `~/.cursor/ecc/metrics/` (override with `ECC_METRICS_DIR`)
- Agent sort plan: `.cursor/agent-sort-plan.md`

## Conventions

- Immutable state updates in React utils.
- Backend business logic in `services/`, thin socket wiring in `index.ts`.
- Tests: Vitest (backend + frontend), harness tests in `tests/*.test.js`.
