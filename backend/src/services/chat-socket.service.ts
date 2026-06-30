import type { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { assertMessageOwner, type MessageOwnerResult } from '../utils/socket-auth.util.js';

type ChatDeleteDb = Pick<PrismaClient, 'channel' | 'serverMember' | 'conversation' | 'message'>;

export type ChatDeletePayload = {
  channelId: string;
  messageId: string;
};

export type ChatDeleteFailureReason = Exclude<MessageOwnerResult, { ok: true }>['reason'];

export function isValidChatDeletePayload(payload: unknown): payload is ChatDeletePayload {
  if (!payload || typeof payload !== 'object') return false;
  const { channelId, messageId } = payload as ChatDeletePayload;
  return (
    typeof channelId === 'string' &&
    channelId.trim().length > 0 &&
    typeof messageId === 'string' &&
    messageId.trim().length > 0
  );
}

export function mapChatDeleteFailure(reason: ChatDeleteFailureReason): string {
  if (reason === 'not_found') return 'Message not found';
  if (reason === 'wrong_channel') return 'Message not in this channel';
  return 'Access denied';
}

export type DeleteOwnChannelMessageResult =
  | { ok: true; broadcast: ChatDeletePayload }
  | { ok: false; reason: ChatDeleteFailureReason; errorMessage: string };

export async function deleteOwnChannelMessage(
  userId: string,
  channelId: string,
  messageId: string,
  db: ChatDeleteDb = prisma,
): Promise<DeleteOwnChannelMessageResult> {
  const auth = await assertMessageOwner(userId, channelId, messageId, db);
  if (!auth.ok) {
    return {
      ok: false,
      reason: auth.reason,
      errorMessage: mapChatDeleteFailure(auth.reason),
    };
  }

  await db.message.delete({ where: { id: messageId } });

  return {
    ok: true,
    broadcast: { channelId, messageId },
  };
}
