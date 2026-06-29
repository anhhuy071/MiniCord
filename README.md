# MiniCord — Real-Time Architecture Demo

MiniCord is a Discord-inspired chat application demo focused on simulating a large-scale real-time architecture in a modern web environment.

The project is composed of three main parts:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js (Express REST API · Socket.IO WebSockets · Prisma ORM · MongoDB)
- **Infrastructure / DevOps**: Docker (multi-stage builds) & MongoDB Replica Sets

The primary goal is not just to replicate Discord's UI, but to **apply real-world best practices** from Discord's real-time systems — including event-driven messaging, heartbeats, connection recovery, and horizontal scalability.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (Recommended for automatic local replica set config)
- PowerShell (or any equivalent terminal)

---

### Option A: Using Docker Compose (Recommended)

This is the fastest path as it builds all containerized services and sets up a local MongoDB replica set automatically (required for transactions).

1. From the project root, start all containers:
   ```bash
   docker compose up --build -d
   ```
2. Run the database seeding script to populate default test accounts:
   ```bash
   docker compose exec backend npm run seed
   ```
3. Open `http://localhost` in your browser to access the frontend app. The backend API is available at `http://localhost:3000`.

---

### Option B: Local Manual Setup

If you want to run the backend and frontend separately outside of Docker:

#### 1. Setup Local MongoDB Replica Set
Prisma's MongoDB connector requires a replica set configuration to support transactions (used when creating servers, channels, and members).
- Start your local MongoDB service with replica sets enabled (`--replSet rs0`).
- Initiate the replica set via mongosh: `rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})`.

#### 2. Start the Backend

Copy the environment file (contains JWT secret, database URL):

```powershell
cp backend/.env.example backend/.env
```

Install dependencies, generate the Prisma client, push the schema to MongoDB, seed sample data, and start the dev server (port 3000):

```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

#### 3. Start the Frontend

Open a separate terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173` by default.

---

## 🌐 Production Cloud Deployment

For deploying the architecture in production (MongoDB Atlas + Render + Vercel), see the detailed guide in [DEPLOYMENT.md](file:///d:/GithubProject/MiniCord/DEPLOYMENT.md).

---

## 🗺 Project Roadmap

The project is executed in focused phases to keep development organized. Here is the latest status:

### ✅ Phase 1 — Core Foundation & Database *(Complete)*

- **Database Design**: Defined the Prisma schema (`User`, `Server`, `Channel`, `ServerMember`, `Message`, `Conversation`) targeting MongoDB.
- **Core REST API**: Established base routing and standardized JSON response helpers.
- **Security & Authorization**: Implemented JWT authentication and an auth middleware guard.
- **Database Seeding**: Built a `seed.ts` script to automatically populate the database with sample users on setup.

### ✅ Phase 2 — Authentication & UI Skeleton *(Complete)*

- **Frontend Auth UI**: Designed a polished Login/Register form with a modern dark mode aesthetic.
- **State Management**: Integrated `AuthContext` across the full React app to persist session state.
- **App Layout**: Completed the five-panel grid layout (`ServerSidebar`, `ChannelSidebar`, `Topbar`, `MainContent`, `MembersSidebar`) as React components — **currently using hardcoded mock data**.
- **DM Backend API**: Implemented the full routing layer for Direct Messaging (1-to-1 messaging).

### ⏳ Phase 3 — Servers, Channels & Role Permissions *(In Progress)*

- [x] **Backend — Server API**: Built server management endpoints (`POST /servers`, `GET /servers`, `POST /servers/:id/join`).
- [x] **Backend — Channel API**: Created a permission-gated channel creation endpoint (`POST /servers/:id/channels`) restricted to Owners and Admins.
- [ ] **Frontend — Data Fetching**: Refactor `AppLayout` to fetch real servers and channels from the API based on the logged-in user, replacing all mock data.
- [ ] **Frontend — Modal Forms**: Build UI modals allowing users to Create or Join a server.
- [ ] **Frontend — Members Panel**: Display the member list for a given server, grouped by role (Owner / Admin / Member).
- [ ] **WebSocket Integration**: Align the frontend's channel-switching UI with the backend's `room:join` Socket.IO event.

### ⏳ Phase 4 — Infrastructure & Containerization *(In Progress)*

- [x] Containerize the full application using multi-stage **Docker** build files.
- [x] Configured automatic MongoDB replica-set initialization within Docker Compose.
- [ ] Configure **LocalStack** in Docker to replace raw disk storage; update backend to upload attachments via AWS S3 SDK.

### 📅 Phase 5 — Scalability

- Set up **Redis Pub/Sub via Socket.IO Adapter** to enable the app to run across multiple backend nodes simultaneously without message sync issues.
- Replace simple message history fetching with a Discord-style **event catch-up mechanism** to reduce server RAM consumption at scale.

---

## 💻 Development Conventions

| Convention | Detail |
|---|---|
| **Module system** | ESM (`import` / `export`) throughout |
| **WebSocket event naming** | Use namespaced strings (e.g. `room:join`, `chat:send`). Always pass structured JSON — never raw serialized strings. |
| **IDs** | All entity IDs use **MongoDB ObjectIDs** (24-character hex strings) mapped to `_id` to prevent data scraping and support native BSON representation. |
| **CORS & Environment** | Only origins listed in `.env` (`FRONTEND_ORIGIN`) are accepted by the server. Never hardcode URLs. |

---

## License

This project is open-sourced under the **ISC License**.
