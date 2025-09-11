import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// 获取提交列表
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { 
      assignmentId, 
      studentId,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (assignmentId) where.assignmentId = assignmentId as string;
    if (status) where.status = status as string;
    
    // 学生只能看到自己的提交，教师可以看到自己课程的所有提交
    if (req.user!.role === 'STUDENT') {
      where.userId = req.user!.id;
    } else if (req.user!.role === 'TEACHER') {
      where.assignment = {
        knowledgePoint: {
          chapter: {
            course: {
              teacherId: req.user!.id
            }
          }
        }
      };
    }

    if (studentId && req.user!.role !== 'STUDENT') {
      where.userId = studentId as string;
    }

    const submissions = await prisma.submission.findMany({
      where,
      skip,
      take: Number(limit),
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
      },
      orderBy: { submittedAt: 'desc' }
    });

    const total = await prisma.submission.count({ where });

    res.json({
      success: true,
      data: {
        submissions,
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

// 获取单个提交详情
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
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

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // 权限检查
    const isOwner = submission.userId === req.user!.id;
    const isTeacher = req.user!.role === 'TEACHER' && 
                      submission.assignment?.knowledgePoint?.chapter?.course?.teacherId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this submission' });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建提交（学生）
router.post('/', authenticateToken, authorizeRoles('STUDENT'), async (req: any, res) => {
  try {
    const { assignmentId, answers } = req.body;

    if (!assignmentId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Please provide assignment ID and answers' });
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

    // 获取该作业的所有题目
    const questions = await prisma.question.findMany({
      where: { assignmentId }
    });

    // 计算总分
    let totalScore = 0;
    const answerData = answers.map((answer: any) => {
      const question = questions.find((q: any) => q.id === answer.questionId);
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`);
      }

      let score = 0;
      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        score = answer.answer === question.correctAnswer ? question.points : 0;
      } else if (question.type === 'SHORT_ANSWER') {
        score = answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim() ? question.points : 0;
      }

      totalScore += score;

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        score,
        feedback: score === question.points ? 'Correct' : 'Incorrect'
      };
    });

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

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        userId: req.user!.id,
        score: totalScore,
        status: 'GRADED',
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

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新提交（教师评分）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { score, feedback, status } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id },
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

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // 检查是否是该课程的教师
    if (req.user!.role !== 'ADMIN' && submission.assignment?.knowledgePoint?.chapter?.course?.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to grade this submission' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback,
        status: status || 'GRADED',
        gradedAt: new Date()
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

    res.json({
      success: true,
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;