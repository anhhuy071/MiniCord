<!-- Generated: 2026-06-25 | Files scanned: 59 | Token estimate: ~700 -->

# Frontend Architecture

## Stack
React 19 · Vite 7 · React Router 7 · Bootstrap 5 · Socket.IO Client · TypeScript

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
├── MainContent (when TEXT channel selected)
└── MembersSidebar → MemberItem
```

## State Management

| Concern | Location | Mechanism |
|---------|----------|-----------|
| Auth (user, token) | `context/AuthContext.tsx` | React Context + localStorage |
| Servers/channels | `layout/AppLayout.tsx` | useState + fetchApi |
| Chat messages | `hooks/useSocket.ts` | useState, Socket.IO events |
| Voice streams | `hooks/useVoiceRoom.ts` | WebRTC + Socket relay |
| API calls | `services/api.ts` | fetch + Bearer token |

## Data Flow

```
AppLayout mount → fetchApi("/servers") → setServers/activeServer/activeChannel
Channel select → useSocket(channelId) → emit room:join → room:history → messages
Send message → sendMessage() → emit chat:send → chat:message → append messages
Voice channel → VoicePanel → useVoiceRoom → voice:join/signal/leave
```

## Key Files
| File | Role |
|------|------|
| `frontend/src/main.tsx` | ReactDOM.createRoot |
| `frontend/src/App.tsx` | Routes |
| `frontend/src/layout/AppLayout.tsx` | Main shell orchestration |
| `frontend/src/services/api.ts` | `fetchApi<T>(endpoint)` → `/api{endpoint}` |
| `frontend/src/hooks/useSocket.ts` | Socket lifecycle, chat/DM/voice presence |
| `frontend/src/hooks/useVoiceRoom.ts` | WebRTC mesh (STUN: Google) |
| `frontend/src/types/types.ts` | User, Server, Channel, Message, ApiResponse |

## Env Vars
- `VITE_BACKEND_URL` — API + Socket base URL (default `http://localhost:3000`)

## Styling
Bootstrap + custom CSS in `src/assets/css/styles.css`, `src/index.css`
