import type { Message } from '../types/types';

export function isOptimisticMessageId(id: string): boolean {
  return id.startsWith('temp-');
}

export function appendChannelMessage(
  prev: Message[],
  message: Message
): { messages: Message[]; replacedOptimisticId?: string } {
  if (prev.some((m) => m.id === message.id)) {
    return { messages: prev };
  }

  const replaced = prev.find(
    (m) =>
      isOptimisticMessageId(m.id) &&
      m.author === message.author &&
      m.content === message.content
  );

  const withoutPending = prev.filter(
    (m) =>
      !(
        isOptimisticMessageId(m.id) &&
        m.author === message.author &&
        m.content === message.content
      )
  );

  return {
    messages: [...withoutPending, { ...message, status: message.status ?? 'sent' }],
    replacedOptimisticId: replaced?.id,
  };
}

export function removeOptimisticById<T extends { id: string }>(
  prev: T[],
  messageId: string,
): T[] {
  if (!isOptimisticMessageId(messageId)) return prev;
  return prev.filter((m) => m.id !== messageId);
}

export function removeChannelMessage(prev: Message[], messageId: string): Message[] {
  return prev.filter((m) => m.id !== messageId);
}

export function mergeHistoryWithLiveMessages(live: Message[], history: Message[]): Message[] {
  const byId = new Map<string, Message>();

  for (const message of history) {
    byId.set(message.id, message);
  }

  for (const message of live) {
    if (isOptimisticMessageId(message.id) || !byId.has(message.id)) {
      byId.set(message.id, message);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function createOptimisticMessage(params: {
  channelId: string;
  author: string;
  authorId?: string;
  content: string;
  room?: string;
}): Message {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    channelId: params.channelId,
    room: params.room ?? '',
    author: params.author,
    authorId: params.authorId,
    content: params.content,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

export function isNearBottom(element: HTMLElement, threshold = 100): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}

export function isOwnChannelMessage(
  message: Message,
  user: { id?: string; username?: string } | null | undefined,
): boolean {
  if (!user) return false;

  if (user.id && message.authorId) {
    return message.authorId === user.id;
  }

  if (user.username && message.author) {
    return message.author === user.username;
  }

  return false;
}

export type DeleteMessageAction =
  | { type: 'noop' }
  | { type: 'local'; messageId: string }
  | { type: 'emit'; channelId: string; messageId: string };

export function planDeleteMessage(params: {
  messageId: string;
  channelId: string | undefined;
  isConnected: boolean;
}): DeleteMessageAction {
  if (!params.isConnected || !params.channelId) {
    return { type: 'noop' };
  }

  if (isOptimisticMessageId(params.messageId)) {
    return { type: 'local', messageId: params.messageId };
  }

  return {
    type: 'emit',
    channelId: params.channelId,
    messageId: params.messageId,
  };
}

export function shouldRemoveMessageLocallyOnDelete(action: DeleteMessageAction): boolean {
  return action.type === 'local';
}
