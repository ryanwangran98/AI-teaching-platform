import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取视频播放片段列表
router.get('/chapter/:chapterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user!.id;

    // 检查章节进度是否存在
    const chapterProgress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      }
    });

    if (!chapterProgress) {
      return res.status(404).json({ error: 'Chapter progress not found' });
    }

    // 获取视频播放片段
    const videoSegments = await prisma.videoSegment.findMany({
      where: {
        chapterProgressId: chapterProgress.id
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({
      success: true,
      data: videoSegments
    });
  } catch (error) {
    console.error('获取视频播放片段失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 添加视频播放片段
router.post('/chapter/:chapterId', authenticateToken, authorizeRoles('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { chapterId } = req.params;
    const { startTime, endTime } = req.body;
    const userId = req.user!.id;

    if (startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be greater than start time' });
    }

    // 检查章节进度是否存在
    let chapterProgress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      }
    });

    // 如果不存在，创建新的章节进度
    if (!chapterProgress) {
      // 获取章节信息
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: { course: true }
      });

      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      chapterProgress = await prisma.chapterProgress.create({
        data: {
          userId,
          chapterId,
          courseId: chapter.courseId,
          watchedTime: 0,
          progress: 0,
          isCompleted: false,
          lastWatchedAt: new Date()
        }
      });
    }

    // 检查是否与现有片段重叠
    const existingSegments = await prisma.videoSegment.findMany({
      where: {
        chapterProgressId: chapterProgress.id,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lte: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    // 如果有重叠片段，合并它们
    if (existingSegments.length > 0) {
      // 计算合并后的时间范围
      const minStartTime = Math.min(startTime, ...existingSegments.map(s => s.startTime));
      const maxEndTime = Math.max(endTime, ...existingSegments.map(s => s.endTime));

      // 删除重叠的片段
      await prisma.videoSegment.deleteMany({
        where: {
          id: {
            in: existingSegments.map(s => s.id)
          }
        }
      });

      // 创建合并后的片段
      const mergedSegment = await prisma.videoSegment.create({
        data: {
          userId,
          chapterId,
          chapterProgressId: chapterProgress.id,
          startTime: minStartTime,
          endTime: maxEndTime,
          duration: maxEndTime - minStartTime
        }
      });

      // 重新计算进度
      await recalculateChapterProgress(chapterProgress.id);

      res.status(201).json({
        success: true,
        data: mergedSegment,
        message: 'Video segment merged successfully'
      });
    } else {
      // 创建新的视频片段
      const videoSegment = await prisma.videoSegment.create({
        data: {
          userId,
          chapterId,
          chapterProgressId: chapterProgress.id,
          startTime,
          endTime,
          duration: endTime - startTime
        }
      });

      // 重新计算进度
      await recalculateChapterProgress(chapterProgress.id);

      res.status(201).json({
        success: true,
        data: videoSegment,
        message: 'Video segment added successfully'
      });
    }
  } catch (error) {
    console.error('添加视频播放片段失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 重新计算章节进度
async function recalculateChapterProgress(chapterProgressId: string) {
  try {
    // 获取章节进度
    const chapterProgress = await prisma.chapterProgress.findUnique({
      where: { id: chapterProgressId },
      include: {
        chapter: true
      }
    });

    if (!chapterProgress) {
      throw new Error('Chapter progress not found');
    }

    // 获取所有视频片段
    const videoSegments = await prisma.videoSegment.findMany({
      where: {
        chapterProgressId: chapterProgress.id
      }
    });

    // 计算总观看时长（不重复计算重叠部分）
    let totalWatchedTime = 0;
    if (videoSegments.length > 0) {
      // 按开始时间排序
      const sortedSegments = [...videoSegments].sort((a, b) => a.startTime - b.startTime);
      
      // 合并重叠的片段
      const mergedSegments = [];
      let currentSegment = { ...sortedSegments[0] };
      
      for (let i = 1; i < sortedSegments.length; i++) {
        const nextSegment = sortedSegments[i];
        
        if (nextSegment.startTime <= currentSegment.endTime) {
          // 有重叠，合并片段
          currentSegment.endTime = Math.max(currentSegment.endTime, nextSegment.endTime);
        } else {
          // 无重叠，添加当前片段并开始新的片段
          mergedSegments.push(currentSegment);
          currentSegment = { ...nextSegment };
        }
      }
      
      // 添加最后一个片段
      mergedSegments.push(currentSegment);
      
      // 计算总观看时长
      totalWatchedTime = mergedSegments.reduce((total, segment) => {
        return total + (segment.endTime - segment.startTime);
      }, 0);
    }

    // 获取视频总时长（假设章节的duration字段是以分钟为单位的）
    const totalDuration = chapterProgress.chapter.duration ? chapterProgress.chapter.duration * 60 : 0; // 转换为秒
    
    // 计算进度百分比
    const progress = totalDuration > 0 ? Math.min(100, (totalWatchedTime / totalDuration) * 100) : 0;
    
    // 更新章节进度
    await prisma.chapterProgress.update({
      where: { id: chapterProgressId },
      data: {
        watchedTime: totalWatchedTime,
        progress,
        isCompleted: progress >= 100,
        lastWatchedAt: new Date()
      }
    });

    // 更新课程总体进度
    await updateCourseOverallProgress(chapterProgress.courseId, chapterProgress.userId);

    return { totalWatchedTime, progress };
  } catch (error) {
    console.error('重新计算章节进度失败:', error);
    throw error;
  }
}

// 更新课程总体进度
async function updateCourseOverallProgress(courseId: string, userId: string) {
  try {
    // 获取课程所有章节
    const chapters = await prisma.chapter.findMany({
      where: { courseId }
    });

    // 获取用户所有章节进度
    const chapterProgressList = await prisma.chapterProgress.findMany({
      where: {
        courseId,
        userId
      }
    });

    // 计算总体进度
    let totalProgress = 0;
    let completedChapters = 0;

    if (chapters.length > 0) {
      for (const chapter of chapters) {
        const progress = chapterProgressList.find(p => p.chapterId === chapter.id);
        if (progress) {
          totalProgress += progress.progress;
          if (progress.isCompleted) {
            completedChapters++;
          }
        }
      }

      const overallProgress = totalProgress / chapters.length;

      // 更新选课记录
      await prisma.enrollment.updateMany({
        where: {
          userId,
          courseId
        },
        data: {
          progress: overallProgress,
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('更新课程总体进度失败:', error);
    throw error;
  }
}

// 获取课程进度（基于视频播放片段计算）
router.get('/course/:courseId/progress', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    if (!courseId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID和用户ID不能为空' 
      });
    }

    // 获取课程所有章节
    const chapters = await prisma.chapter.findMany({
      where: { courseId }
    });

    if (chapters.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          courseId,
          progress: 0,
          chapters: []
        },
        message: '课程没有章节'
      });
    }

    // 计算每个章节的进度
    const chapterProgressList = [];
    let totalProgress = 0;
    let totalDuration = 0;

    for (const chapter of chapters) {
      const chapterDuration = chapter.duration ? chapter.duration * 60 : 0; // 转换为秒
      
      // 获取章节的视频播放片段
      const segments = await prisma.videoSegment.findMany({
        where: { 
          chapterProgress: {
            chapterId: chapter.id,
            userId: userId
          }
        }
      });

      // 合并重叠的片段并计算总观看时长
      let chapterWatchedTime = 0;
      if (segments.length > 0) {
        // 按开始时间排序
        const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime);
        
        // 合并重叠的片段
        const mergedSegments = [];
        let currentSegment = { ...sortedSegments[0] };
        
        for (let i = 1; i < sortedSegments.length; i++) {
          const nextSegment = sortedSegments[i];
          
          if (nextSegment.startTime <= currentSegment.endTime) {
            // 有重叠，合并片段
            currentSegment.endTime = Math.max(currentSegment.endTime, nextSegment.endTime);
          } else {
            // 无重叠，添加当前片段并开始新的片段
            mergedSegments.push(currentSegment);
            currentSegment = { ...nextSegment };
          }
        }
        
        // 添加最后一个片段
        mergedSegments.push(currentSegment);
        
        // 计算总观看时长
        chapterWatchedTime = mergedSegments.reduce((sum, segment) => {
          return sum + (segment.endTime - segment.startTime);
        }, 0);
      }

      // 计算章节进度
      const chapterProgress = chapterDuration > 0 ? Math.min(100, Math.round((chapterWatchedTime / chapterDuration) * 100)) : 0;

      chapterProgressList.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        watchedTime: chapterWatchedTime,
        duration: chapterDuration,
        progress: chapterProgress
      });

      totalDuration += chapterDuration;
      totalProgress += chapterDuration * chapterProgress / 100;
    }

    // 计算课程总进度
    const courseProgress = totalDuration > 0 ? Math.round((totalProgress / totalDuration) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        courseId,
        progress: courseProgress,
        chapters: chapterProgressList
      },
      message: '获取课程进度成功'
    });
  } catch (error) {
    console.error('获取课程进度失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取课程进度失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;