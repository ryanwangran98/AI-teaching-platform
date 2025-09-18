import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取学生的学习统计信息
router.get('/student-stats/:courseId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    // 1. 获取学习时长
    // 从VideoSegment表中获取所有视频片段的时长总和（包括重复观看）
    // 首先获取课程的所有章节
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId
      },
      select: {
        id: true
      }
    });

    // 获取这些章节的所有视频片段
    const chapterIds = chapters.map(chapter => chapter.id);
    const videoSegments = await prisma.videoSegment.findMany({
      where: {
        userId,
        chapterId: {
          in: chapterIds
        }
      }
    });

    // 计算实际观看时长（包括重复观看）
    let studyTime = 0; // 学习时长（秒）
    if (videoSegments.length > 0) {
      // 计算所有视频片段的时长总和（包括重复观看）
      studyTime = videoSegments.reduce((sum, segment) => {
        return sum + (segment.endTime - segment.startTime);
      }, 0);
    }

    // 2. 获取作业平均得分
    // 获取该课程所有已批改的作业提交
    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        assignment: {
          knowledgePoint: {
            chapter: {
              courseId
            }
          },
          status: 'PUBLISHED' // 只计算已发布的作业
        },
        status: 'GRADED' // 只计算已批改的作业
      },
      include: {
        assignment: {
          select: {
            totalPoints: true
          }
        }
      }
    });

    let averageScore = 0;
    if (submissions.length > 0) {
      // 计算平均得分（百分比）
      const totalScore = submissions.reduce((sum, submission) => {
        const scorePercentage = submission.score && submission.assignment.totalPoints 
          ? (submission.score / submission.assignment.totalPoints) * 100 
          : 0;
        return sum + scorePercentage;
      }, 0);
      averageScore = totalScore / submissions.length;
    }

    res.json({
      success: true,
      data: {
        studyTime, // 学习时长（分钟）
        averageScore, // 平均得分（百分比）
        gradedAssignmentsCount: submissions.length // 已批改作业数量
      }
    });
  } catch (error) {
    console.error('获取学习统计信息失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取本周活跃学生数统计
router.get('/weekly-active-students', authenticateToken, authorizeRoles('TEACHER'), async (req: AuthRequest, res) => {
  try {
    const teacherId = req.user!.id;
    
    // 获取本周的开始时间（周一）
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0是周日，1是周一，以此类推
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 如果是周日，减去6天；否则减去(dayOfWeek-1)天
    startOfWeek.setHours(0, 0, 0, 0);
    
    // 获取教师的所有课程
    const courses = await prisma.course.findMany({
      where: {
        teacherId
      },
      select: {
        id: true
      }
    });
    
    const courseIds = courses.map(course => course.id);
    
    // 1. 获取本周进行视频学习的学生ID
    const videoLearningStudents = await prisma.videoSegment.findMany({
      where: {
        chapterId: {
          in: courseIds
        },
        createdAt: {
          gte: startOfWeek
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });
    
    // 2. 获取本周下载课程资料的学生ID
    // 注意：由于数据库模型中没有直接记录下载行为，我们使用课程资料和课件的查看记录作为替代
    // 这里我们假设学生在本周查看了课程资料或课件，视为进行了资料下载
    
    // 首先获取教师所有课程的章节ID
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId: {
          in: courseIds
        }
      },
      select: {
        id: true
      }
    });
    
    const chapterIds = chapters.map(chapter => chapter.id);
    
    const materialViewStudents = await prisma.chapterProgress.findMany({
      where: {
        chapterId: {
          in: chapterIds
        },
        updatedAt: {
          gte: startOfWeek
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });
    
    // 3. 获取本周完成作业的学生ID
    // 首先获取教师所有课程的作业ID
    const assignments = await prisma.assignment.findMany({
      where: {
        knowledgePoint: {
          chapter: {
            courseId: {
              in: courseIds
            }
          }
        }
      },
      select: {
        id: true
      }
    });
    
    const assignmentIds = assignments.map(assignment => assignment.id);
    
    const assignmentSubmissionStudents = await prisma.submission.findMany({
      where: {
        assignmentId: {
          in: assignmentIds
        },
        submittedAt: {
          gte: startOfWeek
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });
    
    // 合并所有学生ID并去重
    const allActiveStudentIds = new Set([
      ...videoLearningStudents.map(s => s.userId),
      ...materialViewStudents.map(s => s.userId),
      ...assignmentSubmissionStudents.map(s => s.userId)
    ]);
    
    // 统计各类活动的学生数
    const videoLearningCount = new Set(videoLearningStudents.map(s => s.userId)).size;
    const materialViewCount = new Set(materialViewStudents.map(s => s.userId)).size;
    const assignmentSubmissionCount = new Set(assignmentSubmissionStudents.map(s => s.userId)).size;
    
    res.json({
      success: true,
      data: {
        totalActiveStudents: allActiveStudentIds.size,
        videoLearningCount,
        materialViewCount,
        assignmentSubmissionCount,
        weekStartDate: startOfWeek.toISOString()
      }
    });
  } catch (error) {
    console.error('获取本周活跃学生数统计失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;