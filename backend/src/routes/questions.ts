import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取题目列表
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { 
      assignmentId, 
      type, 
      difficulty, 
      knowledgePointId,
      courseId,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // 如果指定了作业ID，查找关联到该作业的题目
    if (assignmentId) {
      const questionAssignments = await prisma.questionAssignment.findMany({
        where: { assignmentId: assignmentId as string },
        select: { questionId: true }
      });
      const questionIds = questionAssignments.map(qa => qa.questionId);
      where.id = { in: questionIds };
    }
    
    if (type) where.type = type as string;
    if (difficulty) where.difficulty = difficulty as string;
    if (knowledgePointId) where.knowledgePointId = knowledgePointId as string;

    // 教师只能查看自己课程的题目
    if (req.user!.role === 'TEACHER' && !courseId && !assignmentId) {
      // 获取教师所有课程ID
      const teacherCourses = await prisma.course.findMany({
        where: { teacherId: req.user!.id },
        select: { id: true }
      });
      const courseIds = teacherCourses.map(course => course.id);
      
      // 添加课程过滤条件（通过知识点和章节关联）
      where.knowledgePoint = {
        chapter: {
          courseId: {
            in: courseIds
          }
        }
      };
    } else if (courseId) {
      // 如果指定了courseId，过滤该课程的题目
      where.knowledgePoint = {
        chapter: {
          courseId: courseId as string
        }
      };
    }

    const questions = await prisma.question.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        // 修改关联信息的包含方式
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        knowledgePoint: {
          include: {
            chapter: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.question.count({ where });

    res.json({
      success: true,
      data: {
        questions,
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

// 获取单个题目详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        // 修改关联信息的包含方式
        assignments: {
          include: {
            assignment: {
              include: {
                knowledgePoint: {
                  include: {
                    chapter: {
                      include: {
                        course: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建题目（仅教师）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const {
      title,
      type,
      content,
      options,
      correctAnswer,
      explanation,
      difficulty,
      points,
      knowledgePointId,
      status
    } = req.body;

    if (!title || !type || !content || !correctAnswer || !knowledgePointId) {
      return res.status(400).json({ error: 'Please provide all required fields: title, type, content, correctAnswer, and knowledgePointId' });
    }

    // 验证知识点并获取课程信息
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgePointId },
      include: {
        chapter: {
          include: {
            course: true
          }
        }
      }
    });

    if (!knowledgePoint) {
      return res.status(404).json({ error: 'Knowledge point not found' });
    }

    // 验证教师权限
    if (req.user!.role !== 'ADMIN' && knowledgePoint.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to add questions to this course' });
    }

    const question = await prisma.question.create({
      data: {
        title,
        type,
        content,
        options: options ? JSON.stringify(options) : null,
        correctAnswer,
        explanation,
        difficulty: difficulty || 'MEDIUM',
        points: points || 1,
        knowledgePointId: knowledgePointId,
        teacherId: req.user!.id,
        status: status || 'draft'
      },
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 批量创建题目
router.post('/batch', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { questions, assignmentId } = req.body;

    if (!Array.isArray(questions) || !assignmentId) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    // 验证作业权限
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (req.user!.role !== 'ADMIN' && assignment.knowledgePoint.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to add questions to this assignment' });
    }

    // 创建题目并关联到作业
    const createdQuestions = await Promise.all(
      questions.map(async (q, index) => {
        // 创建题目
        const question = await prisma.question.create({
          data: {
            title: q.title,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || 'MEDIUM',
            points: q.points || 1,
            knowledgePointId: assignment.knowledgePointId,
            teacherId: req.user!.id
          }
        });
        
        // 创建题目和作业的关联关系
        await prisma.questionAssignment.create({
          data: {
            questionId: question.id,
            assignmentId: assignmentId
          }
        });
        
        return question;
      })
    );

    res.status(201).json({
      success: true,
      data: createdQuestions
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新题目（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            assignment: {
              include: {
                knowledgePoint: {
                  include: {
                    chapter: {
                      include: {
                        course: {
                          select: { teacherId: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: {
                  select: { teacherId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 验证教师权限 - 通过assignment或直接通过knowledgePoint
    let authorizedTeacherId;
    if (question.assignments && question.assignments.length > 0) {
      authorizedTeacherId = question.assignments[0].assignment.knowledgePoint.chapter.course.teacherId;
    } else if (question.knowledgePoint) {
      authorizedTeacherId = question.knowledgePoint.chapter.course.teacherId;
    } else {
      return res.status(400).json({ error: 'Question has no valid course association' });
    }

    if (req.user!.role !== 'ADMIN' && authorizedTeacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this question' });
    }

    // 处理options字段转换
    const processedData: any = {
      ...updateData,
      options: updateData.options ? JSON.stringify(updateData.options) : null
    };

    // 确保status字段正确处理
    if (updateData.status) {
      processedData.status = updateData.status;
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: processedData,
      include: {
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        knowledgePoint: {
          include: {
            chapter: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除题目（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            assignment: {
              include: {
                knowledgePoint: {
                  include: {
                    chapter: {
                      include: {
                        course: {
                          select: { teacherId: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: {
                  select: { teacherId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 验证教师权限 - 通过assignment或直接通过knowledgePoint
    let authorizedTeacherId;
    if (question.assignments && question.assignments.length > 0) {
      authorizedTeacherId = question.assignments[0].assignment.knowledgePoint.chapter.course.teacherId;
    } else if (question.knowledgePoint) {
      authorizedTeacherId = question.knowledgePoint.chapter.course.teacherId;
    } else {
      return res.status(400).json({ error: 'Question has no valid course association' });
    }

    if (req.user!.role !== 'ADMIN' && authorizedTeacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    await prisma.question.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取题目统计
router.get('/stats/overview', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const stats = await prisma.question.groupBy({
      by: ['type', 'difficulty'],
      _count: {
        id: true
      },
      _avg: {
        points: true
      }
    });

    const totalQuestions = await prisma.question.count();

    res.json({
      success: true,
      data: {
        totalQuestions,
        typeStats: stats.filter(s => s.type),
        difficultyStats: stats.filter(s => s.difficulty)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;