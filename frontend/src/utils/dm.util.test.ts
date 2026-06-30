import { describe, it, expect } from 'vitest';
import {
  appendDmMessage,
  applyDmUnreadOnMessage,
  applyDmUnreadOnNotification,
  createOptimisticDmMessage,
  getOtherParticipant,
  isOwnDirectMessage,
  mergeDmHistoryWithLive,
} from './dm.util';
import type { Conversation, DirectMessage } from '../types/types';

const serverMessage: DirectMessage = {
  id: 'dm-1',
  conversationId: 'conv-1',
  author: 'alice',
  authorId: 'user-1',
  avatarUrl: null,
  content: 'Hello',
  createdAt: '2024-01-01T12:00:00.000Z',
  status: 'sent',
};

const conversation: Conversation = {
  id: 'conv-1',
  userOneId: 'user-1',
  userTwoId: 'user-2',
  updatedAt: '2024-01-01T12:00:00.000Z',
  userOne: { id: 'user-1', username: 'alice', avatarUrl: null },
  userTwo: { id: 'user-2', username: 'bob', avatarUrl: null },
};

describe('appendDmMessage', () => {
  it('appends a new direct message', () => {
    const { messages } = appendDmMessage([], serverMessage);
    expect(messages).toEqual([serverMessage]);
  });

  it('deduplicates by id', () => {
    const prev = [serverMessage];
    const { messages } = appendDmMessage(prev, serverMessage);
    expect(messages).toBe(prev);
  });

  it('replaces matching optimistic message with server message', () => {
    const optimistic = createOptimisticDmMessage({
      conversationId: 'conv-1',
      author: 'alice',
      authorId: 'user-1',
      content: 'Hello',
    });
    const { messages, replacedOptimisticId } = appendDmMessage([optimistic], serverMessage);
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe('dm-1');
    expect(replacedOptimisticId).toBe(optimistic.id);
  });
});

describe('mergeDmHistoryWithLive', () => {
  it('merges history with optimistic live messages in chronological order', () => {
    const optimistic = createOptimisticDmMessage({
      conversationId: 'conv-1',
      author: 'alice',
      authorId: 'user-1',
      content: 'Pending',
    });
    const history: DirectMessage[] = [serverMessage];
    const merged = mergeDmHistoryWithLive([optimistic], history);
    expect(merged.map((m) => m.id)).toEqual(['dm-1', optimistic.id]);
  });
});

describe('getOtherParticipant', () => {
  it('returns the other user in a conversation', () => {
    expect(getOtherParticipant(conversation, 'user-1')).toEqual(conversation.userTwo);
    expect(getOtherParticipant(conversation, 'user-2')).toEqual(conversation.userOne);
  });
});

describe('isOwnDirectMessage', () => {
  it('matches by authorId when available', () => {
    expect(isOwnDirectMessage(serverMessage, { id: 'user-1', username: 'alice' })).toBe(true);
    expect(isOwnDirectMessage(serverMessage, { id: 'user-2', username: 'bob' })).toBe(false);
  });
});

describe('applyDmUnreadOnMessage', () => {
  it('clears unread when the message is for the active conversation', () => {
    expect(applyDmUnreadOnMessage({ 'conv-1': 3 }, 'conv-1', 'conv-1')).toEqual({ 'conv-1': 0 });
  });

  it('does not increment unread for inactive conversations', () => {
    expect(applyDmUnreadOnMessage({ 'conv-1': 1 }, 'conv-1', 'conv-2')).toEqual({ 'conv-1': 1 });
    expect(applyDmUnreadOnMessage({}, 'conv-1', null)).toEqual({});
  });
});

describe('applyDmUnreadOnNotification', () => {
  it('increments unread when conversation is not active', () => {
    expect(applyDmUnreadOnNotification({}, 'conv-1', null)).toEqual({ 'conv-1': 1 });
    expect(applyDmUnreadOnNotification({ 'conv-1': 2 }, 'conv-1', 'conv-2')).toEqual({
      'conv-1': 3,
    });
  });

  it('does not increment unread for the active conversation', () => {
    expect(applyDmUnreadOnNotification({ 'conv-1': 0 }, 'conv-1', 'conv-1')).toEqual({
      'conv-1': 0,
    });
  });
});
