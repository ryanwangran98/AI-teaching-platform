import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取章节列表
router.get('/', async (req, res) => {
  try {
    const { courseId, status } = req.query;

    const where: any = {};
    if (courseId) where.courseId = courseId as string;
    
    // 处理状态参数
    if (status === 'all') {
      // status='all' 时不添加状态过滤，返回所有状态
    } else if (status) {
      where.status = status as string;
    } else {
      // 默认只返回已发布的章节
      where.status = 'published';
    }

    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        knowledgePoints: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            knowledgePoints: true,
            materials: true,
            courseware: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // 添加作业计数
    const chaptersWithCounts = await Promise.all(chapters.map(async (chapter) => {
      const assignmentsCount = await prisma.assignment.count({
        where: {
          knowledgePoint: {
            chapterId: chapter.id
          }
        }
      });
      
      return {
        ...chapter,
        materialsCount: chapter._count.materials || 0,
        coursewareCount: chapter._count.courseware || 0,
        assignmentsCount: assignmentsCount || 0
      };
    }));

    res.json({
      success: true,
      data: chaptersWithCounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个章节详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            teacherId: true
          }
        },
        knowledgePoints: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json({
      success: true,
      data: chapter
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建章节（仅教师）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      courseId,
      order = 0
    } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // 验证课程是否存在且属于当前教师
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to add chapters to this course' });
    }

    const { duration, isCompleted, videoUrl, ...validCreateData } = req.body;
    
    const chapter = await prisma.chapter.create({
      data: {
        title: validCreateData.title,
        content: validCreateData.description,
        courseId: validCreateData.courseId,
        order: Number(validCreateData.order || 0)
      },
      include: {
        course: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新章节（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
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
      return res.status(403).json({ error: 'Not authorized to update this chapter' });
    }

    const { duration, isCompleted, videoUrl, ...restData } = updateData;
    
    // 允许更新所有相关字段
    const validUpdateData = {
      title: restData.title,
      content: restData.description || restData.content,
      order: restData.order,
      courseId: restData.courseId,
      status: restData.status
    };
    
    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: validUpdateData,
      include: {
        course: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedChapter
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除章节（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
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
      return res.status(403).json({ error: 'Not authorized to delete this chapter' });
    }

    // 先删除与章节相关的所有数据
    // 删除与章节直接关联的数据
    await prisma.material.deleteMany({
      where: { chapterId: id }
    });

    await prisma.courseware.deleteMany({
      where: { chapterId: id }
    });

    // 删除与章节关联的知识点及其相关数据
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: { chapterId: id },
      select: { id: true }
    });

    const knowledgePointIds = knowledgePoints.map(kp => kp.id);

    if (knowledgePointIds.length > 0) {
      // 删除与知识点关联的题目和作业 - 确保只删除属于当前章节的内容
      for (const kpId of knowledgePointIds) {
        // 删除知识点下的所有作业（包括关联的题目，因为Question与Assignment有级联关系）
        await prisma.assignment.deleteMany({
          where: {
            knowledgePointId: kpId,
            knowledgePoint: {
              chapterId: id
            }
          }
        });
        
        // 删除知识点下不关联作业的题目
        await prisma.question.deleteMany({
          where: {
            knowledgePointId: kpId,
            assignments: {
              none: {}
            },
            knowledgePoint: {
              chapterId: id
            }
          }
        });
      }

      // 删除知识点
      await prisma.knowledgePoint.deleteMany({
        where: { chapterId: id }
      });
    }

    // 然后删除章节本身
    await prisma.chapter.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('删除章节失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 批量更新章节顺序
router.put('/batch/order', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    const updatedChapters = await Promise.all(
      updates.map(async ({ id, order }: { id: string; order: number }) => {
        return prisma.chapter.update({
          where: { id },
          data: { order },
          include: {
            course: {
              select: { teacherId: true }
            }
          }
        });
      })
    );

    // 验证权限
    const unauthorized = updatedChapters.some(
      chapter => req.user!.role !== 'ADMIN' && chapter.course.teacherId !== req.user!.id
    );

    if (unauthorized) {
      return res.status(403).json({ error: 'Not authorized to update some chapters' });
    }

    res.json({
      success: true,
      data: updatedChapters
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;