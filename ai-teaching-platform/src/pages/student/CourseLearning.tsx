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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
// 引入学习资料和课程图谱组件
import Materials from './Materials';
import CourseGraph from './CourseGraph';
import { courseAPI, chapterAPI, assignmentAPI } from '../../services/api';

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
}

interface Assignment {
  id: string;
  title: string;
  type: 'homework' | 'quiz' | 'exam';
  dueDate: string;
  totalPoints: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // 在fetchCourseData函数中增加更详细的作业数据处理和日志
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      // 获取课程详情
      const courseResponse = await courseAPI.getCourse(courseId!);
      console.log('获取到的课程数据:', courseResponse);
      
      // 获取课程章节（所有状态的章节）
      const chaptersResponse = await chapterAPI.getChapters(courseId!, 'all');
      console.log('获取到的章节数据:', chaptersResponse);
      
      // 获取课程作业
      const assignmentsResponse = await assignmentAPI.getAssignments({ courseId: courseId! });
      console.log('获取到的作业数据原始响应:', assignmentsResponse);
      console.log('获取到的作业数据类型:', typeof assignmentsResponse);
      console.log('获取到的作业数据是否为数组:', Array.isArray(assignmentsResponse));
      
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
      
      // 处理作业数据 - 增加更详细的处理逻辑
      let assignmentsData = [];
      if (assignmentsResponse && typeof assignmentsResponse === 'object') {
        // 检查是否是分页数据结构
        if (assignmentsResponse.data && assignmentsResponse.data.assignments) {
          assignmentsData = assignmentsResponse.data.assignments;
          console.log('从分页结构中提取的作业数据:', assignmentsData);
        } else if (Array.isArray(assignmentsResponse)) {
          assignmentsData = assignmentsResponse;
        } else if (Array.isArray(assignmentsResponse.data)) {
          assignmentsData = assignmentsResponse.data;
        } else {
          console.log('无法识别的作业数据结构:', assignmentsResponse);
        }
      }
      
