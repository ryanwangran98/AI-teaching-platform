import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';
import { createDifyService } from '../services/dify';

const router = express.Router();

// 获取所有课程（支持筛选和分页）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      college,
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
            title: true
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
            knowledgePoints: true
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

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 返回包含 agentAppId 和 agentAccessToken 的课程详情
    res.json({
      success: true,
      data: {
        ...course,
        agentAppId: course.agentAppId,
        agentAccessToken: course.agentAccessToken
      }
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
      credits,
      difficulty,
      coverImage,
      status,
      tags
    } = req.body;

    if (!title || !code) {
      return res.status(400).json({ error: 'Please provide course title and code' });
    }

    // 处理tags字段，如果是数组则转换为JSON字符串
    let processedTags = null;
    if (tags && Array.isArray(tags)) {
      processedTags = JSON.stringify(tags);
    }

    // 创建课程
    const course = await prisma.course.create({
      data: {
        code: String(code),
        name: String(title),
        description: description ? String(description) : null,
        credits: credits || 3,
        difficulty: difficulty || 'MEDIUM',
        coverImage: coverImage ? String(coverImage) : null,
        status: status || 'DRAFT',
        tags: processedTags,
        teacherId: req.user!.id
      },
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

    // 解析tags字段为数组返回给前端
    if (course.tags) {
      try {
        course.tags = JSON.parse(course.tags);
      } catch (e) {
        // 如果解析失败，保持原样
        console.error('Failed to parse tags JSON:', e);
      }
    }

    res.status(201).json({
      success: true,
      data: course,
      message: '课程创建成功'
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

    // 处理tags字段，如果是数组则转换为JSON字符串
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
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

    // 解析tags字段为数组返回给前端
    if (updatedCourse.tags) {
      try {
        updatedCourse.tags = JSON.parse(updatedCourse.tags);
      } catch (e) {
        // 如果解析失败，保持原样
        console.error('Failed to parse tags JSON:', e);
      }
    }

    res.json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
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
          // 删除该知识点下的所有作业
          const assignments = await prisma.assignment.findMany({
            where: { knowledgePointId: kp.id }
          });
          
          // 删除每个作业下的提交
          for (const assignment of assignments) {
            await prisma.submission.deleteMany({
              where: { assignmentId: assignment.id }
            });
          }
          
          // 删除该知识点下的所有作业（包括关联的问题，因为Question与Assignment有级联关系）
          await prisma.assignment.deleteMany({
            where: { knowledgePointId: kp.id }
          });
          
          // 删除该知识点下不关联作业的问题
          await prisma.question.deleteMany({
            where: { 
              knowledgePointId: kp.id, 
              assignments: {
                none: {}
              },
              // 额外确保这些问题属于当前课程
              knowledgePoint: {
                chapter: {
                  courseId: id
                }
              }
            }
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

    // 解析tags字段为数组返回给前端
    const processedCourses = courses.map(course => {
      const processedCourse = { ...course };
      if (processedCourse.tags) {
        try {
          processedCourse.tags = JSON.parse(processedCourse.tags);
        } catch (e) {
          // 如果解析失败，保持原样
          console.error('Failed to parse tags JSON:', e);
        }
      }
      return processedCourse;
    });

    res.json({
      success: true,
      data: processedCourses
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
        userId: teacherId,
        status: 'PUBLISHED' // 只获取已发布的通知
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

    // 添加调试日志
    logInfo('Enroll course request received', { userId, courseId });

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    logInfo('Course lookup result', { courseId, courseFound: !!course });

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

    logInfo('Existing enrollment check', { userId, courseId, alreadyEnrolled: !!existingEnrollment });

    if (existingEnrollment) {
      logInfo('Enrollment rejected - already enrolled', { userId, courseId });
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

    logInfo('Course enrollment successful', { userId, courseId, enrollmentId: enrollment.id });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    logError('Failed to enroll in course', { error, userId: req.user?.id, courseId: req.params.id });
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

// 为课程创建Agent应用（仅教师或管理员）
router.post('/:id/agent-app', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to create agent for this course' });
    }

    // 创建Agent应用
    const difyService = createDifyService();
    
    // 如果已经有Agent应用，先删除旧的（重新创建）
    if (course.agentAppId) {
      try {
        // 尝试删除旧的应用（如果失败也不影响新应用的创建）
        await difyService.deleteApp(course.agentAppId);
        console.log(`已删除旧的Agent应用: ${course.agentAppId}`);
      } catch (deleteError) {
        console.warn(`删除旧Agent应用失败，继续创建新应用:`, deleteError);
      }
    }

    // 创建新的Agent应用
    const agentInfo = await difyService.createAgentAppWithToken(
      `${course.name} - AI助手`,
      `为课程"${course.name}"提供智能问答和学习辅助`
    );

    // 更新课程，添加Agent应用信息
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        agentAppId: agentInfo.appId,
        agentAccessToken: agentInfo.accessToken,
        agentAccessCode: agentInfo.code
      },
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
      message: 'Agent应用创建成功'
    });
  } catch (error) {
    console.error('创建Agent应用失败:', error);
    res.status(500).json({ error: '创建Agent应用失败', message: error instanceof Error ? error.message : '未知错误' });
  }
});

// 获取课程的Agent应用信息（仅教师或管理员）
router.get('/:id/agent-app', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to access agent for this course' });
    }

    // 返回Agent应用信息
    if (course.agentAppId && course.agentAccessToken) {
      // 生成iframe嵌入代码
      const difyService = createDifyService();
      const iframeCode = difyService.generateIframeCode(course.agentAccessToken);
      
      res.json({
        success: true,
        data: {
          agentAppId: course.agentAppId,
          agentAccessToken: course.agentAccessToken,
          agentAccessCode: course.agentAccessCode,
          iframeCode: iframeCode
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: '该课程没有Agent应用'
      });
    }
  } catch (error) {
    console.error('获取Agent应用信息失败:', error);
    res.status(500).json({ error: '获取Agent应用信息失败', message: error instanceof Error ? error.message : '未知错误' });
  }
});

// 获取课程的Agent应用信息（学生端使用）
router.get('/:id/agent-app-info', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 检查学生是否已加入该课程
    if (req.user!.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
    }

    // 返回Agent应用信息
    if (course.agentAppId && course.agentAccessToken) {
      res.json({
        success: true,
        data: {
          agentAppId: course.agentAppId,
          agentAccessToken: course.agentAccessToken,
          agentAccessCode: course.agentAccessCode
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: '该课程没有Agent应用'
      });
    }
  } catch (error) {
    console.error('获取Agent应用信息失败:', error);
    res.status(500).json({ error: '获取Agent应用信息失败', message: error instanceof Error ? error.message : '未知错误' });
  }
});

// 获取学生已加入的课程
router.get('/student/my-courses', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'ENROLLED'] } },
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
                title: true
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

