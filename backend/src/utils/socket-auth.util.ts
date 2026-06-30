import type { Channel, Conversation, Message, PrismaClient, ServerMember } from '@prisma/client';
import prisma from '../lib/prisma.js';

type AuthDb = Pick<PrismaClient, 'channel' | 'serverMember' | 'conversation'>;
type ConversationAuthDb = Pick<PrismaClient, 'conversation'>;
type MessageAuthDb = AuthDb & Pick<PrismaClient, 'message'>;

export type ServerMemberResult =
  | { ok: true; member: ServerMember }
  | { ok: false; reason: 'forbidden' };

export type ChannelMemberResult =
  | { ok: true; channel: Channel }
  | { ok: false; reason: 'not_found' | 'forbidden' };

export type ConversationParticipantResult =
  | { ok: true; conversation: Conversation }
  | { ok: false; reason: 'not_found' | 'forbidden' };

export type MessageOwnerResult =
  | { ok: true; message: Message; channel: Channel }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'wrong_channel' };

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

export async function assertMessageOwner(
  userId: string,
  channelId: string,
  messageId: string,
  db: MessageAuthDb = prisma as MessageAuthDb,
): Promise<MessageOwnerResult> {
  const memberAuth = await assertChannelMember(userId, channelId, db);
  if (!memberAuth.ok) {
    return { ok: false, reason: memberAuth.reason === 'not_found' ? 'not_found' : 'forbidden' };
  }

  const message = await db.message.findUnique({ where: { id: messageId } });
  if (!message) {
    return { ok: false, reason: 'not_found' };
  }

  if (message.channelId !== memberAuth.channel.id) {
    return { ok: false, reason: 'wrong_channel' };
  }

  if (message.authorId !== userId) {
    return { ok: false, reason: 'forbidden' };
  }

  return { ok: true, message, channel: memberAuth.channel };
}

export async function assertConversationParticipant(
  userId: string,
  conversationId: string,
  db: ConversationAuthDb = prisma,
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

export async function assertServerMember(
  userId: string,
  serverId: string,
  db: AuthDb = prisma,
): Promise<ServerMemberResult> {
  const member = await db.serverMember.findUnique({
    where: {
      userId_serverId: { userId, serverId },
    },
  });

  if (!member) {
    return { ok: false, reason: 'forbidden' };
  }

  return { ok: true, member };
}
