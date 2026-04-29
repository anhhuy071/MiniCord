import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

type Message = {
  id: string;
  channelId: string;
  room: string;
  author: string;
  content: string;
  createdAt: string;
};

export function useSocket(channelId: string | undefined, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Connection Lifecycle Management
  useEffect(() => {
    let socket = socketRef.current;
    
    if (!socket) {
      console.log(`[Socket] Initializing connection to ${SOCKET_URL}...`);
      
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socket = newSocket;
      socketRef.current = newSocket;

      // === Lifecycle Events ===
      newSocket.on('connect', () => {
        console.log(`[Socket] Connected! (ID: ${newSocket.id})`);
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn(`[Socket] Disconnected: ${reason}`);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error(`[Socket] Connection error:`, err);
        setError('Failed to connect to chat server.');
      });
      
      // === App-Specific Events ===
      newSocket.on('chat:message', (data: { channelId: string; room: string; message: Message }) => {
        setMessages((prev) => {
          if (data.channelId !== channelId) return prev;
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      });

      newSocket.on('dm:message', (data: { conversationId: string; message: Message }) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      });

      newSocket.on('dm:notification', (data: { conversationId: string; message: Message }) => {
        console.log(`[Notification] New DM from ${data.message.author}: ${data.message.content}`);
      });
    }

    // Now, ANY time the channelId or the socket reconnects, we want to fetch history and join the room.
    // We attach dynamic listeners that *depend on channelId* or just handle it cleanly.
    
    // Clear old messages when joining a new room
    setMessages([]);

    if (!channelId) return;

    const handleRoomHistory = (data: { channelId: string; room: string; messages: Message[] }) => {
      // Process history ONLY if it matches the current active channel.
      if (data.channelId === channelId) {
        console.log(`[Socket] Loaded history for channel ${data.channelId}`);
        setMessages(data.messages);
      }
    };

    socket.on('room:history', handleRoomHistory);

    if (socket && socket.connected) {
      console.log(`[Socket] Emitting room:join for ${channelId}`);
      socket.emit('room:join', { channelId });
    }

    // Since we don't want to destroy the entire Socket connection when a user just clicks a new channel...
    return () => {
      socket?.off('room:history', handleRoomHistory);
    };
  }, [channelId, token]);

  // Handle global teardown when the hook completely unmounts (e.g. logging out)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log(`[Socket] Tearing down connection...`);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Method to send a message
  const sendMessage = useCallback((content: string, author: string = 'User') => {
    if (!socketRef.current || !isConnected || !channelId) {
      console.warn('Cannot send message, socket is not connected or no channel active');
      return;
    }
    
    // Optimistic UI update could go here
    socketRef.current.emit('chat:send', {
      channelId,
      content,
      author
    });
  }, [channelId, isConnected]);

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
 