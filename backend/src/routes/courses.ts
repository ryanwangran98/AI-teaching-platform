import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取所有课程（支持筛选和分页）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      college,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { status: { in: ['PUBLISHED', 'ACTIVE'] } };
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (college) where.college = college;
    if (category) where.category = category;

    const courses = await prisma.course.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        chapters: {
          select: {
            id: true,
            title: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            enrollments: true,
            chapters: true
          }
        }
      }
    });

    const total = await prisma.course.count({ where });

    res.json({
      success: true,
      data: {
        courses,
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

// 获取单个课程详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        chapters: {
          include: {
            knowledgePoints: {
              orderBy: { order: 'asc' }
            },
            // chapters关联不存在于Course模型中
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true,
            chapters: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建课程（仅教师）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const {
      title,
      code,
      description,
      college,
      category,
      credits,
      coverImage,
      tags,
      level
    } = req.body;

    if (!title || !description || !college || !category || !credits) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const course = await prisma.course.create({
      data: {
        code: String(code),
        name: String(title),
        description: String(description),
        department: String(college),
        category: String(category),
        credits: Number(credits),
        coverImage: coverImage ? String(coverImage) : undefined,
        teacherId: req.user!.id,
        status: 'DRAFT'
      } as any,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error: any) {
    console.error('创建课程错误:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// 更新课程（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 发布课程（仅教师或管理员）
router.patch('/:id/publish', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to publish this course' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course published successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 取消发布课程（仅教师或管理员）
router.patch('/:id/unpublish', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to unpublish this course' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { status: 'DRAFT' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course unpublished successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除课程（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    // 使用事务来确保级联删除的完整性
    await prisma.$transaction(async (prisma) => {
      // 首先删除所有相关的问题
      const chapters = await prisma.chapter.findMany({
        where: { courseId: id },
        include: { knowledgePoints: true }
      });
      
      for (const chapter of chapters) {
        for (const kp of chapter.knowledgePoints) {
          // 先获取该知识点下的所有作业
          const assignments = await prisma.assignment.findMany({
            where: { knowledgePointId: kp.id },
            include: { questions: true }
          });
          
          // 先删除每个作业下的提交
          for (const assignment of assignments) {
            await prisma.submission.deleteMany({
              where: { assignmentId: assignment.id }
            });
            
            // 删除作业下的问题
            await prisma.question.deleteMany({
              where: { assignmentId: assignment.id }
            });
          }
          
          // 然后删除知识点下的作业
          await prisma.assignment.deleteMany({
            where: { knowledgePointId: kp.id }
          });
          
          // 删除不关联作业的问题
          await prisma.question.deleteMany({
            where: { knowledgePointId: kp.id, assignmentId: null }
          });
        }
        
        // 删除知识点
        await prisma.knowledgePoint.deleteMany({
          where: { chapterId: chapter.id }
        });
        
        // 删除章节相关的课件
        await prisma.courseware.deleteMany({
          where: { chapterId: chapter.id }
        });
        
        // 删除章节相关的资料
        await prisma.material.deleteMany({
          where: { chapterId: chapter.id }
        });
      }
      
      // 删除所有章节
      await prisma.chapter.deleteMany({
        where: { courseId: id }
      });
      
      // 删除所有选课记录
      await prisma.enrollment.deleteMany({
        where: { courseId: id }
      });
      
      // 最后删除课程
      await prisma.course.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取教师自己的课程
router.get('/teacher/my-courses', authenticateToken, authorizeRoles('TEACHER'), async (req: AuthRequest, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { teacherId: req.user!.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            chapters: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取教师最近活动
router.get('/teacher/recent-activities', authenticateToken, authorizeRoles('TEACHER'), async (req: AuthRequest, res) => {
  try {
    const teacherId = req.user!.id;
    const { limit = 10 } = req.query;
    
    // 获取最近的通知（不限时间范围）
    const recentNotifications = await prisma.notification.findMany({
      where: { 
        userId: teacherId 
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) * 2, // 获取更多记录以确保有足够的数据
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
    
    // 获取最近的课件（不限时间范围）
    const recentCoursewares = await prisma.courseware.findMany({
      where: { 
        uploadedById: teacherId 
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) * 2,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
    });
    
    // 获取最近的资料（不限时间范围）
    const recentMaterials = await prisma.material.findMany({
      where: { 
        uploadedById: teacherId 
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) * 2,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
    });
    
    // 获取最近创建或更新的课程（不限时间范围）
    const recentCourses = await prisma.course.findMany({
      where: { 
        teacherId: teacherId 
      },
      orderBy: { updatedAt: 'desc' },
      take: Number(limit) * 2,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            chapters: true
          }
        }
      }
    });
    
    // 合并所有活动并按时间排序
    const allActivities = [
      ...recentNotifications.map((item: any) => ({
        id: item.id,
        type: 'notification',
        action: '发布了通知',
        title: item.title,
        course: item.relatedType === 'COURSE' ? `课程相关` : '系统通知',
        time: item.createdAt,
        createdAt: item.createdAt,
      })),
      ...recentCoursewares.map((item: any) => ({
        id: item.id,
        type: 'courseware',
        action: '上传了课件',
        title: item.title,
        course: item.chapter?.course?.name || '未知课程',
        time: item.createdAt,
        createdAt: item.createdAt,
      })),
      ...recentMaterials.map((item: any) => ({
        id: item.id,
        type: 'material',
        action: '上传了资料',
        title: item.title,
        course: item.chapter?.course?.name || '未知课程',
        time: item.createdAt,
        createdAt: item.createdAt,
      })),
      ...recentCourses.map((item: any) => ({
        id: item.id,
        type: 'course',
        action: item.createdAt === item.updatedAt ? '创建了课程' : '更新了课程',
        title: item.name,
        course: item.name,
        time: item.updatedAt,
        createdAt: item.updatedAt,
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, Number(limit));
    
    res.json({
      success: true,
      data: allActivities
    });
  } catch (error) {
    console.error('获取教师最近活动失败:', error);
    res.status(500).json({ error: '获取教师最近活动失败' });
  }
});

// 学生加入课程
router.post('/:id/enroll', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user!.id;

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 检查是否已经加入该课程
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // 创建选课记录
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 学生退出课程
router.delete('/:id/enroll', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user!.id;

    // 检查选课记录是否存在
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

    // 删除选课记录
    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取学生已加入的课程
router.get('/student/my-courses', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            },
            chapters: {
              select: {
                id: true,
                title: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            },
            _count: {
              select: {
                enrollments: true,
                chapters: true
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    const courses = enrollments.map((enrollment) => {
      const course = enrollment.course;
      const progress = Math.round(enrollment.progress || 0);
      const completedChapters = Math.round((progress / 100) * course.chapters.length);
      return {
        ...course,
        progress,                    // 前端 Dashboard 依赖
        completedChapters,           // 前端 Dashboard 依赖
        totalChapters: course.chapters.length,
      };
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;