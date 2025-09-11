import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

// 扩展 Request 类型以包含 user 属性
interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const prisma = new PrismaClient();

// 创建通知
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: CustomRequest, res: Response) => {
  try {
    const { title, content, type, relatedId, relatedType } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        type,
        userId: req.user!.id, // 使用认证中间件获取的用户ID
        relatedId,
        relatedType,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    res.status(500).json({ error: '创建通知失败' });
  }
});

// 获取用户通知列表
router.get('/', authenticateToken, async (req: CustomRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', type, isRead } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {
      userId: req.user?.id,
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    // 查询通知
    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 查询总数
    const total = await prisma.notification.count({ where });

    // 查询未读数量
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user?.id,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ error: '获取通知列表失败' });
  }
});

// 获取单个通知详情
router.get('/:id', authenticateToken, async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: {
        id,
        userId: req.user?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('获取通知详情失败:', error);
    res.status(500).json({ error: '获取通知详情失败' });
  }
});

// 标记通知为已读
router.put('/:id/read', authenticateToken, async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: req.user?.id,
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    res.status(500).json({ error: '标记通知为已读失败' });
  }
});

// 标记所有通知为已读
router.put('/read-all', authenticateToken, async (req: CustomRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user?.id,
        isRead: false,
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: '所有通知已标记为已读',
    });
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    res.status(500).json({ error: '标记所有通知为已读失败' });
  }
});

// 删除通知
router.delete('/:id', authenticateToken, async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: {
        id,
        userId: req.user?.id,
      },
    });

    res.json({
      success: true,
      message: '通知已删除',
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ error: '删除通知失败' });
  }
});

export default router;