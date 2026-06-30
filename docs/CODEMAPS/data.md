<!-- Generated: 2026-06-30 | Files scanned: 68 | Token estimate: ~620 -->

# Data Architecture

## Database
**MongoDB 6** via Prisma (`provider = "mongodb"`). Requires **replica set** for `$transaction` (server creation).

Connection: `DATABASE_URL` (e.g. `mongodb://mongodb:27017/minicord?replicaSet=rs0`)

## Schema (`backend/prisma/schema.prisma`)

```
User ──┬──< ServerMember >── Server ──< Channel ──< Message
       ├──< Message (author)
       ├──< Conversation (userOne / userTwo)
       └──< DirectMessage (author)

Conversation ──< DirectMessage
```

## Models

| Model | Key Fields | Relations |
|-------|------------|-----------|
| **User** | id, email (unique), username (unique), password, avatarUrl | members, messages, conversations, directMessages |
| **Server** | id, name, imageUrl, ownerId | channels, members |
| **ServerMember** | userId, serverId, role (OWNER/MEMBER/ADMIN) | @@unique([userId, serverId]) |
| **Channel** | name, type (TEXT/VOICE), serverId | @@unique([name, serverId]) |
| **Message** | content, authorId, channelId, fileUrl? | text channel messages (hard delete on user delete) |
| **Conversation** | userOneId, userTwoId | @@unique([userOneId, userTwoId]) |
| **DirectMessage** | content, authorId, conversationId | DM messages |

## API Payload Notes
Socket/API message DTOs include `authorId` for ownership checks in UI; schema unchanged.

## Cascade Deletes
All relations use `onDelete: Cascade`.

## Migrations
No migration history folder — schema applied via `prisma db push` (dev/demo workflow).

## Seed Data (`backend/prisma/seed.ts`)
- Wipes all collections, then creates:
  - Users: admin, alice, bob, charlie (passwords in seed script)
  - Sample servers, channels (TEXT + VOICE), messages, conversations, DMs

Run: `npm run seed` (backend) or `docker compose exec backend npm run seed`

## Transaction Usage
`POST /api/servers` — atomic create: Server + ServerMember(OWNER) + default channels (`general`, `Lobby`).
