import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

type Message = {
  id: string;
  room: string;
  author: string;
  content: string;
  createdAt: string;
};


export function useSocket(roomId: string, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Connection Lifecycle Management
  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) return;

    console.log(`[Socket] Initializing connection to ${SOCKET_URL}...`);
    
    // Connect with auth tokens and configure retries (reconnection is true by default)
    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // === Lifecycle Events ===
    socket.on('connect', () => {
      console.log(`[Socket] Connected! (ID: ${socket.id})`);
      setIsConnected(true);
      setError(null);
      
      // ✅ Best Practice: When connected (or reconnected), explicitly ask to join the room
      // and fetch ONLY the events we missed (Catch-up mechanism - though backend currently sends all)
      socket.emit('room:join', { room: roomId });
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
      // If server disconnected us dynamically, we might need to reconnect manually.
      // E.g., if token expired, we would refresh token here, then socket.connect()
    });

    socket.on('connect_error', (err) => {
      console.error(`[Socket] Connection error:`, err);
      setError('Failed to connect to chat server.');
    });

    // === App-Specific Events ===
    socket.on('room:history', (data: { room: string; messages: Message[] }) => {
      console.log(`[Socket] Loaded history for room ${data.room}`);
      setMessages(data.messages);
    });

    socket.on('chat:message', (data: { room: string; message: Message }) => {
      // ✅ Best Practice: Immutable state updates
      setMessages((prev) => {
        if (prev.some(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    });

    // Handle Direct Messaging
    socket.on('dm:message', (data: { conversationId: string; message: Message }) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    });

    socket.on('dm:notification', (data: { conversationId: string; message: Message }) => {
      // Logic to show a toast notification if user is not in the active conversation
      console.log(`[Notification] New DM from ${data.message.author}: ${data.message.content}`);
    });

    return () => {
      // Cleanup on unmount (If we leave the chat page entirely)
      console.log(`[Socket] Tearing down connection...`);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, token]);

  // Method to send a message
  const sendMessage = useCallback((content: string, author: string = 'User') => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot send message, socket is not connected');
      return;
    }
    
    // Optimistic UI update could go here
    socketRef.current.emit('chat:send', {
      room: roomId,
      content,
      author
    });
  }, [roomId, isConnected]);

  const sendDirectMessage = useCallback((conversationId: string, content: string, author: string = 'User') => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('dm:send', {
      conversationId,
      content,
      author
    });
  }, [isConnected]);

  return {
    isConnected,
    messages,
    error,
    sendMessage,
    sendDirectMessage
  };
}
 