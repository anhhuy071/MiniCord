import http from "node:http";
import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes.js';
import serverRoutes from './routes/server.routes.js';
import userRoutes from './routes/user.routes.js';
import dmRoutes from './routes/dm.routes.js';
import { requireSocketAuth, AuthSocket } from './middleware/socket.middleware.js';
import { assertChannelMember } from './utils/socket-auth.util.js';
import { deleteOwnChannelMessage, isValidChatDeletePayload } from './services/chat-socket.service.js';
import {
  isValidDmJoinPayload,
  isValidDmLeavePayload,
  isValidDmSendPayload,
  loadDirectMessageHistory,
  selectDmNotificationTargets,
  sendDirectMessage,
} from './services/dm-socket.service.js';
import { assertConversationParticipant } from './utils/socket-auth.util.js';
import { chronologicalFromLatest } from './utils/message-query.util.js';

import { Server as SocketIOServer } from "socket.io";
import prisma from './lib/prisma.js';
import { sendSuccess } from './utils/response.util.js';

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
app.use('/api/servers', serverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dm', dmRoutes);

app.get("/health", (req, res) => {
	sendSuccess(res, { ok: true }, "MiniCord Backend is Running with REST APIs and Prisma Data Persistence!", 200);
});

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  },
});

export const onlineUsers = new Map<string, Set<string>>();
export const voicePresences = new Map<string, any[]>();
 
io.use(requireSocketAuth as any);

