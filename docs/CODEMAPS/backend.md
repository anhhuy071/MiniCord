<!-- Generated: 2026-06-25 | Files scanned: 59 | Token estimate: ~750 -->

# Backend Architecture

## Stack
Express 5 · Socket.IO 4 · Prisma 5 · MongoDB · bcryptjs · jsonwebtoken · TypeScript (ESM)

## Middleware Chain
```
Request → cors(FRONTEND_ORIGIN) → express.json()
        → RequireAuth (protected REST routes)
        → requireSocketAuth (Socket.IO io.use)
```

## REST Routes

| Method | Path | Handler | Prisma |
|--------|------|---------|--------|
| POST | `/api/auth/register` | auth.routes | user.create |
| POST | `/api/auth/login` | auth.routes | user.findUnique |
| GET | `/api/auth/me` | auth.routes + RequireAuth | user.findUnique |
| GET | `/api/servers` | server.routes + RequireAuth | server.findMany (member filter) |
| POST | `/api/servers` | server.routes + RequireAuth | $transaction: server + member + channels |
| POST | `/api/servers/:serverId/join` | server.routes + RequireAuth | serverMember.create |
| POST | `/api/servers/:serverId/channels` | server.routes + RequireAuth | channel.create (OWNER/ADMIN) |
| GET | `/api/users/:id` | user.routes + RequireAuth | user.findUnique |
| PUT | `/api/users/me` | user.routes + RequireAuth | user.update |
| GET | `/api/dm` | dm.routes + RequireAuth | conversation.findMany |
| POST | `/api/dm/:targetUserId` | dm.routes + RequireAuth | conversation find/create |
| GET | `/api/dm/:conversationId/messages` | dm.routes + RequireAuth | directMessage.findMany |
| GET | `/health` | index.ts inline | — |

## Socket.IO Events

| Event (client→server) | Handler | DB |
|-----------------------|---------|-----|
| `room:join` | join channel room, load history | message.findMany (50) |
| `chat:send` | persist + broadcast | message.create |
| `voice:join` / `voice:leave` | WebRTC room + presence | user.findUnique |
| `voice:signal` | relay SDP/ICE to peer | — |
| `dm:join` | join conversation room | — |
| `dm:send` | persist + broadcast + notify | directMessage.create |

| Event (server→client) | Purpose |
|-----------------------|---------|
| `online:list`, `user:online`, `user:offline` | Presence |
| `room:history`, `chat:message` | Text channel chat |
| `voice:room-users`, `voice:user-joined/left`, `voice:signal`, `voice:presence-update` | Voice |
| `dm:message`, `dm:notification` | Direct messages |

## Key Files
| File | Lines (approx) | Role |
|------|----------------|------|
| `backend/src/index.ts` | 285 | App entry, Socket.IO handlers |
| `backend/src/routes/*.routes.ts` | 4 files | REST endpoints (inline handlers, no service layer) |
| `backend/src/middleware/auth.middleware.ts` | 25 | JWT Bearer validation |
| `backend/src/middleware/socket.middleware.ts` | 32 | Socket JWT auth |
| `backend/src/utils/response.util.ts` | — | `{ success, data, message, error }` envelope |
| `backend/src/lib/prisma.ts` | — | PrismaClient singleton |

## Response Envelope
`sendSuccess(res, data, message, status)` / `sendError(res, error, status)` — used by auth, server, dm routes. User routes use raw `res.json`.