      // 记录处理后的作业数据
      console.log('处理后的作业数据:', assignmentsData);
      console.log('作业数量:', assignmentsData.length);
      
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
        overallProgress: courseData.progress || 0,
        chapters: chaptersData.map((chapter: any, index: number) => {
          // 处理章节标题，如果标题是数字则添加前缀
          let title = chapter.title || `第${chapter.order || index + 1}章`;
          if (/^\d+$/.test(title)) {
            title = `第${title}章`;
          }
          
          // 处理章节描述
          let description = chapter.description || chapter.content || '暂无描述';
          if (/^\d+$/.test(description) && description === chapter.title) {
            description = `这是第${description}章的内容`;
          }
          
          return {
            id: chapter.id,
            title: title,
            description: description,
            duration: chapter.duration || 0,
            order: chapter.order || index + 1,
            type: 'video', // 默认类型
            contentUrl: '', // 需要根据实际内容设置
            completed: false, // 需要从学习记录中获取
            progress: chapter.progress || 0,
            resources: [], // 需要从资料/课件中获取
          };
        }),
        assignments: assignmentsData.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title || '未命名作业',
          type: assignment.type.toLowerCase() === 'homework' ? 'homework' : 
                assignment.type.toLowerCase() === 'quiz' ? 'quiz' : 
                assignment.type.toLowerCase() === 'exam' ? 'exam' :
                assignment.type.toLowerCase() === 'project' ? 'project' : assignment.type,
          dueDate: assignment.dueDate || assignment.endTime || '',
          totalPoints: assignment.totalPoints || assignment.totalScore || 0,
          totalScore: assignment.totalScore || assignment.totalPoints || 0, // 与教师端字段名保持一致
          status: assignment.status === 'pending' ? 'pending' :
                  assignment.status === 'submitted' ? 'submitted' :
                  assignment.status === 'graded' ? 'graded' : 'pending',
          score: assignment.score,
        })),
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
    console.log('开始学习章节:', chapterId);
  };

  // 添加开始作业的处理函数
  const handleStartAssignment = (assignmentId: string) => {
    // 导航到作业详情页面
    navigate(`/student/course/${courseId}/assignment/${assignmentId}`);
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
    <Box sx={{ flexGrow: 1 }}>
      {/* 课程头部 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              讲师：{course.instructor}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {course.description}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" color="primary">
                  {course.overallProgress}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总体进度
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6">
                  {course.completedChapters}/{course.totalChapters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已完成章节
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6">
                  {Math.floor(course.totalDuration / 60)}小时
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总时长
                </Typography>
              </Box>
            </Box>

            <LinearProgress 
              variant="determinate" 
              value={isNaN(Number(course.overallProgress)) ? 0 : Math.max(0, Math.min(100, course.overallProgress || 0))} 
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  课程统计
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">完成进度</Typography>
                    <Typography variant="body2" color="primary">
                      {isNaN(Number(course.overallProgress)) ? 0 : Math.max(0, Math.min(100, course.overallProgress || 0))}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">学习时长</Typography>
                    <Typography variant="body2">
                      {Math.floor((course.totalDuration * course.overallProgress) / 100 / 60)}小时
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">平均得分</Typography>
                    <Typography variant="body2">
                      <Star sx={{ fontSize: 16, color: 'warning.main', verticalAlign: 'middle' }} />
                      4.5/5.0
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* 标签页 - 移除"学习内容"标签 */}
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="课程章节" />
          <Tab label="作业任务" />
          <Tab label="学习资料" />
          <Tab label="课程图谱" />
        </Tabs>
      </Paper>

      {/* 课程章节 */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {course.chapters.map((chapter) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={chapter.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: chapter.completed ? 'success.main' : 'primary.main' }}>
                      {getTypeIcon(chapter.type)}
                    </Avatar>
                    <Chip 
                      label={chapter.completed ? '已完成' : '进行中'} 
                      color={chapter.completed ? 'success' : 'primary'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    {chapter.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {chapter.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      时长: {Math.floor(chapter.duration / 60)}小时{chapter.duration % 60}分钟
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      类型: {getTypeLabel(chapter.type)}
                    </Typography>
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={isNaN(Number(chapter.progress)) ? 0 : Math.max(0, Math.min(100, chapter.progress || 0))} 
                    sx={{ height: 6, borderRadius: 3, mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    进度: {isNaN(Number(chapter.progress)) ? 0 : Math.max(0, Math.min(100, chapter.progress || 0))}%
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayCircle />}
                    onClick={() => handleChapterClick(chapter.id)}
                    disabled={chapter.completed}
                  >
                    {chapter.completed ? '复习' : '开始学习'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 作业任务 - 现在是tabValue=1 */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {course.assignments.length > 0 ? (
            course.assignments.map((assignment) => (
              <Grid size={{ xs: 12, md: 6 }} key={assignment.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {assignment.title}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(assignment.status)} 
                        color={getStatusColor(assignment.status) as any}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        类型: {getTypeLabel(assignment.type)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        截止日期: {assignment.dueDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        总分: {assignment.totalScore || assignment.totalPoints}分
                      </Typography>
                    </Box>

                    {assignment.status === 'graded' && assignment.score !== undefined && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" color="primary">
                          得分: {assignment.score}/{assignment.totalScore || assignment.totalPoints}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={assignment.status === 'graded'}
                      onClick={() => handleStartAssignment(assignment.id)}
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
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  暂无教师发布的作业
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  教师还未在本课程中发布任何作业，请耐心等待。
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* 学习资料 - 现在是tabValue=2 */}
      {tabValue === 2 && (
        <Box sx={{ mt: 2 }}>
          <Materials courseId={courseId} />
        </Box>
      )}

      {/* 课程图谱 - 现在是tabValue=3 */}
      {tabValue === 3 && (
        <Box sx={{ mt: 2 }}>
          <CourseGraph courseId={courseId} />
        </Box>
      )}
    </Box>
  );
};

export default CourseLearning;