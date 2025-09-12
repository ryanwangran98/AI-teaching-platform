import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取知识点列表
router.get('/', async (req, res) => {
  try {
    const { 
      chapterId, 
      courseId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    if (chapterId) where.chapterId = chapterId as string;
    if (courseId) where.chapter = { courseId: courseId as string };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            Assignment: true,
            Question: true
          }
        }
      },
      orderBy: { [sortBy as string]: sortOrder }
    });

    const total = await prisma.knowledgePoint.count({ where });

    // 添加资料和课件计数
    const knowledgePointsWithCounts = await Promise.all(knowledgePoints.map(async (kp) => {
      const materialsCount = await prisma.material.count({
        where: {
          chapterId: kp.chapterId
        }
      });
      
      const coursewareCount = await prisma.courseware.count({
        where: {
          chapterId: kp.chapterId
        }
      });
      
      return {
        ...kp,
        materialsCount: materialsCount || 0,
        coursewareCount: coursewareCount || 0,
        assignmentsCount: kp._count?.Assignment || 0,
        questionsCount: kp._count?.Question || 0
      };
    }));

    res.json({
      success: true,
      data: {
        knowledgePoints: knowledgePointsWithCounts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个知识点详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                teacherId: true
              }
            }
          }
        }
      }
    });

    if (!knowledgePoint) {
      return res.status(404).json({ error: 'Knowledge point not found' });
    }

    res.json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建知识点（仅教师）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      content,
      chapterId,
      orderIndex = 0,
      difficulty = 'MEDIUM',
      estimatedTime = 30,
      tags = []
    } = req.body;

    // 增强输入验证
    if (!title || typeof title !== 'string' || title.length > 100) {
      return res.status(400).json({ error: 'Invalid title, must be a string with max 100 characters' });
    }
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Invalid description' });
    }
    if (!chapterId || typeof chapterId !== 'string') {
      return res.status(400).json({ error: 'Invalid chapterId' });
    }
    if (estimatedTime && (typeof estimatedTime !== 'number' || estimatedTime <= 0)) {
      return res.status(400).json({ error: 'Invalid estimatedTime' });
    }

    // 验证章节是否存在且属于当前教师
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: {
          select: { teacherId: true }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    if (req.user!.role !== 'ADMIN' && chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to add knowledge points to this chapter' });
    }

    const knowledgePoint = await prisma.knowledgePoint.create({
      data: {
        title,
        description,
        content,
        chapterId,
        order: Number(orderIndex)
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新知识点（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { chapterId, ...otherData } = req.body;

    // 构建更新数据，处理chapterId映射
    const updateData: any = { ...otherData };
    if (chapterId) {
      updateData.chapter = {
        connect: { id: chapterId }
      };
    }

    console.log('更新知识点请求数据:', req.body);
    console.log('处理后的更新数据:', updateData);

    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              select: { teacherId: true }
            }
          }
        }
      }
    });

    if (!knowledgePoint) {
      return res.status(404).json({ error: 'Knowledge point not found' });
    }

    if (req.user!.role !== 'ADMIN' && knowledgePoint.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this knowledge point' });
    }

    // 如果更新章节，验证新章节的权限
    if (chapterId && chapterId !== knowledgePoint.chapterId) {
      const newChapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          course: {
            select: { teacherId: true }
          }
        }
      });

      if (!newChapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      if (req.user!.role !== 'ADMIN' && newChapter.course.teacherId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to update knowledge points to this chapter' });
      }
    }

    const updatedKnowledgePoint = await prisma.knowledgePoint.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        content: updateData.content,
        difficulty: updateData.difficulty || 'medium',
        importance: updateData.importance || 'medium',
        status: updateData.status || 'draft',
        ...(chapterId && { chapter: { connect: { id: chapterId } } })
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedKnowledgePoint
    });
  } catch (error) {
    console.error('更新知识点错误:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除知识点（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              select: { teacherId: true }
            }
          }
        }
      }
    });

    if (!knowledgePoint) {
      return res.status(404).json({ error: 'Knowledge point not found' });
    }

    if (req.user!.role !== 'ADMIN' && knowledgePoint.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this knowledge point' });
    }

    // 删除知识点下的所有作业（包括关联的题目，因为Question与Assignment有级联关系）
    await prisma.assignment.deleteMany({
      where: {
        knowledgePointId: id,
        knowledgePoint: {
          chapterId: knowledgePoint.chapterId
        }
      }
    });
    
    // 删除知识点下不关联作业的题目
    await prisma.question.deleteMany({
      where: {
        knowledgePointId: id,
        assignmentId: null,
        knowledgePoint: {
          chapterId: knowledgePoint.chapterId
        }
      }
    });
    
    // 最后删除知识点
    await prisma.knowledgePoint.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Knowledge point deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 批量更新知识点顺序
router.put('/batch/order', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    // 先验证权限
    for (const { id } of updates) {
      const knowledgePoint = await prisma.knowledgePoint.findUnique({
        where: { id },
        include: {
          chapter: {
            include: {
              course: {
                select: { teacherId: true }
              }
            }
          }
        }
      });

      if (!knowledgePoint) {
        return res.status(404).json({ error: `Knowledge point ${id} not found` });
      }

      if (req.user!.role !== 'ADMIN' && knowledgePoint.chapter.course.teacherId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to update some knowledge points' });
      }
    }

    const updatedPoints = await Promise.all(
      updates.map(async ({ id, orderIndex }: { id: string; orderIndex: number }) => {
        return prisma.knowledgePoint.update({
          where: { id },
          data: { order: Number(orderIndex) },
          include: {
            chapter: {
              select: {
                id: true,
                title: true
              }
            }
          }
        });
      })
    );

    // 权限已在循环中验证

    res.json({
      success: true,
      data: updatedPoints
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;