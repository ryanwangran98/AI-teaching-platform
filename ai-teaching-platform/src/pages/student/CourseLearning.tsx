import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayCircle,
  CheckCircle,
  AccessTime,
  Description,
  VideoLibrary,
  Assignment,
  ArrowForward,
  Star,
  School,
  AccountTree,
  Replay,
  SmartToy,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
// 引入学习资料和课程图谱组�?
import Materials from './Materials';
import CourseGraph from './CourseGraph';
import { courseAPI, chapterAPI, assignmentAPI, studentStatsAPI, chapterProgressAPI, videoSegmentAPI } from '../../services/api';

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: number; // 分钟
  order: number;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  contentUrl: string;
  completed: boolean;
  progress: number; // 0-100
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'ppt' | 'zip' | 'link';
  url: string;
  size?: string;
  duration?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  totalDuration: number;
  totalChapters: number;
  completedChapters: number;
  overallProgress: number;
  chapters: Chapter[];
  assignments: Assignment[];
  agentAppId?: string;
  agentAccessToken?: string;
}

interface Assignment {
  id: string;
  title: string;
  type: 'homework' | 'quiz' | 'exam';
  dueDate: string;
  totalPoints: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  // 添加提交相关字段
  userSubmissionStatus?: 'pending' | 'submitted' | 'graded';
  userScore?: number;
}

