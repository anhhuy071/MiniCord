import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { Conversation, DirectMessage } from '../types/types';
import { fetchApi } from '../services/api';
import {
  appendDmMessage,
  applyDmUnreadOnMessage,
  applyDmUnreadOnNotification,
  bumpConversationUpdatedAt,
  createOptimisticDmMessage,
  mergeDmHistoryWithLive,
} from '../utils/dm.util';
import { removeOptimisticById } from '../utils/message.util';

export function useDirectMessages(
  socket: Socket | null,
  isConnected: boolean,
  currentUserId: string | undefined,
  currentUsername: string | undefined,
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeConversationIdRef = useRef<string | null>(null);
  const joinedConversationIdRef = useRef<string | null>(null);
  const pendingSendQueueRef = useRef<string[]>([]);

  activeConversationIdRef.current = activeConversation?.id ?? null;

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await fetchApi<Conversation[]>('/dm');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const leaveConversation = useCallback(
    (conversationId: string | null | undefined) => {
      if (!socket || !conversationId) return;
      socket.emit('dm:leave', { conversationId });
      if (joinedConversationIdRef.current === conversationId) {
        joinedConversationIdRef.current = null;
      }
    },
    [socket],
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) return;

      if (
        joinedConversationIdRef.current &&
        joinedConversationIdRef.current !== conversationId
      ) {
        leaveConversation(joinedConversationIdRef.current);
      }

      joinedConversationIdRef.current = conversationId;
      socket.emit('dm:join', { conversationId });
    },
    [socket, isConnected, leaveConversation],
  );

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (data: { conversationId: string; messages: DirectMessage[] }) => {
      if (data.conversationId !== activeConversationIdRef.current) return;
      setMessages((prev) => mergeDmHistoryWithLive(prev, data.messages));
    };

    const handleMessage = (data: { conversationId: string; message: DirectMessage }) => {
      const activeId = activeConversationIdRef.current;

      if (data.conversationId === activeId) {
        setMessages((prev) => {
          const { messages: next, replacedOptimisticId } = appendDmMessage(prev, data.message);
          if (replacedOptimisticId) {
            pendingSendQueueRef.current = pendingSendQueueRef.current.filter(
              (id) => id !== replacedOptimisticId,
            );
          }
          return next;
        });
      }

      setUnreadByConversation((prev) =>
        applyDmUnreadOnMessage(prev, data.conversationId, activeId),
      );

      setConversations((prev) =>
        bumpConversationUpdatedAt(prev, data.conversationId, data.message.createdAt),
      );
    };

    const handleNotification = (data: { conversationId: string; message: DirectMessage }) => {
      const activeId = activeConversationIdRef.current;

      setUnreadByConversation((prev) =>
        applyDmUnreadOnNotification(prev, data.conversationId, activeId),
      );

      setConversations((prev) =>
        bumpConversationUpdatedAt(prev, data.conversationId, data.message.createdAt),
      );
    };

    const handleError = (data: { conversationId: string; message: string }) => {
      if (data.conversationId !== activeConversationIdRef.current) return;

      const failedId = pendingSendQueueRef.current.shift();
      if (failedId) {
        setMessages((prev) => removeOptimisticById(prev, failedId));
      }
      setError(data.message);
    };

    socket.on('dm:history', handleHistory);
    socket.on('dm:message', handleMessage);
    socket.on('dm:notification', handleNotification);
    socket.on('dm:error', handleError);

    return () => {
      socket.off('dm:history', handleHistory);
      socket.off('dm:message', handleMessage);
      socket.off('dm:notification', handleNotification);
      socket.off('dm:error', handleError);
    };
  }, [socket]);

  const openConversationWithUser = useCallback(
    async (targetUserId: string) => {
      if (!currentUserId || targetUserId === currentUserId) return null;

      leaveConversation(activeConversationIdRef.current);

      setIsLoading(true);
      setError(null);
      setMessages([]);
      pendingSendQueueRef.current = [];

      try {
        const conversation = await fetchApi<Conversation>(`/dm/${targetUserId}`, {
          method: 'POST',
        });

        setActiveConversation(conversation);
        setConversations((prev) => {
          const existing = prev.find((item) => item.id === conversation.id);
          if (existing) {
            return prev.map((item) => (item.id === conversation.id ? conversation : item));
          }
          return [conversation, ...prev];
        });
        setUnreadByConversation((prev) => ({ ...prev, [conversation.id]: 0 }));
        joinConversation(conversation.id);
        return conversation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to open conversation';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId, joinConversation, leaveConversation],
  );

  const selectConversation = useCallback(
    (conversation: Conversation) => {
      if (activeConversationIdRef.current !== conversation.id) {
        leaveConversation(activeConversationIdRef.current);
      }

      setActiveConversation(conversation);
      setMessages([]);
      setError(null);
      pendingSendQueueRef.current = [];
      setUnreadByConversation((prev) => ({ ...prev, [conversation.id]: 0 }));
      joinConversation(conversation.id);
    },
    [joinConversation, leaveConversation],
  );

  const closeConversation = useCallback(() => {
    leaveConversation(activeConversationIdRef.current);
    setActiveConversation(null);
    setMessages([]);
    setError(null);
    pendingSendQueueRef.current = [];
  }, [leaveConversation]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !isConnected || !activeConversation || !currentUsername) return;

      const trimmedContent = content.trim();
      if (!trimmedContent) return;

      const optimisticMessage = createOptimisticDmMessage({
        conversationId: activeConversation.id,
        author: currentUsername,
        authorId: currentUserId,
        content: trimmedContent,
      });

      pendingSendQueueRef.current = [...pendingSendQueueRef.current, optimisticMessage.id];
      setMessages((prev) => [...prev, optimisticMessage]);
      setError(null);

      socket.emit('dm:send', {
        conversationId: activeConversation.id,
        content: trimmedContent,
      });
    },
    [socket, isConnected, activeConversation, currentUsername, currentUserId],
  );

  return {
    conversations,
    activeConversation,
    messages,
    unreadByConversation,
    error,
    isLoading,
    openConversationWithUser,
    selectConversation,
    closeConversation,
    sendMessage,
    loadConversations,
  };
}
