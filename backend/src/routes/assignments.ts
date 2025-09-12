import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import multer from 'multer';

// 配置multer用于处理文件上传
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// 获取作业列表
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      knowledgePointId,
      status,
      type,
      courseId, // 新增：支持按课程ID筛选
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // 对学生角色，只返回已发布的作业
    if (req.user!.role === 'STUDENT') {
      // 修复：确保状态过滤正确处理大小写，支持多种格式
      where.status = {
        in: ['PUBLISHED', 'published']
      };
      console.log('学生角色，只返回已发布的作业');
    } else if (status) {
      // 对教师或管理员角色，可以根据传入的status参数过滤
      where.status = status as string;
      console.log('教师或管理员角色，根据status参数过滤:', status);
    } else if (req.user!.role !== 'STUDENT') {
      // 教师或管理员默认返回所有状态的作业
      console.log('教师或管理员角色，返回所有状态的作业');
    }

    console.log('查询条件:', where);

    if (knowledgePointId) where.knowledgePointId = knowledgePointId as string;
    if (type) where.type = type as string;
    // 新增：支持按课程ID筛选
    if (courseId) {
      where.knowledgePoint = {
        chapter: {
          courseId: courseId as string
        }
      };
    }

    // 调试日志
    console.log('查询作业条件:', JSON.stringify(where, null, 2));
    
    // 根据用户角色决定是否包含提交信息
    const include: any = {
      knowledgePoint: {
        include: {
          chapter: {
            include: {
              course: true
            }
          }
        }
      },
      questions: {
        include: {
          question: true
        }
      }
    };

    // 如果是学生，包含提交信息
    if (req.user!.role === 'STUDENT') {
      include.submissions = {
        where: {
          userId: req.user!.id
        }
      };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      skip,
      take: Number(limit),
      include,
      orderBy: { createdAt: 'desc' }
    });

    // 调试日志
    console.log('查询到的作业数量:', assignments.length);
    console.log('作业数据:', JSON.stringify(assignments.slice(0, 2), null, 2));

    const total = await prisma.assignment.count({ where });

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取作业列表失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个作业详情
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 构建包含信息的对象
    const include: any = {
      knowledgePoint: {
        include: {
          chapter: {
            include: {
              course: true
            }
          }
        }
      },
      questions: {
        include: {
          question: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              difficulty: true,
              points: true,
              options: true,
              correctAnswer: true,
              explanation: true,
              knowledgePointId: true,
              createdAt: true,
              updatedAt: true,
              teacherId: true
            }
          }
        }
      }
    };

    // 如果是学生，包含该学生的提交信息
    if (req.user!.role === 'STUDENT') {
      include.submissions = {
        where: {
          userId: req.user!.id
        }
      };
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取教师专属作业
router.get('/teacher/my-assignments', authenticateToken, authorizeRoles('TEACHER'), async (req: any, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { 
        teacherId: req.user!.id 
      },
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        },
        questions: true,
        submissions: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建作业（仅教师）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const {
      title,
      description,
      type,
      knowledgePointId,
      dueDate,
      maxAttempts,
      timeLimit,
      totalPoints,
      orderIndex = 0,
      questionIds // 题目ID列表
    } = req.body;

    if (!title || !type || !knowledgePointId) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // 验证知识点是否存在且属于当前教师
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

    if (req.user!.role !== 'ADMIN' && knowledgePoint.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to add assignments to this course' });
    }

    // 如果提供了题目ID，验证这些题目是否存在且属于当前教师
    let validQuestionIds: string[] = [];
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      const questions = await prisma.question.findMany({
        where: {
          id: { in: questionIds },
          teacherId: req.user!.id
        }
      });

      // 只保留有效的题目ID
      validQuestionIds = questions.map(q => q.id);
      
      // 检查是否有无效的题目ID
      const invalidIds = questionIds.filter(id => !validQuestionIds.includes(id));
      if (invalidIds.length > 0) {
        console.warn('Invalid question IDs provided:', invalidIds);
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: String(title),
        description: description ? String(description) : undefined,
        type: String(type),
        knowledgePointId: String(knowledgePointId),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        totalPoints: totalPoints ? Number(totalPoints) : 100,
        status: 'DRAFT', // 默认状态为草稿
        teacherId: req.user!.id
        // 移除了直接关联题目的部分，将在创建后单独处理关联关系
      },
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
        // 移除了直接包含题目的部分
      }
    });

    // 创建题目和作业的关联关系
    if (validQuestionIds.length > 0) {
      await Promise.all(
        validQuestionIds.map(questionId => 
          prisma.questionAssignment.create({
            data: {
              questionId,
              assignmentId: assignment.id
            }
          })
        )
      );
    }

    // 重新获取作业信息，包含关联的题目
    const fullAssignment = await prisma.assignment.findUnique({
      where: { id: assignment.id },
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        },
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: fullAssignment
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新作业（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      questionIds, // 题目ID列表
      ...updateData
    } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
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
      return res.status(403).json({ error: 'Not authorized to update this assignment' });
    }

    // 处理题目关联
    if (questionIds !== undefined) {
      if (Array.isArray(questionIds)) {
        // 验证题目ID
        const questions = await prisma.question.findMany({
          where: {
            id: { in: questionIds },
            // 验证这些题目属于当前教师
            teacherId: req.user!.id
          }
        });

        const validQuestionIds = questions.map(q => q.id);
        
        // 先删除现有的关联关系
        await prisma.questionAssignment.deleteMany({
          where: {
            assignmentId: id
          }
        });
        
        // 再创建新的关联关系
        if (validQuestionIds.length > 0) {
          await Promise.all(
            validQuestionIds.map(questionId => 
              prisma.questionAssignment.create({
                data: {
                  questionId,
                  assignmentId: id
                }
              })
            )
          );
        }
      } else {
        // 如果提供了非数组值，断开所有题目关联
        await prisma.questionAssignment.deleteMany({
          where: {
            assignmentId: id
          }
        });
      }
    }

    // 处理totalPoints字段
    if (updateData.totalPoints !== undefined) {
      updateData.totalPoints = Number(updateData.totalPoints);
    }
    
    // 处理knowledgePointId字段，转换为knowledgePoint关系
    if (updateData.knowledgePointId !== undefined) {
      updateData.knowledgePoint = {
        connect: { id: updateData.knowledgePointId }
      };
      delete updateData.knowledgePointId;
    }
    
    // 移除Prisma模型中不存在的字段
    delete updateData.timeLimit;

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        },
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedAssignment
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除作业（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
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
      return res.status(403).json({ error: 'Not authorized to delete this assignment' });
    }

    // 删除与该作业关联的所有题目（确保只删除属于当前课程的题目）
    await prisma.question.deleteMany({
      where: {
        assignments: {
          some: {
            assignmentId: id
          }
        },
        knowledgePoint: {
          chapter: {
            courseId: assignment.knowledgePoint.chapter.course.id
          }
        }
      }
    });

    // 然后删除作业本身
    await prisma.assignment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 提交作业（学生） - 处理FormData格式提交
