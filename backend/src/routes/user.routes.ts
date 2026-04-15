import express, { Response } from 'express';
import { RequireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Lấy thông tin public profile của 1 user
router.get('/:id', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error parsing user' });
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
       select: { id: true, username: true, email: true, avatarUrl: true }
     });
     
     res.json(updatedUser);
   } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'Lỗi cập nhật profile' });
   }
});

export default router;
