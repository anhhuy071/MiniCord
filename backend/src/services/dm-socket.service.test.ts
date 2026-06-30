import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidDmJoinPayload,
  isValidDmLeavePayload,
  isValidDmSendPayload,
  loadDirectMessageHistory,
  mapDmFailure,
  selectDmNotificationTargets,
  sendDirectMessage,
} from './dm-socket.service.js';

function createMockDb(overrides: {
  conversation?: {
    id: string;
    userOneId: string;
    userTwoId: string;
  } | null;
  directMessages?: Array<{
    id: string;
    content: string;
    authorId: string;
    conversationId: string;
    createdAt: Date;
    author: { username: string; avatarUrl: string | null };
  }>;
  createdMessage?: {
    id: string;
    content: string;
    authorId: string;
    conversationId: string;
    createdAt: Date;
    author: { username: string; avatarUrl: string | null };
  };
} = {}) {
  return {
    conversation: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.conversation !== undefined ? overrides.conversation : null,
      ),
      update: vi.fn().mockResolvedValue(undefined),
    },
    directMessage: {
      findMany: vi.fn().mockResolvedValue(overrides.directMessages ?? []),
      create: vi.fn().mockResolvedValue(
        overrides.createdMessage ?? {
          id: 'dm-1',
          content: 'Hello',
          authorId: 'user-1',
          conversationId: 'conv-1',
          createdAt: new Date('2024-01-01T12:00:00.000Z'),
          author: { username: 'alice', avatarUrl: null },
        },
      ),
    },
  };
}

describe('isValidDmSendPayload', () => {
  it('accepts valid conversationId and content', () => {
    expect(isValidDmSendPayload({ conversationId: 'conv-1', content: 'Hi' })).toBe(true);
  });

  it('rejects empty content', () => {
    expect(isValidDmSendPayload({ conversationId: 'conv-1', content: '   ' })).toBe(false);
  });

  it('rejects missing conversationId', () => {
    expect(isValidDmSendPayload({ content: 'Hi' })).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(isValidDmSendPayload(null)).toBe(false);
    expect(isValidDmSendPayload('dm:send')).toBe(false);
  });
});

describe('isValidDmJoinPayload', () => {
  it('accepts valid conversationId', () => {
    expect(isValidDmJoinPayload({ conversationId: 'conv-1' })).toBe(true);
  });

  it('rejects blank conversationId', () => {
    expect(isValidDmJoinPayload({ conversationId: '  ' })).toBe(false);
  });
});

describe('isValidDmLeavePayload', () => {
  it('accepts valid conversationId', () => {
    expect(isValidDmLeavePayload({ conversationId: 'conv-1' })).toBe(true);
  });

  it('rejects blank conversationId', () => {
    expect(isValidDmLeavePayload({ conversationId: '  ' })).toBe(false);
  });
});

describe('selectDmNotificationTargets', () => {
  it('excludes sockets already in the conversation room', () => {
    const roomMembers = new Set(['socket-a', 'socket-b']);
    expect(
      selectDmNotificationTargets({
        targetSocketIds: ['socket-a', 'socket-c'],
        conversationRoomSocketIds: roomMembers,
      }),
    ).toEqual(['socket-c']);
  });

  it('excludes the sender socket', () => {
    expect(
      selectDmNotificationTargets({
        targetSocketIds: ['sender-socket', 'socket-c'],
        conversationRoomSocketIds: undefined,
        senderSocketId: 'sender-socket',
      }),
    ).toEqual(['socket-c']);
  });

  it('returns empty when all targets are in the room', () => {
    const roomMembers = new Set(['socket-a']);
    expect(
      selectDmNotificationTargets({
        targetSocketIds: ['socket-a'],
        conversationRoomSocketIds: roomMembers,
      }),
    ).toEqual([]);
  });
});

describe('mapDmFailure', () => {
  it('maps not_found', () => {
    expect(mapDmFailure('not_found')).toBe('Conversation not found');
  });

  it('maps forbidden', () => {
    expect(mapDmFailure('forbidden')).toBe('Access denied');
  });
});

describe('sendDirectMessage', () => {
  const conversation = { id: 'conv-1', userOneId: 'user-1', userTwoId: 'user-2' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a message and returns formatted payload for participants', async () => {
    const db = createMockDb({ conversation });

    const result = await sendDirectMessage('user-1', 'conv-1', 'Hello there', db as any);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.message).toMatchObject({
      id: 'dm-1',
      conversationId: 'conv-1',
      author: 'alice',
      authorId: 'user-1',
      content: 'Hello',
    });
    expect(result.targetUserId).toBe('user-2');
    expect(db.directMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'Hello there',
          authorId: 'user-1',
          conversationId: 'conv-1',
        }),
      }),
    );
    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it('returns forbidden when user is not a participant', async () => {
    const db = createMockDb({ conversation });

    const result = await sendDirectMessage('user-3', 'conv-1', 'Hello', db as any);

    expect(result).toEqual({
      ok: false,
      reason: 'forbidden',
      errorMessage: 'Access denied',
    });
    expect(db.directMessage.create).not.toHaveBeenCalled();
  });

  it('returns not_found when conversation does not exist', async () => {
    const db = createMockDb({ conversation: null });

    const result = await sendDirectMessage('user-1', 'conv-1', 'Hello', db as any);

    expect(result).toEqual({
      ok: false,
      reason: 'not_found',
      errorMessage: 'Conversation not found',
    });
  });
});

describe('loadDirectMessageHistory', () => {
  const conversation = { id: 'conv-1', userOneId: 'user-1', userTwoId: 'user-2' };

  it('returns chronological formatted messages for participants', async () => {
    const db = createMockDb({
      conversation,
      directMessages: [
        {
          id: 'dm-2',
          content: 'Later',
          authorId: 'user-2',
          conversationId: 'conv-1',
          createdAt: new Date('2024-01-01T13:00:00.000Z'),
          author: { username: 'bob', avatarUrl: null },
        },
        {
          id: 'dm-1',
          content: 'Earlier',
          authorId: 'user-1',
          conversationId: 'conv-1',
          createdAt: new Date('2024-01-01T12:00:00.000Z'),
          author: { username: 'alice', avatarUrl: null },
        },
      ],
    });

    const result = await loadDirectMessageHistory('user-1', 'conv-1', db as any);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.messages.map((m) => m.id)).toEqual(['dm-1', 'dm-2']);
    expect(result.messages[0].author).toBe('alice');
  });

  it('returns forbidden for non-participants', async () => {
    const db = createMockDb({ conversation });

    const result = await loadDirectMessageHistory('user-3', 'conv-1', db as any);

    expect(result).toEqual({
      ok: false,
      reason: 'forbidden',
      errorMessage: 'Access denied',
    });
  });
});
