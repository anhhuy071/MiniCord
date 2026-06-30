import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signToken } from '../utils/jwt.util.js';
import prisma from '../lib/prisma.js';
import { RequireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

const router = express.Router();

router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return sendError(res, 'All fields are required', 400);
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    
    if (existingUser) {
      return sendError(res, 'Username or email already exists', 400);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      }
    });
    
    // Generate token
    const token = signToken({ userId: user.id });
    
    sendSuccess(res, { 
      user: { id: user.id, username: user.username, email: user.email }, 
      token 
    }, 'User created successfully', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error during registration', 500);
  }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendError(res, 'All fields are required', 400);
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return sendError(res, 'Invalid credentials', 400);
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 400);
    }
    
    const token = signToken({ userId: user.id });
    
    sendSuccess(res, {
      user: { id: user.id, username: user.username, email: user.email },
      token
    }, 'Logged in successfully', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error during login', 500);
  }
});

// Ví dụ về một Route được bảo vệ (Protected Route) bằng middleware RequireAuth
router.get('/me', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    // Nhờ có auth.middleware.ts, req.user ở đây đã có sẵn thông tin userId giải mã từ token
    const userId = (req.user as any).userId;
    
    // Tìm thông tin user trong database, không trả về trường password
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, username: true, email: true } 
    });
    
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    
    sendSuccess(res, user, 'Bạn đã truy cập thành công vào route được bảo mật!', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error retrieving profile', 500);
  }
});

export default router;