router.post('/:id/submit', authenticateToken, authorizeRoles('STUDENT'), upload.array('files'), async (req: any, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { content } = req.body;
    const files = req.files || [];

    if (!content) {
      return res.status(400).json({ error: 'Please provide content' });
    }

    // 验证作业是否存在且已发布
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
        status: 'PUBLISHED'
      },
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
      return res.status(404).json({ error: 'Assignment not found or not published' });
    }

    // 检查是否已提交过
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        userId: req.user!.id
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already submitted this assignment' });
    }

    try {
      // 解析JSON格式的答案
      const answers = JSON.parse(content);
      
      // 验证答案格式
      if (!Array.isArray(answers)) {
        throw new Error('Answers must be an array');
      }

      // 获取该作业的所有题目
      const questions = await prisma.question.findMany({
        where: { 
          assignments: {
            some: {
              assignmentId: assignmentId
            }
          }
        }
      });

      // 计算总分
      let totalScore = 0;
      const answerData = answers.map((answer: any) => {
        const question = questions.find((q: any) => q.id === answer.questionId);
        if (!question) {
          throw new Error(`Question ${answer.questionId} not found`);
        }

        let score = 0;
        // 根据不同题型进行评分
        if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
          score = answer.answer === question.correctAnswer ? question.points : 0;
        } else if (question.type === 'MULTIPLE_CHOICE') {
          // 多选题需要特殊处理，确保所有选项都匹配
          if (Array.isArray(answer.answer) && Array.isArray(question.correctAnswer)) {
            const isEqual = answer.answer.sort().join(',') === question.correctAnswer.sort().join(',');
            score = isEqual ? question.points : 0;
          }
        }

        totalScore += score;

        return {
          questionId: answer.questionId,
          answer: answer.answer,
          score,
          feedback: score === question.points ? 'Correct' : 'Incorrect'
        };
      });

      // 创建提交记录，将答案数据保存到content字段中
      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          userId: req.user!.id,
          content: JSON.stringify(answers), // 保存答案数据
          score: totalScore,
          // 修复：提交后状态应为SUBMITTED而不是GRADED
          status: 'SUBMITTED',
          submittedAt: new Date()
        },
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
          },
          user: true
        }
      });

      // 答案数据已经通过content字段存储在submission中
      // 不需要创建单独的answer记录

      res.status(201).json({
        success: true,
        data: submission
      });
    } catch (jsonError) {
      console.error('Error parsing content:', jsonError);
      res.status(400).json({ error: 'Invalid content format. Content must be valid JSON.' });
    }
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;