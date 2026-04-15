import express, { Response } from 'express';
import { RequireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

const router = express.Router();

// 1. Lấy danh sách server mà user hiện tại đã tham gia
router.get('/', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = (req.user as any).userId;

    const servers = await prisma.server.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        channels: true // Include luôn danh sách channel để frontend dễ render cây thư mục
      }
    });

    sendSuccess(res, servers, 'Lấy danh sách server thành công', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Lỗi server khi lấy danh sách servers', 500);
  }
});

// 2. Tạo Server mới
router.post('/', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, imageUrl } = req.body;
    const userId = (req.user as any).userId;

    if (!name) {
      return sendError(res, 'Tên server là bắt buộc', 400);
    }

    // Dùng transaction để đảm bảo tạo Server -> Tạo Member (Owner) -> Tạo Channel mặc định thành công đồng thời
    const newServer = await prisma.$transaction(async (tx) => {
      const server = await tx.server.create({
        data: {
          name,
          imageUrl,
          ownerId: userId,
        }
      });

      // Tạo member đóng vai trò OWNER
      await tx.serverMember.create({
        data: {
          userId,
          serverId: server.id,
          role: 'OWNER'
        }
      });

      // Tạo một channel mặc định (general)
      await tx.channel.create({
        data: {
          name: 'general',
          type: 'TEXT',
          serverId: server.id
        }
      });

      return server;
    });

    sendSuccess(res, newServer, 'Tạo server thành công', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Lỗi server khi tạo Server', 500);
  }
});

// 3. Tham gia vào 1 server đã có
router.post('/:serverId/join', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const serverId = req.params.serverId as string;
    const userId = (req.user as any).userId;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return sendError(res, 'Server không tồn tại', 404);
    }

    // Kiểm tra xem đã join chưa
    const existingMember = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: { userId, serverId }
      }
    });

    if (existingMember) {
      return sendError(res, 'Bạn đã là thành viên của server này', 400);
    }

    const member = await prisma.serverMember.create({
      data: {
        userId,
        serverId,
        role: 'MEMBER'
      }
    });

    sendSuccess(res, member, 'Tham gia server thành công', 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Lỗi server khi tham gia Server', 500);
  }
});

// 4. Tạo Channel mới trong Server (chỉ dành cho Owner hoặc Admin)
router.post('/:serverId/channels', RequireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const serverId = req.params.serverId as string;
    const { name, type } = req.body;
    const userId = (req.user as any).userId;

    if (!name) {
      return sendError(res, 'Tên channel là bắt buộc', 400);
    }

    // Kiểm tra quyền
    const member = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId, serverId } }
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return sendError(res, 'Bạn không có quyền tạo channel trong server này', 403);
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        type: type || 'TEXT',
        serverId,
      }
    });

    sendSuccess(res, channel, 'Tạo channel thành công', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Lỗi server khi tạo Channel', 500);
  }
});

export default router;
