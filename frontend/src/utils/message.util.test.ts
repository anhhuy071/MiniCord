import { describe, it, expect } from 'vitest';
import {
  appendChannelMessage,
  createOptimisticMessage,
  isNearBottom,
  isOptimisticMessageId,
  mergeHistoryWithLiveMessages,
  removeOptimisticById,
  removeChannelMessage,
  isOwnChannelMessage,
  planDeleteMessage,
  shouldRemoveMessageLocallyOnDelete,
} from './message.util';
import type { Message } from '../types/types';

const serverMessage: Message = {
  id: 'msg-1',
  channelId: 'ch-1',
  room: 'general',
  author: 'alice',
  content: 'Hello',
  createdAt: '2024-01-01T12:00:00.000Z',
  status: 'sent',
};

describe('isOptimisticMessageId', () => {
  it('returns true for temp ids', () => {
    expect(isOptimisticMessageId('temp-123')).toBe(true);
  });

  it('returns false for server ids', () => {
    expect(isOptimisticMessageId('msg-1')).toBe(false);
  });
});

describe('appendChannelMessage', () => {
  it('appends a new message', () => {
    const { messages } = appendChannelMessage([], serverMessage);
    expect(messages).toEqual([serverMessage]);
  });

  it('deduplicates by id', () => {
    const prev = [serverMessage];
    const { messages } = appendChannelMessage(prev, serverMessage);
    expect(messages).toBe(prev);
  });

  it('replaces matching optimistic message with server message', () => {
    const optimistic = createOptimisticMessage({
      channelId: 'ch-1',
      author: 'alice',
      content: 'Hello',
    });
    const { messages, replacedOptimisticId } = appendChannelMessage([optimistic], serverMessage);
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe('msg-1');
    expect(messages[0].status).toBe('sent');
    expect(replacedOptimisticId).toBe(optimistic.id);
  });

  it('does not mutate the input array', () => {
    const prev: Message[] = [];
    const copy = [...prev];
    appendChannelMessage(prev, serverMessage);
    expect(prev).toEqual(copy);
  });
});

describe('removeOptimisticById', () => {
  it('removes a specific optimistic message', () => {
    const optimistic = createOptimisticMessage({
      channelId: 'ch-1',
      author: 'alice',
      content: 'Hi',
    });
    const result = removeOptimisticById([optimistic, serverMessage], optimistic.id);
    expect(result).toEqual([serverMessage]);
  });

  it('ignores non-optimistic ids', () => {
    const result = removeOptimisticById([serverMessage], serverMessage.id);
    expect(result).toEqual([serverMessage]);
  });
});

describe('removeChannelMessage', () => {
  it('removes a message by id', () => {
    const other: Message = { ...serverMessage, id: 'msg-2', content: 'Other' };
    const result = removeChannelMessage([serverMessage, other], serverMessage.id);
    expect(result).toEqual([other]);
  });

  it('does not mutate the input array', () => {
    const prev = [serverMessage];
    const copy = [...prev];
    removeChannelMessage(prev, serverMessage.id);
    expect(prev).toEqual(copy);
  });

  it('returns unchanged messages when id is not found', () => {
    const prev = [serverMessage];
    const result = removeChannelMessage(prev, 'missing');
    expect(result).toEqual([serverMessage]);
  });
});

describe('isOwnChannelMessage', () => {
  it('returns true when authorId matches the current user', () => {
    expect(
      isOwnChannelMessage(
        { ...serverMessage, authorId: 'user-1' },
        { id: 'user-1', username: 'alice' },
      ),
    ).toBe(true);
  });

  it('returns false for another user message', () => {
    expect(
      isOwnChannelMessage(
        { ...serverMessage, authorId: 'user-2', author: 'bob' },
        { id: 'user-1', username: 'alice' },
      ),
    ).toBe(false);
  });

  it('falls back to username when authorId is missing', () => {
    expect(isOwnChannelMessage(serverMessage, { id: 'user-1', username: 'alice' })).toBe(true);
  });

  it('falls back to username when session user has no id but message has authorId', () => {
    expect(
      isOwnChannelMessage(
        { ...serverMessage, authorId: 'user-1', author: 'alice' },
        { username: 'alice' },
      ),
    ).toBe(true);
  });

  it('returns false when user is null', () => {
    expect(isOwnChannelMessage(serverMessage, null)).toBe(false);
  });
});

