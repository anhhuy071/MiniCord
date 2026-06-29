import express, { Response } from 'express';
import { RequireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { chronologicalFromLatest } from '../utils/message-query.util.js';

const router = express.Router();

// Get all conversations for the current user
router.get('/', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = (req.user as any).userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userOneId: userId },
          { userTwoId: userId }
        ]
      },
      include: {
        userOne: { select: { id: true, username: true, avatarUrl: true } },
        userTwo: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' }
    });

    sendSuccess(res, conversations, 'Conversations retrieved successfully', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error retrieving conversations', 500);
  }
});

// Create or get a conversation with a specific user
router.post('/:targetUserId', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = (req.user as any).userId;
    const targetUserId = req.params.targetUserId as string;

    if (userId === targetUserId) {
      return sendError(res, 'Cannot create a conversation with yourself', 400);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return sendError(res, 'Target user not found', 404);
    }

    // Find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userOneId: userId, userTwoId: targetUserId },
          { userOneId: targetUserId, userTwoId: userId }
        ]
      },
      include: {
        userOne: { select: { id: true, username: true, avatarUrl: true } },
        userTwo: { select: { id: true, username: true, avatarUrl: true } },
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userOneId: userId,
          userTwoId: targetUserId
        },
        include: {
          userOne: { select: { id: true, username: true, avatarUrl: true } },
          userTwo: { select: { id: true, username: true, avatarUrl: true } },
        }
      });
    }

    sendSuccess(res, conversation, 'Conversation ready', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error creating conversation', 500);
  }
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = (req.user as any).userId;
    const conversationId = req.params.conversationId as string;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });

    if (!conversation || (conversation.userOneId !== userId && conversation.userTwoId !== userId)) {
      return sendError(res, 'Access denied', 403);
    }

    const latestMessages = await prisma.directMessage.findMany({
      where: { conversationId },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const messages = chronologicalFromLatest(latestMessages);

    sendSuccess(res, messages, 'Messages retrieved successfully', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error retrieving messages', 500);
  }
});

export default router;