io.on("connection", (rawSocket) => {
  const socket = rawSocket as AuthSocket;
  const userId = socket.data.user.userId;
  
  // 1. Quản lý trạng thái Online
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  const userSockets = onlineUsers.get(userId)!;
  
  if (userSockets.size === 0) {
    socket.broadcast.emit("user:online", { userId });
  }
  userSockets.add(socket.id);
  
  console.log(`[Socket] User ${userId} connected (Socket ID: ${socket.id}). Total Online Users: ${onlineUsers.size}`);
  
  socket.emit("online:list", Array.from(onlineUsers.keys()));

  socket.on("room:join", async ({ channelId }) => {
    if (typeof channelId !== "string" || channelId.trim().length === 0) return;

    try {
      const auth = await assertChannelMember(userId, channelId);
      if (!auth.ok) {
        const message = auth.reason === 'not_found' ? 'Channel not found' : 'Access denied';
        socket.emit("room:error", { message });
        return;
      }

      const { channel } = auth;
      socket.join(channelId);

      const latestMessages = await prisma.message.findMany({
        where: { channelId: channel.id },
        include: { author: { select: { username: true, id: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const messages = chronologicalFromLatest(latestMessages);

      const history = messages.map(m => ({
        id: m.id,
        channelId: channel.id,
        room: channel.name,
        author: m.author.username,
        authorId: m.author.id,
        content: m.content,
        createdAt: m.createdAt.toISOString()
      }));

      socket.emit("room:history", { channelId: channel.id, room: channel.name, messages: history });
    } catch (err) {
      console.error("Error loading history:", err);
    }
  });

  socket.on("chat:send", async ({ channelId, content }) => {
    if (typeof channelId !== "string" || channelId.trim().length === 0) return;
    if (typeof content !== "string" || content.trim().length === 0) return;

    try {
       const auth = await assertChannelMember(userId, channelId);
       if (!auth.ok) {
         socket.emit("chat:error", { channelId, message: 'Access denied' });
         return;
       }

       const { channel } = auth;

       const newMessage = await prisma.message.create({
         data: {
           content: content.trim(),
           authorId: socket.data.user.userId,
           channelId: channel.id
         },
         include: { author: { select: { username: true, id: true } } }
       });

       const formattedMessage = {
         id: newMessage.id,
         channelId: channel.id,
         room: channel.name,
         author: newMessage.author.username,
         authorId: newMessage.author.id,
         content: newMessage.content,
         createdAt: newMessage.createdAt.toISOString()
       };

       io.to(channelId).emit("chat:message", { channelId: channel.id, message: formattedMessage });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("chat:delete", async (payload) => {
    if (!isValidChatDeletePayload(payload)) return;

    const { channelId, messageId } = payload;

    try {
      const result = await deleteOwnChannelMessage(userId, channelId, messageId);
      if (!result.ok) {
        socket.emit("chat:error", { channelId, message: result.errorMessage });
        return;
      }

      io.to(channelId).emit("chat:deleted", result.broadcast);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  });

  // --- WebRTC Voice Handlers ---
  socket.on("voice:join", async ({ channelId }) => {
    if (typeof channelId !== "string" || channelId.trim().length === 0) return;

    const auth = await assertChannelMember(userId, channelId);
    if (!auth.ok) return;

    const voiceRoom = `voice_${channelId}`;
    socket.join(voiceRoom);
    socket.data.voiceChannelId = channelId;
    
    socket.to(voiceRoom).emit("voice:user-joined", { 
      socketId: socket.id 
    });

    const clientsInRoom = io.sockets.adapter.rooms.get(voiceRoom);
    const existingUsers = clientsInRoom ? Array.from(clientsInRoom).filter(id => id !== socket.id) : [];
    socket.emit("voice:room-users", existingUsers);
    
    console.log(`[Socket] User ${userId} joined voice room: ${voiceRoom}. Peers: ${existingUsers.length}`);

    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, avatarUrl: true } });
      if (user) {
        let presenceList = voicePresences.get(channelId) || [];
        presenceList = presenceList.filter(p => p.socketId !== socket.id);
        presenceList.push({ ...user, socketId: socket.id });
        voicePresences.set(channelId, presenceList);
        io.emit("voice:presence-update", { channelId, users: presenceList });
      }
    } catch (err) {
      console.error("Presence error", err);
    }
  });

  socket.on("voice:signal", ({ targetSocketId, signal }) => {
    if (typeof targetSocketId !== "string" || targetSocketId.trim().length === 0) return;
    if (targetSocketId === socket.id) return;

    const senderVoiceChannelId = socket.data.voiceChannelId;
    if (!senderVoiceChannelId) return;

    const targetSocket = io.sockets.sockets.get(targetSocketId) as AuthSocket | undefined;
    if (!targetSocket) return;

    if (targetSocket.data.voiceChannelId !== senderVoiceChannelId) return;

    io.to(targetSocketId).emit("voice:signal", { 
      fromSocketId: socket.id, 
      signal 
    });
  });

  socket.on("voice:leave", ({ channelId }) => {
    if (typeof channelId !== "string") return;
    const voiceRoom = `voice_${channelId}`;
    socket.leave(voiceRoom);
    if (socket.data.voiceChannelId === channelId) {
      delete socket.data.voiceChannelId;
    }
    socket.to(voiceRoom).emit("voice:user-left", { socketId: socket.id });

    let presenceList = voicePresences.get(channelId) || [];
    presenceList = presenceList.filter(p => p.socketId !== socket.id);
    if (presenceList.length === 0) {
      voicePresences.delete(channelId);
    } else {
      voicePresences.set(channelId, presenceList);
    }
    io.emit("voice:presence-update", { channelId, users: presenceList });
  });

  socket.on("disconnecting", () => {
    delete socket.data.voiceChannelId;

    socket.rooms.forEach(room => {
      if (room.startsWith("voice_")) {
        socket.to(room).emit("voice:user-left", { socketId: socket.id });
        
        // --- Presence Logic ---
        const channelId = room.replace("voice_", "");
        let presenceList = voicePresences.get(channelId) || [];
        presenceList = presenceList.filter(p => p.socketId !== socket.id);
        if (presenceList.length === 0) {
          voicePresences.delete(channelId);
        } else {
          voicePresences.set(channelId, presenceList);
        }
        io.emit("voice:presence-update", { channelId, users: presenceList });
      }
    });
  });

  // --- DM Socket Handlers ---
  socket.on("dm:join", async (payload) => {
    if (!isValidDmJoinPayload(payload)) return;

    const { conversationId } = payload;

    try {
      const auth = await loadDirectMessageHistory(userId, conversationId);
      if (!auth.ok) {
        socket.emit("dm:error", { conversationId, message: auth.errorMessage });
        return;
      }

      socket.join(conversationId);
      socket.emit("dm:history", { conversationId, messages: auth.messages });
    } catch (err) {
      console.error("Error loading DM history:", err);
      socket.emit("dm:error", { conversationId, message: "Failed to load conversation" });
    }
  });

  socket.on("dm:send", async (payload) => {
    if (!isValidDmSendPayload(payload)) return;

    const { conversationId, content } = payload;

    try {
      const result = await sendDirectMessage(userId, conversationId, content);
      if (!result.ok) {
        socket.emit("dm:error", { conversationId, message: result.errorMessage });
        return;
      }

      const { message, targetUserId } = result;

      io.to(conversationId).emit("dm:message", { conversationId, message });

      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        const room = io.sockets.adapter.rooms.get(conversationId);
        const roomSocketIds = room ? new Set(room) : undefined;
        const notificationTargets = selectDmNotificationTargets({
          targetSocketIds: Array.from(targetSockets),
          conversationRoomSocketIds: roomSocketIds,
          senderSocketId: socket.id,
        });

        for (const socketId of notificationTargets) {
          io.to(socketId).emit("dm:notification", { conversationId, message });
        }
      }
    } catch (err) {
      console.error("Error saving direct message:", err);
      socket.emit("dm:error", { conversationId, message: "Failed to send message" });
    }
  });

  socket.on("dm:leave", async (payload) => {
    if (!isValidDmLeavePayload(payload)) return;

    const { conversationId } = payload;

    try {
      const auth = await assertConversationParticipant(userId, conversationId);
      if (!auth.ok) return;

      socket.leave(conversationId);
    } catch (err) {
      console.error("Error leaving DM conversation:", err);
    }
  });

  socket.on("disconnect", () => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        // Broadcast offline status
        socket.broadcast.emit("user:offline", { userId });
      }
    }
    console.log(`[Socket] User ${userId} disconnected. Total online: ${onlineUsers.size}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`MiniCord backend listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${FRONTEND_ORIGIN}`);
});
