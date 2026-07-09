<!-- Generated: 2026-07-09 | Files scanned: 75 | Token estimate: ~600 -->

# Dependencies & Integrations

## External Services

| Service | Usage | Config |
|---------|-------|--------|
| **MongoDB 6** | Primary data store (Prisma) | `DATABASE_URL`, Docker replica set `rs0` |
| **Google STUN** | WebRTC ICE (`stun.l.google.com:19302`) | Hardcoded in `useVoiceRoom.ts` |
| **pravatar.cc** | Seed avatar URLs | seed.ts only |

## Backend npm Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2 | HTTP server |
| socket.io | ^4.8 | WebSocket real-time |
| @prisma/client | ^5.22 | ORM |
| bcryptjs | ^3.0 | Password hashing |
| jsonwebtoken | ^9.0 | JWT auth |
| cors | ^2.8 | CORS for SPA |

Dev: prisma, tsx, typescript, vitest, @types/*

## Frontend npm Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | ^19.2 | UI |
| react-router-dom | ^7.13 | Routing |
| socket.io-client | ^4.8 | Real-time client |
| bootstrap | ^5.3 | UI framework |
| @fortawesome/fontawesome-free | ^6.7 | Icons |

Dev: vite, vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom, eslint, typescript

## Root Package (`ecc-harness-template`)
Agent observability harness scripts — **not part of MiniCord runtime**. Optional: ajv, sql.js, @iarna/toml.

## Docker Services (`docker-compose.yml`)

| Service | Image/Build | Port | Notes |
|---------|-------------|------|-------|
| mongodb | mongo:6.0-jammy | 27017 | Auto-init replica set |
| backend | `./backend/Dockerfile` | 3000 | JWT_SECRET in compose env |
| frontend | `./frontend/Dockerfile` | 80 | nginx serves static build |

## Shared Libraries (Cross-Cutting)
- **JWT**: shared secret `JWT_SECRET` (backend env)
- **ApiResponse envelope**: `{ success, data, message, error }` — backend util + frontend types
- **Socket auth**: same JWT passed as `auth: { token }` on connect

## Not Present
Redis, message queue, object storage, OAuth providers, rate limiting middleware, CSRF tokens.