const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<{
    studyTime: number;
    averageScore: number;
    gradedAssignmentsCount: number;
  } | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // 添加页面获得焦点时重新获取学生统计数据的逻辑
  useEffect(() => {
    const handleFocus = () => {
      if (courseId) {
        console.log('页面获得焦点，重新获取学生统计数据');
        fetchStudentStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [courseId]);

  // 添加获取学生统计数据的函数
  const fetchStudentStats = async () => {
    try {
      console.log('开始获取学生统计数据 courseId:', courseId);
      const statsResponse = await studentStatsAPI.getStudentStats(courseId!);
      console.log('获取到的学生统计数据:', statsResponse);
      console.log('学生统计数据详情:', JSON.stringify(statsResponse, null, 2));
      setStudentStats(statsResponse.data);
    } catch (err: any) {
      console.error('获取学生统计数据失败:', err);
      console.error('错误详情:', err.response?.data || err.message);
    }
  };

  // 在fetchCourseData函数中增加更详细的作业数据处理和日志
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      // 获取课程详情
      const courseResponse = await courseAPI.getCourse(courseId!);
      console.log('获取到的课程数据:', courseResponse);
      
      // 获取课程AI助手信息
      let agentAppInfo = null;
      try {
        agentAppInfo = await courseAPI.getAgentAppInfo(courseId!);
        console.log('获取到的AI助手信息:', agentAppInfo);
      } catch (err) {
        console.error('获取AI助手信息失败:', err);
      }
      
      // 获取课程章节（所有状态的章节）
      const chaptersResponse = await chapterAPI.getChapters(courseId!, 'published');
      console.log('获取到的章节数据:', chaptersResponse);
      
      // 获取课程作业
      const assignmentsResponse = await assignmentAPI.getAssignments({ courseId: courseId! });
      console.log('获取到的作业数据原始响应:', assignmentsResponse);
      console.log('获取到的作业数据类型:', typeof assignmentsResponse);
      console.log('获取到的作业数据是否为数组?', Array.isArray(assignmentsResponse));
      
      // 获取学生统计数据
      await fetchStudentStats();
      
      // 获取基于视频片段计算的课程进度
      let videoProgress = 0;
      const chapterVideoProgressMap = new Map(); // 存储章节视频进度
      try {
        const videoProgressResponse = await videoSegmentAPI.getCourseProgressByVideoSegments(courseId!);
        console.log('获取到的视频进度数据:', videoProgressResponse);
        if (videoProgressResponse && videoProgressResponse.data) {
          videoProgress = videoProgressResponse.data.overallProgress || 0;
          
          // 提取章节进度信息
          if (videoProgressResponse.data.chapterProgresses && Array.isArray(videoProgressResponse.data.chapterProgresses)) {
            videoProgressResponse.data.chapterProgresses.forEach((chapterProgress: any) => {
              chapterVideoProgressMap.set(chapterProgress.chapterId, chapterProgress.progress || 0);
            });
          }
        }
      } catch (err) {
        console.error('获取视频进度失败:', err);
      }
      
      // 处理课程数据
      const courseData = courseResponse.data || courseResponse;
      
      // 处理章节数据
      let chaptersData = [];
      if (chaptersResponse && typeof chaptersResponse === 'object') {
        if (Array.isArray(chaptersResponse)) {
          chaptersData = chaptersResponse;
        } else if (Array.isArray(chaptersResponse.data)) {
          chaptersData = chaptersResponse.data;
        }
      }
      
      // 获取章节学习进度
      const chapterProgressMap = new Map();
      try {
        for (const chapter of chaptersData) {
          try {
            const progressResponse = await chapterProgressAPI.getChapterProgressById(chapter.id);
            console.log(`获取章节 ${chapter.id} 的学习进度`, progressResponse);
            if (progressResponse && progressResponse.data) {
              chapterProgressMap.set(chapter.id, progressResponse.data);
            }
          } catch (err) {
            console.error(`获取章节 ${chapter.id} 的学习进度失败`, err);
            // 如果获取失败，使用默认进度
            chapterProgressMap.set(chapter.id, { progress: 0, currentTime: 0 });
          }
        }
      } catch (err) {
        console.error('获取章节学习进度失败:', err);
      }
      
      // 处理作业数据 - 优化数据提取逻辑
      let assignmentsData = [];
      if (assignmentsResponse && typeof assignmentsResponse === 'object') {
        console.log('作业响应结构:', JSON.stringify(assignmentsResponse).substring(0, 200) + '...');
        
        // 首先检查标准API响应格式
        if (assignmentsResponse.success && assignmentsResponse.data) {
          // 检查是否是分页数据结构
          if (assignmentsResponse.data.assignments && Array.isArray(assignmentsResponse.data.assignments)) {
            assignmentsData = assignmentsResponse.data.assignments;
            console.log('从标准API分页响应中提取的作业数据:', assignmentsData.length);
          } else if (Array.isArray(assignmentsResponse.data)) {
            assignmentsData = assignmentsResponse.data;
            console.log('从data数组中提取的作业数据:', assignmentsData.length);
          }
        } 
        // 直接从data.assignments获取（主要修复点）
        else if (assignmentsResponse.data && assignmentsResponse.data.assignments && Array.isArray(assignmentsResponse.data.assignments)) {
          assignmentsData = assignmentsResponse.data.assignments;
          console.log('从嵌套结构中提取的作业数据', assignmentsData.length);
        } 
        // 兼容其他可能的数据结构
        else if (Array.isArray(assignmentsResponse)) {
          assignmentsData = assignmentsResponse;
          console.log('直接使用数组响应:', assignmentsData.length);
        } else if (Array.isArray(assignmentsResponse.data)) {
          assignmentsData = assignmentsResponse.data;
          console.log('从data属性提取的数组:', assignmentsData.length);
        } else {
          console.log('无法识别的作业数据结构', assignmentsResponse);
        }
      }
      
      // 确保只显示已发布的作业（学生端）
      // 修复：使用更宽松的条件检查作业状态
      assignmentsData = assignmentsData.filter((assignment: any) => {
        // 允许PUBLISHED/published状态的作业，或者没有明确状态的作业（默认视为已发布）
        const status = assignment.status?.toString().toLowerCase();
        console.log('作业状态检查', { id: assignment.id, title: assignment.title, status });
        return status === 'published' || status === 'PUBLISHED' || status === undefined || status === null || status === '';
      });
      console.log('筛选后已发布的作业数量:', assignmentsData.length);
      
      // 记录处理后的作业数据
      console.log('处理后的作业数据:', assignmentsData);
      console.log('作业数量:', assignmentsData.length);
      
      // 获取当前用户信息
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = userInfo.id;

      // 构建课程对象
      const courseObj: Course = {
        id: courseData.id,
        title: courseData.title || courseData.name || '未命名课程',
        description: courseData.description || '暂无描述',
        instructor: courseData.teacher 
          ? `${courseData.teacher.firstName || ''}${courseData.teacher.lastName || ''}` 
          : (courseData.instructor || '未知教师'),
        thumbnail: courseData.coverImage || '/api/placeholder/400/200',
        totalDuration: courseData.duration || 0,
        totalChapters: chaptersData.length,
        completedChapters: 0, // 需要从学习记录中获取
        overallProgress: videoProgress, // 使用基于视频片段计算的进度
        agentAppId: agentAppInfo?.data?.agentAppId || courseData.agentAppId,
        agentAccessToken: agentAppInfo?.data?.agentAccessToken || courseData.agentAccessToken,
        agentAccessCode: agentAppInfo?.data?.agentAccessCode || courseData.agentAccessCode,
        chapters: chaptersData.map((chapter: any, index: number) => {
          // 获取章节学习进度，优先使用基于视频片段计算的进度
          const chapterProgress = chapterProgressMap.get(chapter.id);
          const videoChapterProgress = chapterVideoProgressMap.get(chapter.id) || 0;
          
          // 修复：确保进度值在0-100范围内
          let progress = 0;
          if (videoChapterProgress > 0) {
            progress = Math.min(100, Math.max(0, videoChapterProgress));
          } else if (chapterProgress && chapterProgress.progress !== undefined) {
            progress = Math.min(100, Math.max(0, chapterProgress.progress));
          }
          
          // 处理章节标题，如果标题是数字则添加前缀
          let title = chapter.title || `�?{chapter.order || index + 1}章`;
          if (/^\d+$/.test(title)) {
            title = `�?{title}章`;
          }
          
          // 处理章节描述
          let description = chapter.description || chapter.content || '暂无描述';
          if (/^\d+$/.test(description) && description === chapter.title) {
            description = `这是�?{description}章的内容`;
          }
          
          return {
            id: chapter.id,
            title: title,
            description: description,
            duration: chapter.duration || 0,
            order: chapter.order || index + 1,
            type: 'video', // 默认类型
            contentUrl: '', // 需要根据实际内容设置
            completed: progress >= 100, // 根据进度判断是否已完成
            progress: progress, // 使用修正后的进度
            resources: [], // 需要从资料/课件中获取
          };
        }),
        assignments: assignmentsData.map((assignment: any) => {
          // 找到当前用户的提交记�?
          const userSubmission = assignment.submissions && assignment.submissions.length > 0 
            ? assignment.submissions.find((sub: any) => sub.userId === currentUserId)
            : null;

          return {
            id: assignment.id,
            title: assignment.title || '未命名作业',
            type: assignment.type.toLowerCase() === 'homework' ? 'homework' : 
                  assignment.type.toLowerCase() === 'quiz' ? 'quiz' : 
                  assignment.type.toLowerCase() === 'exam' ? 'exam' :
                  assignment.type.toLowerCase() === 'project' ? 'project' : assignment.type,
            dueDate: assignment.dueDate || assignment.endTime || '',
            totalPoints: assignment.totalPoints || assignment.totalScore || 0,
            totalScore: assignment.totalScore || assignment.totalPoints || 0, // 与教师端字段名保持一致
            // 简化状态判断逻辑，确保状态显示准确
            status: userSubmission 
              ? (userSubmission.status?.toUpperCase() === 'GRADED')
                ? 'graded' 
                : 'submitted'
              : 'pending',
            score: userSubmission ? userSubmission.score : undefined,
            userSubmissionStatus: userSubmission 
              ? (userSubmission.status === 'GRADED' && (userSubmission.gradedAt !== null || userSubmission.feedback !== null || userSubmission.score !== 0))
                ? 'graded' 
                : 'submitted'
              : 'pending',
            userScore: userSubmission ? userSubmission.score : undefined,
          };
        }),
      };
      
      setCourse(courseObj);
      setError(null);
    } catch (err: any) {
      console.error('获取课程数据失败:', err);
      setError(err.response?.data?.message || err.message || '获取课程数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'document': return <Description />;
      case 'quiz': return <Assignment />;
      case 'homework': return <Assignment />;
      case 'exam': return <Assignment />;
      case 'project': return <Assignment />;
      case 'assignment': return <Assignment />; // 保持向后兼容
      default: return <Description />;
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return '视频';
      case 'document': return '文档';
      case 'quiz': return '测验';
      case 'homework': return '作业';
      case 'exam': return '考试';
      case 'project': return '项目';
      case 'assignment': return '作业'; // 保持向后兼容
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'graded': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待完成';
      case 'submitted': return '已提交';
      case 'graded': return '已批改';
      default: return status;
    }
  };

  const handleChapterClick = (chapterId: string) => {
    // 直接导航到章节学习页面
    navigate(`/student/course/${courseId}/chapter/${chapterId}`);
  };

  const handleStartLearning = (chapterId: string) => {
    // 开始学习逻辑
    console.log('开始学习章节', chapterId);
  };

  // 添加开始作业的处理函数
  const handleStartAssignment = (assignmentId: string) => {
    // 导航到作业详情页面
    navigate(`/student/course/${courseId}/assignment/${assignmentId}`);
  };

  // 添加重新学习章节的处理函数
  const handleRestartChapter = async (chapterId: string) => {
    try {
      // 重置章节学习进度
      await chapterProgressAPI.resetChapterProgress(chapterId);
      console.log('重置章节学习进度成功:', chapterId);
      
      // 刷新课程数据
      fetchCourseData();
    } catch (err: any) {
      console.error('重置章节学习进度失败:', err);
      alert('重置学习进度失败，请重试');
    }
  };



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchCourseData}>
          重新加载
        </Button>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          未找到课程数据
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, maxWidth: '1600px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* 课程头部 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: '#1a237e',
                mb: 1
              }}
            >
              {course.title}
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}
            >
              <School sx={{ mr: 1, fontSize: 20 }} />
              讲师：{course.instructor}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              paragraph
              sx={{ 
                lineHeight: 1.6,
                mb: 3
              }}
            >
              {course.description}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 2, md: 4 }, 
              alignItems: 'center', 
              flexWrap: 'wrap',
              mb: 2 
            }}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  textAlign: 'center',
                  minWidth: '120px',
                  bgcolor: 'background.paper'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'primary.main'
                  }}
                >
                  {course.completedChapters}/{course.totalChapters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已完成章节
                </Typography>
              </Paper>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  textAlign: 'center',
                  minWidth: '120px',
                  bgcolor: 'background.paper'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'primary.main'
                  }}
                >
                  {studentStats ? (studentStats.studyTime >= 3600 ? `${Math.floor(studentStats.studyTime / 3600)}小时${Math.floor((studentStats.studyTime % 3600) / 60)}分钟${studentStats.studyTime % 60}秒` : 
                                  studentStats.studyTime >= 60 ? `${Math.floor(studentStats.studyTime / 60)}分钟${studentStats.studyTime % 60}秒` : 
                                  `${studentStats.studyTime}秒`) : '0秒'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  学习时长
                </Typography>
              </Paper>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  width: '100%',
                  height: '200px',
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={course.overallProgress || 0}
                  size={200}
                  thickness={4}
                  sx={{
                    color: 'primary.main',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {`${Math.round(course.overallProgress || 0)}%`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    总体进度
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 标签页 */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab 
            label="课程章节" 
            icon={<VideoLibrary />} 
            iconPosition="start"
          />
          <Tab 
            label="作业任务" 
            icon={<Assignment />} 
            iconPosition="start"
          />
          <Tab 
            label="学习资料" 
            icon={<Description />} 
            iconPosition="start"
          />
          <Tab 
            label="课程图谱" 
            icon={<AccountTree />} 
            iconPosition="start"
          />
          <Tab 
            label="课程答疑助手" 
            icon={<SmartToy />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 课程章节 */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {course.chapters.map((chapter) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={chapter.id}>
              <Card 
                elevation={2} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    height: '8px', 
                    bgcolor: chapter.completed ? 'success.main' : 'primary.main',
                    position: 'relative'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      height: '100%', 
                      width: `${chapter.progress}%`,
                      bgcolor: chapter.completed ? 'success.dark' : 'primary.dark',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: chapter.completed ? 'success.main' : 'primary.main',
                        width: 48,
                        height: 48
                      }}
                    >
                      {getTypeIcon(chapter.type)}
                    </Avatar>
                    <Chip 
                      label={chapter.completed ? '已完成' : '进行中'} 
                      color={chapter.completed ? 'success' : 'primary'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 1.5
                    }}
                  >
                    {chapter.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    paragraph
                    sx={{ 
                      lineHeight: 1.5,
                      mb: 2,
                      minHeight: '3em'
                    }}
                  >
                    {chapter.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        时长: {formatVideoDuration(chapter.duration)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTypeIcon(chapter.type)}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        类型: {getTypeLabel(chapter.type)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        学习进度
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {isNaN(Number(chapter.progress)) ? 0 : Math.max(0, Math.min(100, chapter.progress || 0)).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={isNaN(Number(chapter.progress)) ? 0 : Math.max(0, Math.min(100, chapter.progress || 0))} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        mb: 1,
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {chapter.completed ? (
                      <>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<Replay />}
                          onClick={() => handleRestartChapter(chapter.id)}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 600,
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              borderColor: 'primary.dark',
                              bgcolor: 'primary.light',
                            }
                          }}
                        >
                          重新学习
                        </Button>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<PlayCircle />}
                          onClick={() => handleChapterClick(chapter.id)}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            '&:hover': {
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            }
                          }}
                        >
                          复习
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlayCircle />}
                        onClick={() => handleChapterClick(chapter.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1.2,
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          '&:hover': {
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                          }
                        }}
                      >
                        开始学习
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 作业任务 */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {course.assignments.length > 0 ? (
            course.assignments.map((assignment) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={assignment.id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 3,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    },
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      height: '8px', 
                      bgcolor: assignment.status === 'graded' ? 'success.main' : 
                              assignment.status === 'submitted' ? 'info.main' : 'warning.main',
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 0,
                          pr: 1
                        }}
                      >
                        {assignment.title}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(assignment.status)} 
                        color={getStatusColor(assignment.status) as any}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        {getTypeIcon(assignment.type)}
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          类型: {getTypeLabel(assignment.type)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          截止日期: {assignment.dueDate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          总分: {assignment.totalScore || assignment.totalPoints}分
                        </Typography>
                      </Box>
                    </Box>

                    {assignment.status === 'graded' && assignment.score !== undefined && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          bgcolor: 'success.light',
                          mb: 3,
                          border: '1px solid',
                          borderColor: 'success.main'
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          color="success.dark"
                          sx={{ 
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        >
                          得分: {assignment.score}/{assignment.totalScore || assignment.totalPoints}
                        </Typography>
                      </Paper>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={assignment.status === 'graded'}
                      onClick={() => handleStartAssignment(assignment.id)}
                      sx={{
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'action.disabledBackground',
                          color: 'text.disabled'
                        }
                      }}
                    >
                      {assignment.status === 'pending' ? '开始作业' :
                       assignment.status === 'submitted' ? '查看提交' :
                       assignment.status === 'graded' ? '查看结果' : '开始'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 6, 
                  textAlign: 'center',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '2px dashed',
                  borderColor: 'divider'
                }}
              >
                <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  暂无教师发布的作业
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  教师还未在本课程中发布任何作业，请耐心等待
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* 学习资料 */}
      {tabValue === 2 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Description sx={{ fontSize: 28, mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              学习资料
            </Typography>
          </Box>
          <Materials courseId={courseId} />
        </Paper>
      )}

      {/* 课程图谱 */}
      {tabValue === 3 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AccountTree sx={{ fontSize: 28, mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              课程图谱
            </Typography>
          </Box>
          <CourseGraph courseId={courseId} hideTitle={true} hideLegend={false} />
        </Paper>
      )}

      {/* 课程答疑助手 */}
      {tabValue === 4 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SmartToy sx={{ fontSize: 28, mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              课程答疑助手
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            智能AI助手为您提供24小时在线答疑服务，随时解答您的学习问题
          </Alert>
          
          {course?.agentAccessCode ? (
            <Box sx={{ 
              width: '100%', 
              height: '700px', 
              minHeight: '700px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <iframe
                src={`http://localhost:3000/chatbot/${course.agentAccessCode}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                frameBorder="0"
                allow="microphone"
                title="课程答疑助手"
              />
            </Box>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '2px dashed',
                borderColor: 'divider'
              }}
            >
              <SmartToy sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                课程答疑助手暂未启用
              </Typography>
              <Typography variant="body2" color="text.secondary">
                教师还未为本课程创建AI助手，请联系教师创建
              </Typography>
            </Paper>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default CourseLearning;
