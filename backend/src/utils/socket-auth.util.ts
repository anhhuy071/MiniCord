import type { Channel, Conversation, PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

type AuthDb = Pick<PrismaClient, 'channel' | 'serverMember' | 'conversation'>;

export type ChannelMemberResult =
  | { ok: true; channel: Channel }
  | { ok: false; reason: 'not_found' | 'forbidden' };

export type ConversationParticipantResult =
  | { ok: true; conversation: Conversation }
  | { ok: false; reason: 'not_found' | 'forbidden' };

export async function assertChannelMember(
  userId: string,
  channelId: string,
  db: AuthDb = prisma,
): Promise<ChannelMemberResult> {
  const channel = await db.channel.findUnique({ where: { id: channelId } });
  if (!channel) {
    return { ok: false, reason: 'not_found' };
  }

  const member = await db.serverMember.findUnique({
    where: {
      userId_serverId: { userId, serverId: channel.serverId },
    },
  });

  if (!member) {
    return { ok: false, reason: 'forbidden' };
  }

  return { ok: true, channel };
}

export async function assertConversationParticipant(
  userId: string,
  conversationId: string,
  db: AuthDb = prisma,
): Promise<ConversationParticipantResult> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return { ok: false, reason: 'not_found' };
  }

  if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
    return { ok: false, reason: 'forbidden' };
  }

  return { ok: true, conversation };
}
