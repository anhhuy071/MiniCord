import { describe, it, expect, vi } from 'vitest';
import {
  assertChannelMember,
  assertConversationParticipant,
  assertMessageOwner,
  assertServerMember,
} from './socket-auth.util.js';

function createMockDb(overrides: {
  channel?: { id: string; serverId: string; name: string } | null;
  member?: { id: string } | null;
  conversation?: {
    id: string;
    userOneId: string;
    userTwoId: string;
  } | null;
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
      findUnique: vi.fn().mockResolvedValue(
        overrides.conversation !== undefined ? overrides.conversation : null,
      ),
    },
    message: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.message !== undefined ? overrides.message : null,
      ),
    },
  };
}

describe('assertChannelMember', () => {
  it('returns not_found when channel does not exist', async () => {
    const db = createMockDb({ channel: null });

    const result = await assertChannelMember('user-1', 'channel-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'not_found' });
    expect(db.serverMember.findUnique).not.toHaveBeenCalled();
  });

  it('returns forbidden when user is not a server member', async () => {
    const db = createMockDb({
      channel: { id: 'channel-1', serverId: 'server-1', name: 'general' },
      member: null,
    });

    const result = await assertChannelMember('user-1', 'channel-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'forbidden' });
    expect(db.serverMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_serverId: { userId: 'user-1', serverId: 'server-1' },
      },
    });
  });

  it('returns channel when user is a server member', async () => {
    const channel = { id: 'channel-1', serverId: 'server-1', name: 'general' };
    const db = createMockDb({
      channel,
      member: { id: 'member-1' },
    });

    const result = await assertChannelMember('user-1', 'channel-1', db as any);

    expect(result).toEqual({ ok: true, channel });
  });
});

describe('assertMessageOwner', () => {
  const channel = { id: 'channel-1', serverId: 'server-1', name: 'general' };
  const message = {
    id: 'msg-1',
    channelId: 'channel-1',
    authorId: 'user-1',
    content: 'Hello',
  };

  it('returns not_found when channel does not exist', async () => {
    const db = createMockDb({ channel: null });

    const result = await assertMessageOwner('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'not_found' });
    expect(db.message.findUnique).not.toHaveBeenCalled();
  });

  it('returns forbidden when user is not a channel member', async () => {
    const db = createMockDb({ channel, member: null });

    const result = await assertMessageOwner('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'forbidden' });
    expect(db.message.findUnique).not.toHaveBeenCalled();
  });

  it('returns not_found when message does not exist', async () => {
    const db = createMockDb({ channel, member: { id: 'member-1' }, message: null });

    const result = await assertMessageOwner('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('returns wrong_channel when message belongs to another channel', async () => {
    const db = createMockDb({
      channel,
      member: { id: 'member-1' },
      message: { ...message, channelId: 'channel-2' },
    });

    const result = await assertMessageOwner('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'wrong_channel' });
  });

  it('returns forbidden when user is not the author', async () => {
    const db = createMockDb({
      channel,
      member: { id: 'member-1' },
      message: { ...message, authorId: 'user-2' },
    });

    const result = await assertMessageOwner('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('returns message and channel when user owns the message', async () => {
    const db = createMockDb({ channel, member: { id: 'member-1' }, message });

    const result = await assertMessageOwner('user-1', 'channel-1', 'msg-1', db as any);

    expect(result).toEqual({ ok: true, message, channel });
  });
});

describe('assertConversationParticipant', () => {
  it('returns not_found when conversation does not exist', async () => {
    const db = createMockDb({ conversation: null });

    const result = await assertConversationParticipant(
      'user-1',
      'conv-1',
      db as any,
    );

    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('returns forbidden when user is not a participant', async () => {
    const db = createMockDb({
      conversation: {
        id: 'conv-1',
        userOneId: 'user-a',
        userTwoId: 'user-b',
      },
    });

    const result = await assertConversationParticipant(
      'user-c',
      'conv-1',
      db as any,
    );

    expect(result).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('returns conversation when user is userOne', async () => {
    const conversation = {
      id: 'conv-1',
      userOneId: 'user-a',
      userTwoId: 'user-b',
    };
    const db = createMockDb({ conversation });

    const result = await assertConversationParticipant(
      'user-a',
      'conv-1',
      db as any,
    );

    expect(result).toEqual({ ok: true, conversation });
  });

  it('returns conversation when user is userTwo', async () => {
    const conversation = {
      id: 'conv-1',
      userOneId: 'user-a',
      userTwoId: 'user-b',
    };
    const db = createMockDb({ conversation });

    const result = await assertConversationParticipant(
      'user-b',
      'conv-1',
      db as any,
    );

    expect(result).toEqual({ ok: true, conversation });
  });
});

describe('assertServerMember', () => {
  it('returns forbidden when user is not a server member', async () => {
    const db = createMockDb({ member: null });

    const result = await assertServerMember('user-1', 'server-1', db as any);

    expect(result).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('returns member when user belongs to the server', async () => {
    const member = { id: 'member-1', userId: 'user-1', serverId: 'server-1', role: 'MEMBER' };
    const db = createMockDb({ member });

    const result = await assertServerMember('user-1', 'server-1', db as any);

    expect(result).toEqual({ ok: true, member });
  });
});
