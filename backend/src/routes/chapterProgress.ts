import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取章节学习进度
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { courseId, chapterId } = req.query as any;
    const userId = req.user!.id;

    const where: any = { userId };

    if (courseId) {
      where.courseId = courseId;
    }

    if (chapterId) {
      where.chapterId = chapterId;
    }

    const chapterProgress = await prisma.chapterProgress.findMany({
      where,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        course: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: chapterProgress
    });
  } catch (error) {
    console.error('获取章节学习进度失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个章节的学习进度
router.get('/:chapterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user!.id;

    const chapterProgress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        course: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!chapterProgress) {
      return res.json({
        success: true,
        data: {
          id: '',
          userId,
          chapterId,
          courseId: '',
          watchedTime: 0,
          progress: 0,
          isCompleted: false,
          lastWatchedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          chapter: null,
          course: null
        }
      });
    }

    res.json({
      success: true,
      data: chapterProgress
    });
  } catch (error) {
    console.error('获取章节学习进度详情失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新章节学习进度
router.put('/:chapterId', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { chapterId } = req.params;
    const { watchedTime, progress, courseId } = req.body;
    const userId = req.user!.id;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // 检查章节是否存在
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId }
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // 检查学生是否已选课
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Not enrolled in this course' });
    }

    // 查找或创建章节进度记录
    const existingProgress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      }
    });

    let updatedProgress;

    if (existingProgress) {
      // 更新现有记录
      updatedProgress = await prisma.chapterProgress.update({
        where: {
          userId_chapterId: {
            userId,
            chapterId
          }
        },
        data: {
          watchedTime: watchedTime !== undefined ? Number(watchedTime) : existingProgress.watchedTime,
          progress: progress !== undefined ? Math.max(0, Math.min(100, Number(progress))) : existingProgress.progress,
          isCompleted: progress !== undefined ? Number(progress) >= 100 : existingProgress.isCompleted,
          lastWatchedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // 创建新记录
      updatedProgress = await prisma.chapterProgress.create({
        data: {
          userId,
          chapterId,
          courseId,
          watchedTime: Number(watchedTime) || 0,
          progress: Number(progress) || 0,
          isCompleted: Number(progress) >= 100,
          lastWatchedAt: new Date()
        }
      });
    }

    // 更新课程总体进度
    const allChapterProgress = await prisma.chapterProgress.findMany({
      where: {
        userId,
        courseId
      }
    });

    const totalChapters = await prisma.chapter.count({
      where: {
        courseId
      }
    });

    const averageProgress = allChapterProgress.length > 0 
      ? allChapterProgress.reduce((sum, cp) => sum + cp.progress, 0) / totalChapters
      : 0;

    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data: {
        progress: Math.round(averageProgress),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedProgress
    });
  } catch (error) {
    console.error('更新章节学习进度失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除章节学习进度
router.delete('/:chapterId', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user!.id;

    const deletedProgress = await prisma.chapterProgress.delete({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      }
    });

    res.json({
      success: true,
      message: 'Chapter progress deleted successfully'
    });
  } catch (error) {
    console.error('删除章节学习进度失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;