// 将知识库关联到课程的Agent应用
router.post('/:id/agent-app/datasets/:datasetId', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, datasetId } = req.params;

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 检查权限
    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to manage agent for this course' });
    }

    // 检查课程是否有Agent应用
    if (!course.agentAppId) {
      return res.status(400).json({ error: '该课程尚未创建Agent应用' });
    }

    // 检查资料是否存在且属于该课程
    const material = await prisma.material.findFirst({
      where: {
        datasetId: datasetId,
        chapter: {
          courseId: id
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: '未找到该知识库关联的资料' });
    }

    // 使用Dify服务关联知识库
    const difyService = createDifyService();
    await difyService.addDatasetToApp(course.agentAppId, datasetId);

    res.json({
      success: true,
      message: '知识库关联成功'
    });
  } catch (error) {
    console.error('关联知识库失败:', error);
    res.status(500).json({ 
      error: '关联知识库失败', 
      message: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 从课程的Agent应用中移除知识库
router.delete('/:id/agent-app/datasets/:datasetId', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, datasetId } = req.params;

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 检查权限
    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to manage agent for this course' });
    }

    // 检查课程是否有Agent应用
    if (!course.agentAppId) {
      return res.status(400).json({ error: '该课程尚未创建Agent应用' });
    }

    // 使用Dify服务移除知识库
    const difyService = createDifyService();
    await difyService.removeDatasetFromApp(course.agentAppId, datasetId);

    res.json({
      success: true,
      message: '知识库移除成功'
    });
  } catch (error) {
    console.error('移除知识库失败:', error);
    res.status(500).json({ 
      error: '移除知识库失败', 
      message: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 获取课程的Agent应用关联的知识库列表
router.get('/:id/agent-app/datasets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 检查权限（学生需要已加入课程，教师需要是课程创建者）
    if (req.user!.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
    } else if (req.user!.role === 'TEACHER' && course.teacherId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this course' });
    }

    // 检查课程是否有Agent应用
    if (!course.agentAppId) {
      return res.json({
        success: true,
        data: []
      });
    }

    // 获取课程的所有资料及其知识库信息
    const materials = await prisma.material.findMany({
      where: {
        chapter: {
          courseId: id
        },
        datasetId: {
          not: null
        }
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
      data: materials.map(material => ({
        id: material.id,
        title: material.title,
        datasetId: material.datasetId,
        documentId: material.documentId,
        chapter: material.chapter,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }))
    });
  } catch (error) {
    console.error('获取知识库列表失败:', error);
    res.status(500).json({ 
      error: '获取知识库列表失败', 
      message: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

export default router;