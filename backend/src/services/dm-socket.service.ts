import type { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { assertConversationParticipant } from '../utils/socket-auth.util.js';
import { chronologicalFromLatest } from '../utils/message-query.util.js';

type DmDb = Pick<PrismaClient, 'conversation' | 'directMessage'>;

export type DmSendPayload = {
  conversationId: string;
  content: string;
};

export type DmJoinPayload = {
  conversationId: string;
};

export type FormattedDirectMessage = {
  id: string;
  conversationId: string;
  author: string;
  authorId: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
};

export type DmFailureReason = 'not_found' | 'forbidden';

export function isValidDmSendPayload(payload: unknown): payload is DmSendPayload {
  if (!payload || typeof payload !== 'object') return false;
  const { conversationId, content } = payload as DmSendPayload;
  return (
    typeof conversationId === 'string' &&
    conversationId.trim().length > 0 &&
    typeof content === 'string' &&
    content.trim().length > 0
  );
}

export function isValidDmJoinPayload(payload: unknown): payload is DmJoinPayload {
  if (!payload || typeof payload !== 'object') return false;
  const { conversationId } = payload as DmJoinPayload;
  return typeof conversationId === 'string' && conversationId.trim().length > 0;
}

export function isValidDmLeavePayload(payload: unknown): payload is DmJoinPayload {
  return isValidDmJoinPayload(payload);
}

export function selectDmNotificationTargets(params: {
  targetSocketIds: string[];
  conversationRoomSocketIds: Set<string> | undefined;
  senderSocketId?: string;
}): string[] {
  const { targetSocketIds, conversationRoomSocketIds, senderSocketId } = params;

  return targetSocketIds.filter((socketId) => {
    if (senderSocketId && socketId === senderSocketId) return false;
    if (conversationRoomSocketIds?.has(socketId)) return false;
    return true;
  });
}

export function mapDmFailure(reason: DmFailureReason): string {
  if (reason === 'not_found') return 'Conversation not found';
  return 'Access denied';
}

function formatDirectMessage(
  row: {
    id: string;
    content: string;
    authorId: string;
    conversationId: string;
    createdAt: Date;
    author: { username: string; avatarUrl: string | null };
  },
): FormattedDirectMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    author: row.author.username,
    authorId: row.authorId,
    avatarUrl: row.author.avatarUrl,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export type SendDirectMessageResult =
  | { ok: true; message: FormattedDirectMessage; targetUserId: string }
  | { ok: false; reason: DmFailureReason; errorMessage: string };

export async function sendDirectMessage(
  userId: string,
  conversationId: string,
  content: string,
  db: DmDb = prisma,
): Promise<SendDirectMessageResult> {
  const auth = await assertConversationParticipant(userId, conversationId, db);
  if (!auth.ok) {
    return {
      ok: false,
      reason: auth.reason,
      errorMessage: mapDmFailure(auth.reason),
    };
  }

  const trimmedContent = content.trim();
  const { conversation } = auth;

  const newMessage = await db.directMessage.create({
    data: {
      content: trimmedContent,
      authorId: userId,
      conversationId: conversation.id,
    },
    include: { author: { select: { username: true, avatarUrl: true } } },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const targetUserId =
    conversation.userOneId === userId ? conversation.userTwoId : conversation.userOneId;

  return {
    ok: true,
    message: formatDirectMessage(newMessage),
    targetUserId,
  };
}

export type LoadDirectMessageHistoryResult =
  | { ok: true; messages: FormattedDirectMessage[] }
  | { ok: false; reason: DmFailureReason; errorMessage: string };

export async function loadDirectMessageHistory(
  userId: string,
  conversationId: string,
  db: DmDb = prisma,
): Promise<LoadDirectMessageHistoryResult> {
  const auth = await assertConversationParticipant(userId, conversationId, db);
  if (!auth.ok) {
    return {
      ok: false,
      reason: auth.reason,
      errorMessage: mapDmFailure(auth.reason),
    };
  }

  const latestMessages = await db.directMessage.findMany({
    where: { conversationId },
    include: { author: { select: { username: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const messages = chronologicalFromLatest(latestMessages).map(formatDirectMessage);

  return { ok: true, messages };
}
