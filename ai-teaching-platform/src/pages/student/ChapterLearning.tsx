import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { NavigateBefore } from '@mui/icons-material';
import { chapterAPI, chapterProgressAPI, videoSegmentAPI } from '../../services/api';

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: number;
  progress: number;
  completed: boolean;
  content: {
    type: 'video' | 'text' | 'quiz' | 'assignment';
    title: string;
    duration?: number;
    content?: string;
    questions?: QuizQuestion[];
    assignment?: Assignment;
  }[];
  resources: {
    type: 'video' | 'document' | 'link';
    title: string;
    url: string;
  }[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submitted: boolean;
  score?: number;
}

const ChapterLearning: React.FC = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterData, setChapterData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<Chapter>({
    id: '',
    title: '加载中...',
    description: '',
    duration: 60,
    progress: 0,
    completed: false,
    content: [],
    resources: []
  });
  const [watchedTime, setWatchedTime] = useState(0); // 已观看时间（秒）
  const [lastSavedTime, setLastSavedTime] = useState(0); // 上次保存的时间点
  const [isSaving, setIsSaving] = useState(false); // 是否正在保存进度
  const [videoSegments, setVideoSegments] = useState<any[]>([]); // 视频播放片段
  const [lastRecordedTime, setLastRecordedTime] = useState(0); // 上次记录的时间点

  // 获取章节数据
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!courseId || !chapterId) {
        setError('缺少课程ID或章节ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 获取章节详细信息
        const response = await chapterAPI.getChapter(chapterId);
        const data = response.data || response;
        setChapterData(data);
        
        // 如果有视频URL，设置视频播放地址
        if (data.videoUrl) {
          // 直接使用videoUrl，数据库中已经包含了完整的路径
          setVideoUrl(data.videoUrl);
        }

        // 根据实际数据更新currentChapter状态
        if (data) {
          setCurrentChapter({
            id: data.id,
            title: data.title,
            description: data.description || '',
            duration: data.duration || 60,
            progress: data.progress || 0,
            completed: data.completed || false,
            content: [],
            resources: []
          });
          
          // 获取章节学习进度
        try {
          const progressResponse = await chapterProgressAPI.getChapterProgressById(chapterId);
          if (progressResponse.data && progressResponse.data.watchedTime) {
            setWatchedTime(progressResponse.data.watchedTime);
            setLastSavedTime(progressResponse.data.watchedTime);
            setLastRecordedTime(progressResponse.data.watchedTime);
          }
        } catch (progressError) {
          console.error('获取学习进度失败:', progressError);
        }
        
        // 获取视频播放片段
        try {
          const segmentsResponse = await videoSegmentAPI.getVideoSegments(chapterId);
          if (segmentsResponse.data && segmentsResponse.data.success) {
            setVideoSegments(segmentsResponse.data.data);
          }
        } catch (segmentsError) {
          console.error('获取视频播放片段失败:', segmentsError);
        }
        }
      } catch (error) {
        console.error('获取章节数据失败:', error);
        setError('获取章节数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [courseId, chapterId]);

  // 保存学习进度
const saveProgress = async (currentTime: number) => {
  if (!courseId || !chapterId || isSaving) return;
  
  try {
    setIsSaving(true);
    
    // 计算学习进度百分比
    const duration = currentChapter.duration * 60; // 转换为秒
    const progress = duration > 0 ? Math.min(100, Math.floor((currentTime / duration) * 100)) : 0;
    
    // 保存进度到后端
    await chapterProgressAPI.updateChapterProgress(chapterId, {
      watchedTime: currentTime,
      progress,
      courseId
    });
    
    // 记录视频播放片段（如果当前观看时间与上次记录时间相差超过10秒）
    if (Math.abs(currentTime - lastRecordedTime) >= 10) {
      const startTime = Math.min(lastRecordedTime, currentTime);
      const endTime = Math.max(lastRecordedTime, currentTime);
      
      try {
        await videoSegmentAPI.addVideoSegment(chapterId, {
          startTime,
          endTime
        });
        setLastRecordedTime(currentTime);
      } catch (segmentError) {
        console.error('记录视频播放片段失败:', segmentError);
      }
    }
    
    setLastSavedTime(currentTime);
    console.log('学习进度已保存:', { currentTime, progress });
  } catch (error) {
    console.error('保存学习进度失败:', error);
  } finally {
    setIsSaving(false);
  }
};

  // 定时保存学习进度
  useEffect(() => {
    const interval = setInterval(() => {
      if (watchedTime > lastSavedTime + 10) { // 每10秒保存一次
        saveProgress(watchedTime);
      }
    }, 5000); // 每5秒检查一次

    return () => clearInterval(interval);
  }, [watchedTime, lastSavedTime]);

  // 视频播放时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = Math.floor(videoRef.current.currentTime);
      setWatchedTime(currentTime);
      
      // 每5秒检查一次是否需要保存进度
      if (currentTime - lastSavedTime >= 5) {
        saveProgress(currentTime);
      }
    }
  };

  // 格式化视频时长（小时、分钟和秒）
  const formatVideoDuration = (minutes: number): string => {
    // 使用更精确的计算，避免浮点数精度问题
    const totalSeconds = Math.round(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${mins}分${secs}秒`;
    } else if (mins > 0) {
      return `${mins}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 页面卸载时保存学习进度
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (watchedTime > lastSavedTime) {
        saveProgress(watchedTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (watchedTime > lastSavedTime) {
        saveProgress(watchedTime);
      }
    };
  }, [watchedTime, lastSavedTime]);

  // 加载状态
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6" color="textSecondary">
          加载中...
        </Typography>
      </Box>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          错误
        </Typography>
        <Typography variant="body1" paragraph>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          返回
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 返回按钮 */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<NavigateBefore />}
          onClick={() => navigate(`/student/course/${courseId}`)}
          sx={{ textTransform: 'none' }}
          color="inherit"
        >
          返回课程
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4">{currentChapter.title}</Typography>
      </Box>

      {/* 视频播放区域 */}
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto',
        mb: 3
      }}>
        {videoUrl ? (
          <Box sx={{ 
            height: 600, 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 3
          }}>
            <video
              ref={videoRef}
              controls
              width="100%"
              height="100%"
              style={{ borderRadius: '8px' }}
              src={videoUrl}
              onError={(e) => {
                console.error('视频加载失败:', e);
                const target = e.target as HTMLVideoElement;
                console.error('视频错误代码:', target.error?.code);
                console.error('视频错误信息:', target.error?.message);
              }}
              onLoadStart={() => console.log('视频开始加载:', videoUrl)}
              onLoadedData={() => {
                console.log('视频数据加载完成');
                // 如果有之前的学习进度，设置视频播放位置
                if (watchedTime > 0 && videoRef.current) {
                  videoRef.current.currentTime = watchedTime;
                }
              }}
              onCanPlay={() => console.log('视频可以播放')}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                console.log('视频播放完成');
                // 视频播放完成后，标记章节为已完成
                saveProgress(watchedTime);
              }}
            >
              您的浏览器不支持视频播放。
            </video>
            
            {/* 视频时长显示 */}
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                视频总时长: {formatVideoDuration(currentChapter.duration)}
              </Typography>
            </Box>
            
            {/* 学习进度条 */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  学习进度
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.floor((watchedTime / (currentChapter.duration * 60)) * 100)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, (watchedTime / (currentChapter.duration * 60)) * 100)} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            height: 600, 
            bgcolor: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 2,
            boxShadow: 3
          }}>
            <Typography variant="h6" color="textSecondary">
              暂无学习视频
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChapterLearning;