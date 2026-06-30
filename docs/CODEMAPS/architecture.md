<!-- Generated: 2026-06-30 | Files scanned: 68 | Token estimate: ~720 -->

# MiniCord Architecture

## Project Type
Monorepo-style demo app: **React SPA + Express API + Socket.IO + MongoDB** (Docker Compose for local dev). Root `package.json` is ECC agent harness (observability scripts) — not runtime.

## System Boundaries

```
┌─────────────┐   REST /api/*    ┌──────────────────────────────┐
│  Frontend   │◄────────────────►│  Backend (Express + Socket.IO)│
│  Vite/React │   WS (Socket.IO) │  Port 3000                    │
└─────────────┘                  └──────────────┬───────────────┘
     :5173 dev / :80 docker                      │ Prisma ORM
                                                 ▼
                                    ┌────────────────────────────┐
                                    │  MongoDB 6 (replica set)   │
                                    └────────────────────────────┘
```

## Entry Points
| Layer | File | Role |
|-------|------|------|
| Frontend | `frontend/src/main.tsx` | React bootstrap |
| Frontend | `frontend/src/App.tsx` | Router + AuthProvider |
| Backend | `backend/src/index.ts` | Express app, REST mount, Socket.IO server |
| DB seed | `backend/prisma/seed.ts` | Dev/test data |
| Infra | `docker-compose.yml` | mongodb + backend + frontend |

## Data Flow (Real-Time Chat)

```
Send:
  User types → useSocket.sendMessage → emit chat:send
  → index.ts → prisma.message.create → io.to(channelId).emit chat:message
  → useSocket (appendChannelMessage) → MainContent re-render

Delete (own messages):
  User clicks delete → useSocket.deleteMessage → emit chat:delete
  → chat-socket.service.deleteOwnChannelMessage → prisma.message.delete
  → io.to(channelId).emit chat:deleted → removeChannelMessage in client state
```

## Data Flow (Voice)

```
VoicePanel → useVoiceRoom → getUserMedia + voice:join
  → WebRTC peer mesh via voice:signal relay
  → voice:presence-update broadcast (in-memory voicePresences map)
```

## In-Memory State (Backend)
- `onlineUsers: Map<userId, Set<socketId>>` — presence tracking
- `voicePresences: Map<channelId, User[]>` — voice channel occupants

## Key Directories
```
MiniCord/
├── frontend/src/       # React UI, hooks, utils, component tests
├── backend/src/        # Express routes, services, Socket handlers
├── backend/prisma/     # schema.prisma, seed.ts
├── docs/CODEMAPS/      # Architecture docs (this folder)
├── scripts/            # ECC harness / observability (dev tooling)
└── docker-compose.yml
```

## Auth Model
JWT (Bearer header for REST, `auth.token` for Socket.IO handshake). Token signed in `backend/src/utils/jwt.util.ts`. Channel/DM socket actions gated by `socket-auth.util.ts` helpers.
