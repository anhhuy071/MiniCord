# TDD Evidence: DM User Chat

**Source plan**: Inline `/plan` conversation (cập nhật tin nhắn trực tiếp và tính năng chat với người dùng)  
**Completed**: 2026-06-30

## User Journeys

1. As a server member, I want to message another member directly, so that I can chat privately outside channels.
2. As a user in an active DM, I want to send and receive messages in real time, so that the conversation stays in sync without refresh.
3. As a user with multiple DMs, I want a conversation list with unread badges, so that I can switch between private chats.
4. As a channel user, I want DM state separate from channel chat, so that opening a DM does not corrupt channel message history.

## Task Report

| Task | Summary | Validation | Result |
|------|---------|------------|--------|
| DM service layer | `dm-socket.service.ts` — send, history, payload validation | `npm test` (backend) | PASS — 13 tests |
| Socket refactor | `dm:join` + `dm:history`, `dm:send` via service, `dm:error` | `npm run build` (backend) | PASS |
| DM utils | `appendDmMessage`, optimistic merge, participant helpers | `npm test` (frontend util) | PASS — 6 tests |
| DM hook | `useDirectMessages` — REST + socket, unread counts | `npm run build` (frontend) | PASS |
| Channel isolation | Removed `dm:message` handler from `useSocket` | `npm test` (frontend) | PASS |
| DM UI | `DirectMessagePanel`, `ConversationList`, member message action | `npm test` (DirectMessagePanel) | PASS — 3 tests |
| App wiring | `AppLayout` view switch channel ↔ DM | `npm run build` (frontend) | PASS |

## Test Specification

| # | What is guaranteed | Test file / command | Type | Result |
|---|-------------------|---------------------|------|--------|
| 1 | Invalid DM send/join payloads rejected before DB | `dm-socket.service.test.ts:isValidDm*` | unit | PASS |
| 2 | Participant can send DM; non-participant forbidden | `dm-socket.service.test.ts:sendDirectMessage` | unit | PASS |
| 3 | DM history returned chronologically for participants | `dm-socket.service.test.ts:loadDirectMessageHistory` | unit | PASS |
| 4 | Conversation `updatedAt` bumped on send | `dm-socket.service.test.ts:sendDirectMessage` | unit | PASS |
| 5 | Client appends DM messages immutably with dedup | `dm.util.test.ts:appendDmMessage` | unit | PASS |
| 6 | Optimistic DM replaced by server message | `dm.util.test.ts:appendDmMessage` | unit | PASS |
| 7 | Other participant resolved from conversation | `dm.util.test.ts:getOtherParticipant` | unit | PASS |
| 8 | DM panel shows peer name and sends on submit | `DirectMessagePanel.test.tsx` | component | PASS |
| 9 | Back button returns to channel view | `DirectMessagePanel.test.tsx` | component | PASS |
| 10 | Channel delete-message UI unchanged | `MainContent.test.tsx` | component | PASS |

## Commands Run

```bash
cd backend && npm test    # 41 passed
cd frontend && npm test   # 36 passed
cd backend && npm run build
cd frontend && npm run build
```

## Coverage and Known Gaps

- **Unit + component**: Auth, DM service, utils, DirectMessagePanel covered.
- **Integration**: Socket handlers in `index.ts` are thin; logic covered via `dm-socket.service`.
- **E2E**: Not added. Manual smoke: two browsers, message member, send/receive DM, switch conversations.

## Regression: Code Review HIGH Fixes (2026-06-30)

| Task | Summary | Validation | Result |
|------|---------|------------|--------|
| DM unread dedup | `applyDmUnreadOnMessage` / `applyDmUnreadOnNotification` pure helpers | `dm.util.test.ts` | PASS — 4 tests |
| Notification targeting | `selectDmNotificationTargets` skips in-room + sender sockets | `dm-socket.service.test.ts` | PASS — 3 tests |
| DM leave | `dm:leave` handler + client emit on close/switch | backend build | PASS |
| Delete rollback | Persisted deletes wait for `chat:deleted`; `shouldRemoveMessageLocallyOnDelete` | `message.util.test.ts` | PASS — 1 test |

```bash
cd backend && npm test    # 46 passed
cd frontend && npm test   # 42 passed
cd backend && npm run build
cd frontend && npm run build
```


- **backend-patterns**: Service layer (`dm-socket.service.ts`) separates auth/persistence from socket wiring; events `dm:join` / `dm:history` / `dm:send` / `dm:message` / `dm:notification` / `dm:error`.
- **react-patterns**: Separate `useDirectMessages` hook; DM state isolated from `useSocket` channel state; reusable panel mirroring `MainContent`.
