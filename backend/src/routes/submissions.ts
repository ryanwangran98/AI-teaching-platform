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
        user: true,
        answers: {
          include: {
            question: true,
            questionAssignment: true
          }
        }
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
        user: true,
        answers: {
          include: {
            question: true,
            questionAssignment: true
          }
        }
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
    
    console.log('收到提交请求:', { assignmentId, answers, userId: req.user!.id });

    if (!assignmentId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Please provide assignment ID and answers' });
    }

    // 验证作业是否存在且已发布（修复大小写不一致的问题）
    const assignment = await prisma.assignment.findUnique({
      where: { 
        id: assignmentId
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
    
    console.log('作业查询结果:', assignment);

    // 统一使用小写状态检查，与前端保持一致
    if (!assignment || assignment.status?.toLowerCase() !== 'published') {
      console.log('作业未找到或未发布，ID:', assignmentId);
      return res.status(404).json({ error: 'Assignment not found or not published' });
    }

    // 获取该作业的所有题目关联
    const questionAssignments = await prisma.questionAssignment.findMany({
      where: { 
        assignmentId: assignmentId
      },
      include: {
        question: true
      }
    });
    
    console.log('题目关联查询结果:', questionAssignments);

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

    // 计算总分并准备答案详情
    let totalScore = 0;
    const answerDetails = [];

    // 检查所有题目是否存在
    for (const answer of answers) {
      console.log('处理答案:', answer);
      
      // 通过QuestionAssignment的ID查找Question
      const questionAssignment = questionAssignments.find((qa: any) => qa.id === answer.questionId);
      if (!questionAssignment) {
        console.log('未找到题目关联:', answer.questionId);
        throw new Error(`Question assignment ${answer.questionId} not found`);
      }

      // 检查题目是否存在
      const question = questionAssignment.question;
      if (!question) {
        console.log('未找到题目:', answer.questionId);
        throw new Error(`Question not found for assignment ${answer.questionId}`);
      }

      // 验证题目类型
      if (!['single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank'].includes(question.type)) {
        throw new Error(`Invalid question type: ${question.type}`);
      }

      // 验证答案格式
      if (question.type === 'multiple_choice') {
        if (!Array.isArray(answer.answer)) {
          throw new Error(`Invalid answer format for multiple choice question ${answer.questionId}`);
        }
      } else if (typeof answer.answer !== 'string') {
        throw new Error(`Invalid answer format for question ${answer.questionId}`);
      }

      // 计算得分
      let isCorrect = false;
      if (question.type === 'multiple_choice') {
        // 多选题答案比较
        let correctAnswers;
        try {
          correctAnswers = JSON.parse(question.correctAnswer || '[]');
        } catch {
          // 如果JSON解析失败，尝试将字符串转换为数组
          correctAnswers = question.correctAnswer ? [question.correctAnswer] : [];
        }
        isCorrect = JSON.stringify((answer.answer as string[]).sort()) === JSON.stringify(correctAnswers.sort());
      } else {
        // 其他题型答案比较
        isCorrect = answer.answer === question.correctAnswer;
      }

      const points = isCorrect ? question.points : 0;
      totalScore += points;

      // 保存答案详情，使用实际的Question ID
      answerDetails.push({
        questionId: question.id, // 使用Question表的ID
        questionAssignmentId: answer.questionId, // 保存QuestionAssignment的ID
        answer: Array.isArray(answer.answer) ? JSON.stringify(answer.answer) : answer.answer,
        isCorrect,
        points
      });
    }

    // 创建提交记录
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        userId: req.user!.id,
        score: totalScore,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        // 将答案数据序列化后存储到content字段，供前端加载使用
        content: JSON.stringify(answers.map((a: any) => ({
          questionId: a.questionId,
          answer: a.answer
        })))
      }
    });

    // 创建答案详情记录
    for (const detail of answerDetails) {
      await prisma.submissionAnswer.create({
        data: {
          submissionId: submission.id,
          questionId: detail.questionId,
          questionAssignmentId: detail.questionAssignmentId,
          answer: detail.answer,
          isCorrect: detail.isCorrect,
          points: detail.points
        }
      });
    }

    // 获取完整的提交记录，包括关联数据
    const completeSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
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
        user: true,
        answers: {
          include: {
            question: true,
            questionAssignment: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: completeSubmission
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
         user: true,
         answers: {
           include: {
             question: true,
             questionAssignment: true
           }
         }
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