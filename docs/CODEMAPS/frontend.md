<!-- Generated: 2026-06-30 | Files scanned: 68 | Token estimate: ~780 -->

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

## Data Flow

```
AppLayout mount → fetchApi("/servers") → setServers/activeServer/activeChannel
Members load → fetchApi("/servers/:id/members") → MembersSidebar
Channel select → useSocket(channelId) → emit room:join → room:history → messages
Send → sendMessage() → emit chat:send → chat:message → appendChannelMessage
Delete own → deleteMessage() → planDeleteMessage → emit chat:delete → chat:deleted → removeChannelMessage
Voice → VoicePanel → useVoiceRoom → voice:join/signal/leave
```

## Key Files
| File | Role |
|------|------|
| `frontend/src/main.tsx` | ReactDOM.createRoot |
| `frontend/src/App.tsx` | Routes |
| `frontend/src/layout/AppLayout.tsx` | Main shell orchestration |
| `frontend/src/components/main/MainContent.tsx` | Chat UI, send form, delete button (own msgs) |
| `frontend/src/services/api.ts` | `fetchApi<T>(endpoint)` → `/api{endpoint}` |
| `frontend/src/hooks/useSocket.ts` | Socket lifecycle, chat/DM/voice presence, deleteMessage |
| `frontend/src/hooks/useVoiceRoom.ts` | WebRTC mesh (STUN: Google) |
| `frontend/src/utils/message.util.ts` | append/remove/merge messages, isOwnChannelMessage, planDeleteMessage |
| `frontend/src/types/types.ts` | User, Server, Channel, Message (+ authorId), ApiResponse |

## Tests
Vitest + jsdom + Testing Library:
- `utils/message.util.test.ts` — message state helpers
- `components/main/MainContent.test.tsx` — delete button visibility & click

## Env Vars
- `VITE_BACKEND_URL` — API + Socket base URL (default `http://localhost:3000`)

## Styling
Bootstrap + custom CSS in `src/assets/css/styles.css`, `src/index.css`