describe('planDeleteMessage', () => {
  it('returns noop when disconnected', () => {
    expect(
      planDeleteMessage({ messageId: 'msg-1', channelId: 'ch-1', isConnected: false }),
    ).toEqual({ type: 'noop' });
  });

  it('returns local action for optimistic messages', () => {
    expect(
      planDeleteMessage({
        messageId: 'temp-123',
        channelId: 'ch-1',
        isConnected: true,
      }),
    ).toEqual({ type: 'local', messageId: 'temp-123' });
  });

  it('returns emit action for persisted messages', () => {
    expect(
      planDeleteMessage({
        messageId: 'msg-1',
        channelId: 'ch-1',
        isConnected: true,
      }),
    ).toEqual({ type: 'emit', channelId: 'ch-1', messageId: 'msg-1' });
  });
});

describe('shouldRemoveMessageLocallyOnDelete', () => {
  it('returns true only for local optimistic deletes', () => {
    expect(shouldRemoveMessageLocallyOnDelete({ type: 'local', messageId: 'temp-1' })).toBe(true);
    expect(
      shouldRemoveMessageLocallyOnDelete({ type: 'emit', channelId: 'ch-1', messageId: 'msg-1' }),
    ).toBe(false);
    expect(shouldRemoveMessageLocallyOnDelete({ type: 'noop' })).toBe(false);
  });
});

describe('mergeHistoryWithLiveMessages', () => {
  it('keeps live messages that arrived after the history snapshot', () => {
    const history = [serverMessage];
    const liveMessage: Message = {
      id: 'msg-2',
      channelId: 'ch-1',
      room: 'general',
      author: 'bob',
      content: 'New',
      createdAt: '2024-01-01T12:01:00.000Z',
      status: 'sent',
    };

    const result = mergeHistoryWithLiveMessages([liveMessage], history);

    expect(result.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
  });

  it('keeps pending optimistic messages when history arrives', () => {
    const optimistic = createOptimisticMessage({
      channelId: 'ch-1',
      author: 'alice',
      content: 'Sending',
    });

    const result = mergeHistoryWithLiveMessages([optimistic], [serverMessage]);

    expect(result.map((m) => m.id)).toContain(optimistic.id);
    expect(result.map((m) => m.id)).toContain(serverMessage.id);
  });

  it('sorts merged messages chronologically', () => {
    const older: Message = { ...serverMessage, id: 'msg-1', createdAt: '2024-01-01T10:00:00.000Z' };
    const newer: Message = { ...serverMessage, id: 'msg-2', createdAt: '2024-01-01T11:00:00.000Z' };

    const result = mergeHistoryWithLiveMessages([newer], [older]);

    expect(result.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
  });
});

describe('createOptimisticMessage', () => {
  it('creates a pending message with a temp id', () => {
    const message = createOptimisticMessage({
      channelId: 'ch-1',
      author: 'bob',
      content: 'Hi',
      room: 'general',
    });

    expect(message.id.startsWith('temp-')).toBe(true);
    expect(message.status).toBe('pending');
    expect(message.channelId).toBe('ch-1');
  });
});

describe('isNearBottom', () => {
  it('returns true when scrolled to the bottom', () => {
    const element = {
      scrollHeight: 1000,
      scrollTop: 900,
      clientHeight: 100,
    } as HTMLElement;

    expect(isNearBottom(element)).toBe(true);
  });

  it('returns false when scrolled far from the bottom', () => {
    const element = {
      scrollHeight: 1000,
      scrollTop: 0,
      clientHeight: 100,
    } as HTMLElement;

    expect(isNearBottom(element)).toBe(false);
  });
});
