import http from "node:http";
import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes.js';

import { Server as SocketIOServer } from "socket.io";
import prisma from './lib/prisma.js';
import jwt from 'jsonwebtoken';

const PORT = Number(process.env.PORT ?? 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);

// REST API Routes
app.use('/api/auth', authRoutes);

app.get("/health", (req, res) => {
	res.json({ ok: true, message: "MiniCord Backend is Running with REST APIs and Prisma Data Persistence!" });
});

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  },
});

 
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    socket.data.user = decoded; // attach the parsed { userId: ... } to the socket object
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] User ${socket.data.user.userId} connected (Socket ID: ${socket.id})`);

  socket.on("room:join", async ({ room }) => {
    if (typeof room !== "string" || room.trim().length === 0) return;

    socket.join(room);

    try {
      // Find the channel first to load its specific message history
      let channel = await prisma.channel.findFirst({
        where: { name: room }
      });

      // ⚠️ For Demo Purposes Only: Auto-create the channel & server if it doesn't exist.
      // In a real app, users would explicitly create Servers and Channels via REST API first.
      if (!channel) {
        let server = await prisma.server.findFirst({
           where: { name: "Global" }
        });
        if (!server) {
           server = await prisma.server.create({
             data: { name: "Global", ownerId: socket.data.user.userId }
           });
        }
        channel = await prisma.channel.create({
          data: { name: room, serverId: server.id }
        });
      }

      // Fetch the last 50 messages from the Real Database using Prisma!
      const messages = await prisma.message.findMany({
        where: { channelId: channel.id },
        include: { author: { select: { username: true, id: true } } },
        orderBy: { createdAt: 'asc' },
        take: 50
      });

      // Format for the frontend UI logic
      const history = messages.map(m => ({
        id: m.id,
        room: channel.name,
        author: m.author.username,
        content: m.content,
        createdAt: m.createdAt.toISOString()
      }));

      socket.emit("room:history", { room, messages: history });
    } catch (err) {
      console.error("Error loading history:", err);
    }
  });

  socket.on("chat:send", async ({ room, content }) => {
    if (typeof room !== "string" || room.trim().length === 0) return;
    if (typeof content !== "string" || content.trim().length === 0) return;

    try {
       // Look up the channel they are sending the message to
       const channel = await prisma.channel.findFirst({ where: { name: room } });
       if (!channel) return;

       // 🏗️ Save directly to the Database! No more fragile file I/O blocking the event loop!
       // Notice we don't trust the `author` string sent from frontend anymore.
       // We use the `userId` proven mathematically by their JWT Token. This prevents impersonation.
       const newMessage = await prisma.message.create({
         data: {
           content: content.trim(),
           authorId: socket.data.user.userId,
           channelId: channel.id
         },
         include: { author: { select: { username: true } } }
       });

       const formattedMessage = {
         id: newMessage.id,
         room: channel.name,
         author: newMessage.author.username, // Safely resolving the username locally via DB Join
         content: newMessage.content,
         createdAt: newMessage.createdAt.toISOString()
       };

       // Broadcast to everyone in the room
       io.to(room).emit("chat:message", { room, message: formattedMessage });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] User ${socket.data.user.userId} disconnected`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`MiniCord backend listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${FRONTEND_ORIGIN}`);
});
