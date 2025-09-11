import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取学习记录列表
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { courseId, studentId, page = 1, limit = 20 } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // 学生只能查看自己的学习记录
    if (req.user!.role === 'STUDENT') {
      where.userId = req.user!.id;
    } 
    // 教师可以查看自己课程的学习记录
    else if (req.user!.role === 'TEACHER') {
      where.course = {
        teacherId: req.user!.id
      };
    }
    // 管理员可以查看所有学习记录
    else if (req.user!.role === 'ADMIN' && studentId) {
      where.userId = studentId;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    const learningRecords = await prisma.enrollment.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
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

    // 转换数据格式以匹配前端期望的结构
    const records = learningRecords.map(record => ({
      id: record.id,
      studentId: record.userId,
      courseId: record.courseId,
      chapterId: null, // Enrollment模型中没有chapterId字段
      progress: record.progress,
      duration: 0, // 这里需要根据实际数据计算学习时长
      lastStudyTime: record.updatedAt.toISOString(),
      courseName: record.course.name,
      studentName: `${record.user.firstName} ${record.user.lastName}`
    }));

    const total = await prisma.enrollment.count({ where });

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取学习记录失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个学习记录详情
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
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

    if (!enrollment) {
      return res.status(404).json({ error: 'Learning record not found' });
    }

    // 检查权限
    if (req.user!.role === 'STUDENT' && enrollment.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to access this record' });
    }

    if (req.user!.role === 'TEACHER') {
      const course = await prisma.course.findUnique({
        where: { id: enrollment.courseId }
      });
      
      if (course?.teacherId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to access this record' });
      }
    }

    const record = {
      id: enrollment.id,
      studentId: enrollment.userId,
      courseId: enrollment.courseId,
      chapterId: null, // Enrollment模型中没有chapterId字段
      progress: enrollment.progress,
      duration: 0, // 这里需要根据实际数据计算学习时长
      lastStudyTime: enrollment.updatedAt.toISOString(),
      courseName: enrollment.course.name,
      studentName: `${enrollment.user.firstName} ${enrollment.user.lastName}`
    };

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('获取学习记录详情失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建学习记录（更新学习进度）
router.post('/', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { courseId, progress, duration } = req.body;
    const studentId = req.user!.id;

    if (!courseId || progress === undefined) {
      return res.status(400).json({ error: 'Course ID and progress are required' });
    }

    // 检查学生是否已选课
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Not enrolled in this course' });
    }

    // 更新学习进度
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      },
      data: {
        progress: Math.max(0, Math.min(100, Number(progress))),
        updatedAt: new Date()
      }
    });

    const record = {
      id: updatedEnrollment.id,
      studentId: updatedEnrollment.userId,
      courseId: updatedEnrollment.courseId,
      chapterId: null, // Enrollment模型中没有chapterId字段
      progress: updatedEnrollment.progress,
      duration: duration || 0,
      lastStudyTime: updatedEnrollment.updatedAt.toISOString()
    };

    res.status(201).json({
      success: true,
      data: record,
      message: 'Learning progress updated successfully'
    });
  } catch (error) {
    console.error('创建学习记录失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新学习记录（更新学习进度）
router.put('/:id', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { progress, duration } = req.body;
    const studentId = req.user!.id;

    if (progress === undefined) {
      return res.status(400).json({ error: 'Progress is required' });
    }

    // 检查学习记录是否存在
    const enrollment = await prisma.enrollment.findUnique({
      where: { id }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Learning record not found' });
    }

    // 检查是否是当前学生的学习记录
    if (enrollment.userId !== studentId) {
      return res.status(403).json({ error: 'Not authorized to update this record' });
    }

    // 更新学习进度
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        progress: Math.max(0, Math.min(100, Number(progress))),
        updatedAt: new Date()
      }
    });

    const record = {
      id: updatedEnrollment.id,
      studentId: updatedEnrollment.userId,
      courseId: updatedEnrollment.courseId,
      chapterId: null, // Enrollment模型中没有chapterId字段
      progress: updatedEnrollment.progress,
      duration: duration || 0,
      lastStudyTime: updatedEnrollment.updatedAt.toISOString()
    };

    res.json({
      success: true,
      data: record,
      message: 'Learning progress updated successfully'
    });
  } catch (error) {
    console.error('更新学习记录失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除学习记录（重置学习进度）
router.delete('/:id', authenticateToken, authorizeRoles('STUDENT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    // 检查学习记录是否存在
    const enrollment = await prisma.enrollment.findUnique({
      where: { id }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Learning record not found' });
    }

    // 检查权限
    if (req.user!.role === 'STUDENT' && enrollment.userId !== studentId) {
      return res.status(403).json({ error: 'Not authorized to delete this record' });
    }

    // 重置学习进度
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        progress: 0,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Learning progress reset successfully'
    });
  } catch (error) {
    console.error('删除学习记录失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;