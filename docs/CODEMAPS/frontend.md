<!-- Generated: 2026-07-09 | Files scanned: 75 | Token estimate: ~820 -->

# Frontend Architecture

## Stack
React 19 · Vite 7 · React Router 7 · Bootstrap 5 · Socket.IO Client · TypeScript · Vitest · Testing Library

## Page Tree

```
App (AuthProvider + BrowserRouter)
├── AuthLayout
│   ├── /login      → Login.tsx
│   └── /register   → Register.tsx
├── ProtectedRoute
│   └── /*          → AppLayout.tsx (main chat shell)
└── *               → Navigate to /
```

## Component Hierarchy (App Shell)

```
AppLayout
├── Topbar
├── ServerSidebar → ServerItem, ServerModal
├── ChannelSidebar → ChannelItem, ChannelModal
├── VoicePanel (when VOICE channel selected) → useVoiceRoom
├── MainContent (when TEXT channel selected) → delete own messages
├── ConversationList (when DM sidebar selected)
├── DirectMessagePanel (when DM conversation selected)
└── MembersSidebar → MemberItem
```

## State Management

| Concern | Location | Mechanism |
|---------|----------|-----------|
| Auth (user, token) | `context/AuthContext.tsx` | React Context + localStorage |
| Servers/channels/members | `layout/AppLayout.tsx` | useState + fetchApi |
| Chat messages | `hooks/useSocket.ts` | useState, Socket.IO events |
| Message list helpers | `utils/message.util.ts` | Pure functions (immutable updates) |
| Voice streams | `hooks/useVoiceRoom.ts` | WebRTC + Socket relay |
| API calls | `services/api.ts` | fetch + Bearer token |
| Direct message state | `hooks/useDirectMessages.ts` | useState, Socket.IO listeners, unread tracking |
| DM message helpers | `utils/dm.util.ts` | Pure functions (immutable updates, optimistic creation) |

## Data Flow

```
AppLayout mount → fetchApi("/servers") → setServers/activeServer/activeChannel
Members load → fetchApi("/servers/:id/members") → MembersSidebar
Channel select → useSocket(channelId) → emit room:join → room:history → messages
Send → sendMessage() → emit chat:send → chat:message → appendChannelMessage
Delete own → click delete → confirmation modal → deleteMessage() → planDeleteMessage → emit chat:delete → chat:deleted → removeChannelMessage
Voice → VoicePanel → useVoiceRoom → voice:join/signal/leave
Open DM → openConversationWithUser(targetUserId) → fetchApi(POST "/api/dm/:targetUserId") → selectConversation → joinConversation → emit dm:join
Send DM → sendMessage() (via useDirectMessages) → createOptimisticDmMessage → emit dm:send
```

## Key Files
| File | Role |
|------|------|
| `frontend/src/main.tsx` | ReactDOM.createRoot |
| `frontend/src/App.tsx` | Routes |
| `frontend/src/layout/AppLayout.tsx` | Main shell orchestration |
| `frontend/src/components/main/MainContent.tsx` | Chat UI, send form, delete button (own msgs) |
| `frontend/src/components/dm/ConversationList.tsx` | DM list of active conversations & users |
| `frontend/src/components/dm/DirectMessagePanel.tsx` | Chat UI for DMs (messages, input form) |
| `frontend/src/services/api.ts` | `fetchApi<T>(endpoint)` → `/api{endpoint}` |
| `frontend/src/hooks/useSocket.ts` | Socket lifecycle, chat/DM/voice presence, deleteMessage |
| `frontend/src/hooks/useDirectMessages.ts` | Socket events for DM history, sending, notifications |
| `frontend/src/hooks/useVoiceRoom.ts` | WebRTC mesh (STUN: Google) |
| `frontend/src/utils/message.util.ts` | append/remove/merge messages, isOwnChannelMessage, planDeleteMessage |
| `frontend/src/utils/dm.util.ts` | DM message list mutations and optimistic rendering helpers |
| `frontend/src/types/types.ts` | User, Server, Channel, Message, DirectMessage, Conversation, ApiResponse |

## Tests
Vitest + jsdom + Testing Library (42 tests):
- `utils/message.util.test.ts` — message state helpers
- `utils/dm.util.test.ts` — DM state & optimistic rendering mutations
- `components/main/MainContent.test.tsx` — delete button visibility & click
- `components/dm/DirectMessagePanel.test.tsx` — direct messages inputs & submit testing

## Env Vars
- `VITE_BACKEND_URL` — API + Socket base URL (default `http://localhost:3000`)

## Styling
Bootstrap + custom CSS in `src/assets/css/styles.css`, `src/index.css`
