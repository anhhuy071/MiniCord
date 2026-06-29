<!-- Generated: 2026-06-25 | Files scanned: 59 | Token estimate: ~650 -->

# MiniCord Architecture

## Project Type
Monorepo-style demo app: **React SPA + Express API + Socket.IO + MongoDB** (Docker Compose for local dev).

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
User types message
  → useSocket.sendMessage → emit chat:send
  → index.ts handler → prisma.message.create
  → io.to(channelId).emit chat:message
  → useSocket listener → MainContent re-render
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
├── frontend/src/     # React UI, hooks, API client
├── backend/src/      # Express routes, Socket handlers, middleware
├── backend/prisma/   # schema.prisma, seed.ts
└── docker-compose.yml
```

## Auth Model
JWT (Bearer header for REST, `auth.token` for Socket.IO handshake). Token signed in `backend/src/utils/jwt.util.ts`.
