## Purpose
Fast, concrete guidance for AI/devs to be productive on MiniCord (minimal realtime chat).

## Layout & architecture
- `backend/`: Node.js (ESM) + Express + Socket.IO; entry: `backend/src/server.js`.
- `frontend/`: React + TypeScript + Vite; entry: `src/main.tsx`; scripts in `package.json`.
- No top-level build; run each folder separately.

## Run & debug (PowerShell)

**Backend:**
```powershell
cd backend
npm install
npm run dev   # dev with nodemon
# or
npm start     # node src/server.js
# inspector
node --inspect src/server.js
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev   # Vite dev server (default: http://localhost:5173)
```

## Conventions
- ESM only: use `import`/`export`.
- Config via `dotenv` → `process.env`; keep secrets in `.env` (not committed).
- CORS with explicit origin (e.g., `process.env.FRONTEND_ORIGIN`).
- Realtime in `server.js` with `io.on('connection', ...)`.
- IDs: `import { v4 as uuidv4 } from 'uuid'`.
- Frontend: React 19 + TypeScript + Vite (SWC); follow React hooks patterns.

## Where to add code
- `backend/src/server.js`: init Express, enable CORS/JSON, create HTTP+IO server, register REST routes, and Socket.IO events.
- `frontend/src/`: React components (`.tsx`), styles, and Socket.IO client logic.
- `frontend/src/main.tsx`: app entry point.

## Examples

**Backend health route:**
```js
app.get('/health', (req, res) => res.json({ ok: true }))
```

**Socket.IO handler:**
```js
io.on('connection', s => {
  console.log('connected', s.id)
  s.on('disconnect', () => console.log('disconnected', s.id))
})
```

**CORS setup (allow one origin):**
```js
import cors from 'cors'
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }))
```

**Frontend Socket.IO connection (example):**
```tsx
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')
socket.on('connect', () => console.log('connected'))
```

## Environment setup
- `backend/.env`: `PORT=3000`, `FRONTEND_ORIGIN=http://localhost:5173`
- `frontend/.env` (if needed): `VITE_API_URL=http://localhost:3000`

## Gaps & decisions
- `backend/src/server.js` may be empty — add minimal scaffold first (port from `PORT` or 3000).
- No persistence layer; keep in-memory or add later (SQLite/file) if needed.
- Frontend: basic React setup; add Socket.IO client, UI components as needed.

## When changing structure
- Update `backend/package.json` or `frontend/package.json` scripts/deps accordingly.
- Add notes to `README.md` for any new env vars or setup steps.

If anything here is inaccurate or missing, tell me and I'll update this guidance.
