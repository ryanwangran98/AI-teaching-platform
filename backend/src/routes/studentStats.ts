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
    // 从Enrollment表中获取学习进度，结合课程章节总时长计算学习时长
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    // 获取课程所有章节的总时长
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId
      },
      select: {
        duration: true
      }
    });

    // 计算课程总时长（使用章节的实际duration字段）
    const totalCourseDuration = chapters.reduce((sum, chapter) => sum + (chapter.duration || 0), 0);

    let studyTime = 0; // 学习时长（分钟）
    if (enrollment && totalCourseDuration > 0) {
      // 根据学习进度计算学习时长
      studyTime = Math.floor((totalCourseDuration * enrollment.progress) / 100);
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

export default router;