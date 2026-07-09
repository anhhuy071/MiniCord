<!-- Generated: 2026-07-09 | Files scanned: 75 | Token estimate: ~950 -->

# Backend Architecture

## Stack
Express 5 · Socket.IO 4 · Prisma 5 · MongoDB · bcryptjs · jsonwebtoken · TypeScript (ESM) · Vitest

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
| GET | `/api/servers/:serverId/members` | server.routes + RequireAuth | serverMember.findMany |
| POST | `/api/servers/:serverId/join` | server.routes + RequireAuth | serverMember.create |
| POST | `/api/servers/:serverId/channels` | server.routes + RequireAuth | channel.create (OWNER/ADMIN) |
| GET | `/api/users/:id` | user.routes + RequireAuth | user.findUnique |
| PUT | `/api/users/me` | user.routes + RequireAuth | user.update |
| GET | `/api/dm` | dm.routes + RequireAuth | conversation.findMany |
| POST | `/api/dm/:targetUserId` | dm.routes + RequireAuth | conversation find/create |
| GET | `/api/dm/:conversationId/messages` | dm.routes + RequireAuth | directMessage.findMany |
| GET | `/health` | index.ts inline | — |

## Socket.IO Events

| Event (client→server) | Handler | Service / DB |
|-----------------------|---------|--------------|
| `room:join` | join channel room, load history | assertChannelMember → message.findMany (50) |
| `chat:send` | persist + broadcast | assertChannelMember → message.create |
| `chat:delete` | delete own message + broadcast | deleteOwnChannelMessage → message.delete |
| `voice:join` / `voice:leave` | WebRTC room + presence | assertChannelMember → user.findUnique |
| `voice:signal` | relay SDP/ICE to peer | — |
| `dm:join` | join conversation room | assertConversationParticipant |
| `dm:send` | persist + broadcast + notify | directMessage.create |

| Event (server→client) | Purpose |
|-----------------------|---------|
| `online:list`, `user:online`, `user:offline` | Presence |
| `room:history`, `chat:message`, `chat:deleted` | Text channel chat |
| `chat:error`, `room:error` | Client error feedback |
| `voice:room-users`, `voice:user-joined/left`, `voice:signal`, `voice:presence-update` | Voice |
| `dm:message`, `dm:notification` | Direct messages |

## Service Layer

| Service | File | Role |
|---------|------|------|
| Chat socket | `services/chat-socket.service.ts` | Payload validation, deleteOwnChannelMessage, error mapping |
| DM socket | `services/dm-socket.service.ts` | Payload validation, load direct message history, direct message sending, notification targets selection, error mapping |

Auth helpers (no separate service): `utils/socket-auth.util.ts` — assertChannelMember, assertMessageOwner, assertConversationParticipant, assertServerMember.

## Key Files
| File | Role |
|------|------|
| `backend/src/index.ts` | App entry, Socket.IO handlers (thin; delete delegates to service) |
| `backend/src/routes/*.routes.ts` | REST endpoints (inline handlers) |
| `backend/src/services/chat-socket.service.ts` | Channel message delete business logic |
| `backend/src/services/dm-socket.service.ts` | Direct message socket logic & payload validators |
| `backend/src/middleware/auth.middleware.ts` | JWT Bearer validation |
| `backend/src/middleware/socket.middleware.ts` | Socket JWT auth |
| `backend/src/utils/response.util.ts` | `{ success, data, message, error }` envelope |
| `backend/src/utils/message-query.util.ts` | chronologicalFromLatest |
| `backend/src/utils/user.util.ts` | PUBLIC_USER_SELECT constant |
| `backend/src/lib/prisma.ts` | PrismaClient singleton |

## Tests
Vitest in `backend/src/**/*.test.ts` — socket-auth, message-query, chat-socket service, dm-socket service (46 tests).

## Response Envelope
`sendSuccess(res, data, message, status)` / `sendError(res, error, status)` — auth, server, dm routes. User routes use raw `res.json`.
