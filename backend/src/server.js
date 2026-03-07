// import fs from "node:fs/promises";
// import path from "node:path";
// import http from "node:http";
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { Server as SocketIOServer } from "socket.io";
// import { randomUUID } from "node:crypto";


// dotenv.config();

// const PORT = Number(process.env.PORT ?? 3000);

// const FRONTEND_ORIGIN_ENV = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

// // const DATA_DIR = path.resolve(process.cwd(), "data");
// // const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

// // /** @typedef {{ id: string, room: string, author: string, content: string, createdAt: string }} ChatMessage */

// // async function ensureDataDir() {
// //   await fs.mkdir(DATA_DIR, { recursive: true });
// // }

// // /** @returns {Promise<Record<string, ChatMessage[]>>} */
// // async function loadMessagesByRoom() {
// //   try {
// //     const raw = await fs.readFile(MESSAGES_FILE, "utf8");
// //     const parsed = JSON.parse(raw);
// //     if (parsed && typeof parsed === "object") return parsed;
// //     return {};
// //   } catch (error) {
// //     if (
// //       error &&
// //       typeof error === "object" &&
// //       "code" in error &&
// //       error.code === "ENOENT"
// //     ) {
// //       return {};
// //     }
// //     throw error;
// //   }
// // }

// // /** @param {Record<string, ChatMessage[]>} messagesByRoom */
// // async function saveMessagesByRoom(messagesByRoom) {
// //   await ensureDataDir();
// //   await fs.writeFile(
// //     MESSAGES_FILE,
// //     JSON.stringify(messagesByRoom, null, 2),
// //     "utf8",
// //   );
// // }

// const app = express();
// app.use(express.json());
// app.use(
//   cors({
//     origin: FRONTEND_ORIGIN,
//     credentials: true,
//   }),
// );

// app.get("/health", (req, res) => {
// 	res.json({ ok: true });
// });

// const httpServer = http.createServer(app);

// const io = new SocketIOServer(httpServer, {
//   cors: {
//     origin: FRONTEND_ORIGIN,
//     credentials: true,
//   },
// });

// /** @type {Record<string, ChatMessage[]>} */
// let messagesByRoom = {};

// // Load initial state into memory (See Persistence Note above)
// await ensureDataDir();
// messagesByRoom = await loadMessagesByRoom();

// // ============================================================================
// // 🏗️ ARCHITECTURE NOTE: Event-Driven Realtime & Connection Recovery
// // ============================================================================
// // ❌ CURRENT ANTI-PATTERN:
// // On `room:join`, we blast the entire room history to the client.
// // If a client disconnects on mobile and reconnects 10 seconds later, we
// // resend the whole history. This wastes bandwidth and server CPU.
// //
// // ✅ DISCORD-STYLE BEST PRACTICE:
// // 1. Heartbeats: Client pings the server explicitly every 40s to keep connection alive.
// // 2. Sequence IDs / Catch-up: Client sends `last_event_id` when reconnecting.
// //    Server only replays events that happened after that ID.
// // ============================================================================
// io.on("connection", (socket) => {
//   socket.on("room:join", ({ room }) => {
//     if (typeof room !== "string" || room.trim().length === 0) return;

//     // Join a Socket.IO room (a grouping of sockets)
//     socket.join(room);

//     // Send initial data (Anti-pattern for large rooms, acceptable for demo)
//     const history = messagesByRoom[room] ?? [];
//     socket.emit("room:history", { room, messages: history });
//   });

//   socket.on("chat:send", async ({ room, author, content }) => {
//     if (typeof room !== "string" || room.trim().length === 0) return;
//     if (typeof content !== "string" || content.trim().length === 0) return;

//     const safeAuthor =
//       typeof author === "string" && author.trim().length > 0
//         ? author.trim()
//         : "Anonymous";
//     /** @type {ChatMessage} */
//     const message = {
//       id: randomUUID(),
//       room,
//       author: safeAuthor,
//       content: content.trim(),
//       createdAt: new Date().toISOString(),
//     };

//     const next = [...(messagesByRoom[room] ?? []), message];
//     messagesByRoom = { ...messagesByRoom, [room]: next };

//     // Bad: Blocking event loop with File I/O on every message
//     await saveMessagesByRoom(messagesByRoom);

//     // Broadcast to everyone in the room (including sender)
//     io.to(room).emit("chat:message", { room, message });
//   });

//   // Handle client disconnecting
//   socket.on("disconnect", () => {
//     // In a real app, update user "Offline" presence status here
//     // via a presence microservice.
//   });
// });

// httpServer.listen(PORT, () => {
//   console.log(`MiniCord backend listening on http://localhost:${PORT}`);
//   console.log(`CORS allowed origin: ${FRONTEND_ORIGIN}`);
//   console.log(`Messages file: ${MESSAGES_FILE}`);
// });
