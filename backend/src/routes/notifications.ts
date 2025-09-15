import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { notificationSchema } from '../utils/validation';

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

// 创建通知（仅创建草稿，不广播）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), validateRequest(notificationSchema), async (req: CustomRequest, res: Response) => {
  try {
    const { title, content, type, relatedId, relatedType, status, targetType, targetValue } = req.body;

    // 创建通知草稿 - 教师只发通知不接收通知
    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        type,
        status: 'DRAFT', // 创建时始终为草稿
        userId: req.user!.id, // 创建者ID（仅用于记录，不接收通知）
        senderId: req.user!.id, // 发送者ID
        targetType: targetType || 'all',
        targetValue: targetValue || null,
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
    let where: any = {};
    
    // 根据用户角色构建不同的查询条件
    if (req.user?.role === 'STUDENT') {
      // 学生只能看到自己收到的已发布通知
      where.userId = req.user.id;
      where.status = 'PUBLISHED';
    } else {
      // 教师和管理员不接收通知，返回空结果
      res.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0,
          },
        },
      });
      return;
    }

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
        sender: {
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

    // 查询未读数量（仅学生）
    let countInfo: any = {};
    if (req.user?.role === 'STUDENT') {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: req.user.id,
          status: 'PUBLISHED',
          isRead: false,
        },
      });
      countInfo.unreadCount = unreadCount;
    }

    res.json({
      success: true,
      data: {
        notifications,
        ...countInfo,
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
      where: { id },
      data: { isRead: true, updatedAt: new Date() },
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
      where: { userId: req.user?.id },
      data: { isRead: true, updatedAt: new Date() },
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

// 发布通知（广播给目标用户）
router.put('/:id/publish', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 检查通知草稿是否存在且属于当前用户
    const existingNotification = await prisma.notification.findUnique({
      where: { 
        id,
        senderId: req.user?.id,
      },
    });

    if (!existingNotification) {
      return res.status(404).json({ error: '通知不存在或无权限操作' });
    }

    // 更新当前通知为已发布（教师不接收通知，仅作为记录）
    await prisma.notification.update({
      where: { id },
      data: { 
        status: 'PUBLISHED',
        updatedAt: new Date() 
      },
    });

    // 根据目标类型获取目标用户列表（仅学生）
    let targetUserIds: string[] = [];
    
    switch (existingNotification.targetType) {
      case 'all':
        // 获取所有学生
        const allStudents = await prisma.user.findMany({
          where: { role: 'STUDENT' },
          select: { id: true }
        });
        targetUserIds = allStudents.map(user => user.id);
        break;
        
      case 'course':
        // 获取指定课程的所有学生
        if (existingNotification.targetValue) {
          const courseEnrollments = await prisma.enrollment.findMany({
            where: {
              courseId: existingNotification.targetValue,
              status: 'ENROLLED'
            },
            select: { userId: true }
          });
          targetUserIds = courseEnrollments.map(enrollment => enrollment.userId);
        }
        break;
        
      case 'individual':
        // 指定单个学生
        if (existingNotification.targetValue) {
          const targetUser = await prisma.user.findUnique({
            where: { id: existingNotification.targetValue },
            select: { role: true }
          });
          if (targetUser && targetUser.role === 'STUDENT') {
            targetUserIds = [existingNotification.targetValue];
          }
        }
        break;
    }

    // 为每个目标学生创建通知副本（教师编辑的内容就是学生接收的内容）
    const notificationsToCreate = targetUserIds.map(userId => ({
      title: existingNotification.title,
      content: existingNotification.content,
      type: existingNotification.type,
      status: 'PUBLISHED',
      userId: userId,
      senderId: req.user!.id,
      targetType: existingNotification.targetType,
      targetValue: existingNotification.targetValue,
      relatedId: existingNotification.relatedId,
      relatedType: existingNotification.relatedType,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // 批量创建通知
    await prisma.notification.createMany({
      data: notificationsToCreate,
    });

    res.json({
      success: true,
      message: `通知已发布给 ${targetUserIds.length} 个学生`,
      data: {
        publishedCount: targetUserIds.length,
        targetType: existingNotification.targetType,
        targetValue: existingNotification.targetValue
      }
    });
  } catch (error) {
    console.error('发布通知失败:', error);
    res.status(500).json({ error: '发布通知失败' });
  }
});

// 删除通知
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id },
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