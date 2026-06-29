import { describe, it, expect, vi } from 'vitest';
import {
  assertChannelMember,
  assertConversationParticipant,
} from './socket-auth.util.js';

function createMockDb(overrides: {
  channel?: { id: string; serverId: string; name: string } | null;
  member?: { id: string } | null;
  conversation?: {
    id: string;
    userOneId: string;
    userTwoId: string;
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
