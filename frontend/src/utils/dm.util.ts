import type { Conversation, DirectMessage, PublicUser } from '../types/types';
import { isOptimisticMessageId } from './message.util';

export function appendDmMessage(
  prev: DirectMessage[],
  message: DirectMessage,
): { messages: DirectMessage[]; replacedOptimisticId?: string } {
  if (prev.some((m) => m.id === message.id)) {
    return { messages: prev };
  }

  const replaced = prev.find(
    (m) =>
      isOptimisticMessageId(m.id) &&
      m.author === message.author &&
      m.content === message.content,
  );

  const withoutPending = prev.filter(
    (m) =>
      !(
        isOptimisticMessageId(m.id) &&
        m.author === message.author &&
        m.content === message.content
      ),
  );

  return {
    messages: [...withoutPending, { ...message, status: message.status ?? 'sent' }],
    replacedOptimisticId: replaced?.id,
  };
}

export function mergeDmHistoryWithLive(
  live: DirectMessage[],
  history: DirectMessage[],
): DirectMessage[] {
  const byId = new Map<string, DirectMessage>();

  for (const message of history) {
    byId.set(message.id, message);
  }

  for (const message of live) {
    if (isOptimisticMessageId(message.id) || !byId.has(message.id)) {
      byId.set(message.id, message);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function createOptimisticDmMessage(params: {
  conversationId: string;
  author: string;
  authorId?: string;
  avatarUrl?: string | null;
  content: string;
}): DirectMessage {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    conversationId: params.conversationId,
    author: params.author,
    authorId: params.authorId ?? '',
    avatarUrl: params.avatarUrl ?? null,
    content: params.content,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

export function getOtherParticipant(
  conversation: Conversation,
  currentUserId: string,
): PublicUser {
  return conversation.userOneId === currentUserId
    ? conversation.userTwo
    : conversation.userOne;
}

export function isOwnDirectMessage(
  message: DirectMessage,
  user: { id?: string; username?: string } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.id && message.authorId) return message.authorId === user.id;
  if (user.username) return message.author === user.username;
  return false;
}

export function applyDmUnreadOnMessage(
  prev: Record<string, number>,
  conversationId: string,
  activeConversationId: string | null,
): Record<string, number> {
  if (conversationId !== activeConversationId) {
    return prev;
  }

  return { ...prev, [conversationId]: 0 };
}

export function applyDmUnreadOnNotification(
  prev: Record<string, number>,
  conversationId: string,
  activeConversationId: string | null,
): Record<string, number> {
  if (conversationId === activeConversationId) {
    return prev;
  }

  return {
    ...prev,
    [conversationId]: (prev[conversationId] ?? 0) + 1,
  };
}

export function bumpConversationUpdatedAt(
  conversations: Conversation[],
  conversationId: string,
  updatedAt: string,
): Conversation[] {
  return conversations.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, updatedAt } : conversation,
  );
}
