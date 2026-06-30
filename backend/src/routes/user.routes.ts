import express, { Response } from 'express';
import { RequireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { PUBLIC_USER_SELECT } from '../utils/user.util.js';

const router = express.Router();

router.get('/:id', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { ...PUBLIC_USER_SELECT, createdAt: true },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user, 'User profile retrieved', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error parsing user', 500);
  }
});

router.put('/me', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = (req.user as any).userId;
    const { username, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: { ...PUBLIC_USER_SELECT, email: true },
    });

    sendSuccess(res, updatedUser, 'Profile updated', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Lỗi cập nhật profile', 500);
  }
});

export default router;
