## Purpose
Fast, concrete guidance for AI/devs to be productive on MiniCord (minimal realtime chat).

## Layout & architecture
- `backend/`: Node.js (ESM) + Express + Socket.IO; entry: `backend/src/server.js`.
- `frontend/`: static client connecting to Socket.IO (no build defined yet).
- No top-level build; run each folder separately.

## Run & debug (PowerShell)
```powershell
cd backend
npm install
npm run dev   # dev with nodemon
# or
npm start     # node src/server.js
# inspector
node --inspect src/server.js
```

## Conventions
- ESM only: use `import`/`export`.
- Config via `dotenv` -> `process.env`; keep secrets in `.env` (not committed).
- CORS with explicit origin (e.g., `process.env.FRONTEND_ORIGIN`).
- Realtime in `server.js` with `io.on('connection', ...)`.
- IDs: `import { v4 as uuidv4 } from 'uuid'`.

## Where to add code
- `backend/src/server.js` should: init Express, enable CORS/JSON, create HTTP+IO server, register REST routes, and Socket.IO events.

## Examples
Health route:
```js
app.get('/health', (req, res) => res.json({ ok: true }))
```
Socket.IO handler:
```js
io.on('connection', s => {
  console.log('connected', s.id)
  s.on('disconnect', () => console.log('disconnected', s.id))
})
```
CORS setup (allow one origin):
```js
import cors from 'cors'
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }))
```

## Gaps & decisions
- `server.js` is empty — add minimal scaffold first (port from `PORT` or 3000).
- No persistence layer; keep in-memory or add later (SQLite/file) if needed.
- `README.md` is sparse; rely on scripts in `backend/package.json`.

## When changing structure
- Update `backend/package.json` scripts/deps accordingly and add notes to `README.md`.

If anything here is inaccurate or missing (e.g., a frontend build you add later), tell me and I’ll update this guidance.
