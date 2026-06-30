import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteOwnChannelMessage,
  isValidChatDeletePayload,
  mapChatDeleteFailure,
} from './chat-socket.service.js';

function createMockDb(overrides: {
  channel?: { id: string; serverId: string; name: string } | null;
  member?: { id: string } | null;
  message?: {
    id: string;
    channelId: string;
    authorId: string;
    content: string;
  } | null;
} = {}) {
  return {
    channel: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.channel !== undefined ? overrides.channel : null,
      ),
    },
    serverMember: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.member !== undefined ? overrides.member : null,
      ),
    },
    conversation: {
      findUnique: vi.fn(),
    },
    message: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.message !== undefined ? overrides.message : null,
      ),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe('isValidChatDeletePayload', () => {
  it('accepts valid channelId and messageId', () => {
    expect(isValidChatDeletePayload({ channelId: 'ch-1', messageId: 'msg-1' })).toBe(true);
  });

  it('rejects empty channelId', () => {
    expect(isValidChatDeletePayload({ channelId: '  ', messageId: 'msg-1' })).toBe(false);
  });

  it('rejects missing messageId', () => {
    expect(isValidChatDeletePayload({ channelId: 'ch-1' })).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(isValidChatDeletePayload(null)).toBe(false);
    expect(isValidChatDeletePayload('chat:delete')).toBe(false);
  });
});

describe('mapChatDeleteFailure', () => {
  it('maps not_found to user-facing message', () => {
    expect(mapChatDeleteFailure('not_found')).toBe('Message not found');
  });

  it('maps wrong_channel to user-facing message', () => {
    expect(mapChatDeleteFailure('wrong_channel')).toBe('Message not in this channel');
  });

  it('maps forbidden to access denied', () => {
    expect(mapChatDeleteFailure('forbidden')).toBe('Access denied');
  });
});

describe('deleteOwnChannelMessage', () => {
  const channel = { id: 'channel-1', serverId: 'server-1', name: 'general' };
  const message = {
    id: 'msg-1',
    channelId: 'channel-1',
    authorId: 'user-1',
    content: 'Hello',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the message and returns broadcast payload when user owns it', async () => {
    const db = createMockDb({ channel, member: { id: 'member-1' }, message });

    const result = await deleteOwnChannelMessage('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({
      ok: true,
      broadcast: { channelId: 'channel-1', messageId: 'msg-1' },
    });
    expect(db.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
  });

  it('returns forbidden without deleting when user is not the author', async () => {
    const db = createMockDb({
      channel,
      member: { id: 'member-1' },
      message: { ...message, authorId: 'user-2' },
    });

    const result = await deleteOwnChannelMessage('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({
      ok: false,
      reason: 'forbidden',
      errorMessage: 'Access denied',
    });
    expect(db.message.delete).not.toHaveBeenCalled();
  });

  it('returns not_found when message does not exist', async () => {
    const db = createMockDb({ channel, member: { id: 'member-1' }, message: null });

    const result = await deleteOwnChannelMessage('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({
      ok: false,
      reason: 'not_found',
      errorMessage: 'Message not found',
    });
    expect(db.message.delete).not.toHaveBeenCalled();
  });
});
