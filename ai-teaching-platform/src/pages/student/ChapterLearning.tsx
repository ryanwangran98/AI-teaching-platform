import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { NavigateBefore } from '@mui/icons-material';
import { chapterAPI } from '../../services/api';

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
              onLoadedData={() => console.log('视频数据加载完成')}
              onCanPlay={() => console.log('视频可以播放')}
            >
              您的浏览器不支持视频播放。
            </video>
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