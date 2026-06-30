import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../types/types';
import {
  appendChannelMessage,
  createOptimisticMessage,
  mergeHistoryWithLiveMessages,
  planDeleteMessage,
  removeChannelMessage,
  removeOptimisticById,
} from '../utils/message.util';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export function useSocket(channelId: string | undefined, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const channelIdRef = useRef(channelId);
  channelIdRef.current = channelId;
  const pendingSendQueueRef = useRef<string[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voicePresence, setVoicePresence] = useState<Record<string, any[]>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const joinChannel = useCallback((socket: Socket, activeChannelId: string) => {
    console.log(`[Socket] Emitting room:join for ${activeChannelId}`);
    socket.emit('room:join', { channelId: activeChannelId });
  }, []);

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
      setSocketInstance(newSocket);

      newSocket.on('connect', () => {
        console.log(`[Socket] Connected! (ID: ${newSocket.id})`);
        setIsConnected(true);
        setError(null);

        const activeChannelId = channelIdRef.current;
        if (activeChannelId) {
          joinChannel(newSocket, activeChannelId);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.warn(`[Socket] Disconnected: ${reason}`);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error(`[Socket] Connection error:`, err);
        setError('Failed to connect to chat server.');
      });

      newSocket.on('chat:message', (data: { channelId: string; room: string; message: Message }) => {
        setMessages((prev) => {
          if (data.channelId !== channelIdRef.current) return prev;

          const { messages: next, replacedOptimisticId } = appendChannelMessage(prev, data.message);
          if (replacedOptimisticId) {
            pendingSendQueueRef.current = pendingSendQueueRef.current.filter(
              (id) => id !== replacedOptimisticId
            );
          }
          return next;
        });
      });

      newSocket.on('chat:error', (data: { channelId: string; message: string }) => {
        if (data.channelId !== channelIdRef.current) return;

        const failedId = pendingSendQueueRef.current.shift();
        if (failedId) {
          setMessages((prev) => removeOptimisticById(prev, failedId));
        }
        setError(data.message);
      });

      newSocket.on('chat:deleted', (data: { channelId: string; messageId: string }) => {
        if (data.channelId !== channelIdRef.current) return;
        setMessages((prev) => removeChannelMessage(prev, data.messageId));
      });

      newSocket.on('voice:presence-update', ({ channelId: voiceChannelId, users }) => {
        setVoicePresence((prev) => ({ ...prev, [voiceChannelId]: users }));
      });

      newSocket.on('online:list', (userIds: string[]) => {
        setOnlineUserIds(new Set(userIds));
      });

      newSocket.on('user:online', ({ userId }: { userId: string }) => {
        setOnlineUserIds((prev) => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }: { userId: string }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
    }

    setMessages([]);
    setError(null);
    pendingSendQueueRef.current = [];

    if (!channelId) return;

    const handleRoomHistory = (data: { channelId: string; room: string; messages: Message[] }) => {
      if (data.channelId !== channelIdRef.current) return;
      console.log(`[Socket] Loaded history for channel ${data.channelId}`);
      setMessages((prev) => mergeHistoryWithLiveMessages(prev, data.messages));
    };

    socket.on('room:history', handleRoomHistory);

    if (socket?.connected) {
      joinChannel(socket, channelId);
    }

    return () => {
      socket?.off('room:history', handleRoomHistory);
    };
  }, [channelId, token, joinChannel]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log(`[Socket] Tearing down connection...`);
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
    };
  }, []);

  const sendMessage = useCallback((content: string, author: string, authorId?: string) => {
    if (!socketRef.current || !isConnected || !channelId) {
      console.warn('Cannot send message, socket is not connected or no channel active');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent || !author.trim()) return;

    const optimisticMessage = createOptimisticMessage({
      channelId,
      author,
      authorId,
      content: trimmedContent,
    });
    pendingSendQueueRef.current = [...pendingSendQueueRef.current, optimisticMessage.id];
    setMessages((prev) => [...prev, optimisticMessage]);
    setError(null);

    socketRef.current.emit('chat:send', {
      channelId,
      content: trimmedContent,
    });
  }, [channelId, isConnected]);

  const deleteMessage = useCallback((messageId: string) => {
    const action = planDeleteMessage({ messageId, channelId, isConnected });

    if (action.type === 'noop') {
      console.warn('Cannot delete message, socket is not connected or no channel active');
      return;
    }

    if (action.type === 'local') {
      pendingSendQueueRef.current = pendingSendQueueRef.current.filter(
        (id) => id !== action.messageId,
      );
      setMessages((prev) => removeChannelMessage(prev, action.messageId));
      return;
    }

    if (!socketRef.current) return;

    setError(null);

    socketRef.current.emit('chat:delete', {
      channelId: action.channelId,
      messageId: action.messageId,
    });
  }, [channelId, isConnected]);

  return {
    socket: socketInstance,
    isConnected,
    messages,
    voicePresence,
    onlineUserIds,
    error,
    sendMessage,
    deleteMessage,
  };
}
