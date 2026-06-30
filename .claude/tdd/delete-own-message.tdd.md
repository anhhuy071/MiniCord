# TDD Evidence: Delete Own Message

**Source plan**: Inline `/plan` conversation (delete-own-message for channel chat)  
**Completed**: 2026-06-30

## User Journeys

1. As a channel member, I want to delete my own messages, so that I can remove mistakes from the chat.
2. As another channel member, I should not see delete controls on others' messages, so that I cannot attempt unauthorized deletes.
3. As any member in the room, I want deletions broadcast in real time, so that the message list stays in sync without refresh.

## Task Report

| Task | Summary | Validation | Result |
|------|---------|------------|--------|
| Auth + ownership | `assertMessageOwner` guards channel membership and authorId | `npm test` (backend) | PASS — 15 tests |
| Delete service | `deleteOwnChannelMessage` validates, deletes, returns broadcast payload | `npm test` (backend) | PASS — 10 tests |
| Socket handler | `chat:delete` / `chat:deleted` wired via service layer | `npm run build` (backend) | PASS |
| Client state | `removeChannelMessage`, `planDeleteMessage`, `isOwnChannelMessage` | `npm test` (frontend util) | PASS — 24 tests |
| UI | Delete button on own messages only; hidden when disconnected | `npm test` (MainContent) | PASS — 3 tests |
| Hook wiring | `useSocket.deleteMessage` uses `planDeleteMessage` | `npm run build` (frontend) | PASS |

## Test Specification

| # | What is guaranteed | Test file / command | Type | Result |
|---|-------------------|---------------------|------|--------|
| 1 | Non-members cannot pass channel auth for delete | `socket-auth.util.test.ts` | unit | PASS |
| 2 | Only message author passes ownership check | `socket-auth.util.test.ts` | unit | PASS |
| 3 | Invalid delete payloads are rejected before DB | `chat-socket.service.test.ts:isValidChatDeletePayload` | unit | PASS |
| 4 | Successful delete removes row and returns broadcast ids | `chat-socket.service.test.ts:deleteOwnChannelMessage` | unit | PASS |
| 5 | Non-author delete does not call `message.delete` | `chat-socket.service.test.ts` | unit | PASS |
| 6 | Client removes message from list immutably | `message.util.test.ts:removeChannelMessage` | unit | PASS |
| 7 | Optimistic temp ids delete locally without emit | `message.util.test.ts:planDeleteMessage` | unit | PASS |
| 8 | Delete button shown only for own messages when connected | `MainContent.test.tsx` | component | PASS |
| 9 | Clicking delete invokes `deleteMessage(id)` | `MainContent.test.tsx` | component | PASS |

## Commands Run

```bash
cd backend && npm test    # 28 passed
cd frontend && npm test   # 27 passed
cd backend && npm run build
cd frontend && npm run build
```

## Coverage and Known Gaps

- **Unit + component**: Covered for auth, service, utils, and MainContent UI.
- **Integration**: Socket handler in `index.ts` is thin; logic covered via `chat-socket.service` + `assertMessageOwner`.
- **E2E**: Not added (no Playwright harness in repo for this flow). Manual smoke: two browsers, same channel, delete + broadcast.

## Patterns Applied

- **backend-patterns**: Service layer (`chat-socket.service.ts`) separates auth/persistence from socket wiring; namespaced events `chat:delete` / `chat:deleted`.
- **react-patterns**: Ownership derived via pure `isOwnChannelMessage`; side effects in event handler / hook; accessible `aria-label="Delete message"`.
