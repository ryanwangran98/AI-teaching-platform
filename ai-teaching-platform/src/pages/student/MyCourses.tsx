import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Rating,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  PlayCircle,
  AccessTime,
  People,
  Star,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseAPI, videoSegmentAPI } from '../../services/api';

interface Course {
  id: string;
  title: string;
  name?: string;
  instructor: string;
  firstName?: string;
  lastName?: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
  instructorAvatar: string;
  thumbnail: string;
  coverImage?: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  difficulty?: string;
  duration: number; // 小时
  totalChapters: number;
  completedChapters: number;
  progress: number;
  rating: number;
  studentsCount: number;
  lastAccess: string;
  status: 'in-progress' | 'completed' | 'not-started';
  tags: string[];
  _count?: {
    enrollments: number;
  };
}

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 获取课程数据
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 获取学生已加入的课程
      const response = await courseAPI.getStudentCourses();
      
      // 处理响应数据
      let courseData: any[] = [];
      if (Array.isArray(response)) {
        courseData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          courseData = response.data;
        } else if (response.data && Array.isArray(response.data.courses)) {
          courseData = response.data.courses;
        } else {
          courseData = [response.data];
        }
      }
      
      // 转换数据格式以匹配前端组件
      const formattedCourses = courseData.map(course => ({
        id: course.id,
        title: course.title || course.name || '未命名课程',
        instructor: course.teacher 
          ? `${course.teacher.firstName || ''}${course.teacher.lastName || ''}` 
          : (course.instructor || '未知教师'),
        instructorAvatar: course.instructorAvatar || '/api/placeholder/40/40',
        thumbnail: course.coverImage || course.thumbnail || '/api/placeholder/300/200',
        description: course.description || '',
        category: course.category || '未分类',
        level: mapDifficultyToLevel(course.difficulty || course.level),
        duration: course.duration || 0,
        totalChapters: course.totalChapters || course._count?.chapters || 0,
        completedChapters: course.completedChapters || 0,
        progress: course.progress || 0,
        rating: course.rating || 0,
        studentsCount: course.studentsCount || course._count?.enrollments || 0,
        lastAccess: course.lastAccess || '刚刚',
        status: determineStatus(course.progress || 0),
        tags: course.tags || [],
      }));
      
      // 获取基于视频播放片段计算的进度
      const coursesWithVideoProgress = await Promise.all(
        formattedCourses.map(async (course) => {
          try {
            const videoProgressResponse = await videoSegmentAPI.getCourseProgressByVideoSegments(course.id);
            if (videoProgressResponse.data && videoProgressResponse.data.success) {
              // 使用基于视频播放片段计算的进度
              return {
                ...course,
                progress: videoProgressResponse.data.data.progress
              };
            }
            return course;
          } catch (error) {
            console.error(`获取课程 ${course.id} 的视频进度失败:`, error);
            return course;
          }
        })
      );
      
      setCourses(coursesWithVideoProgress);
    } catch (err: any) {
      console.error('获取课程数据失败:', err);
      
      // 检查是否是速率限制错误(429)
      if (err.response && err.response.status === 429) {
        setError('请求过于频繁，请稍后再试');
        // 可以在这里实现自动重试机制
        setSnackbar({
          open: true,
          message: '请求过于频繁，将在3秒后自动重试...',
          severity: 'warning'
        });
        
        // 3秒后自动重试
        setTimeout(() => {
          fetchCourses();
        }, 3000);
      } else {
        setError('加载课程数据失败: ' + (err instanceof Error ? err.message : '未知错误'));
        setSnackbar({
          open: true,
          message: '加载课程数据失败',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 将难度映射到级别
  const mapDifficultyToLevel = (difficulty: string): 'beginner' | 'intermediate' | 'advanced' => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'beginner';
      case 'medium':
        return 'intermediate';
      case 'hard':
        return 'advanced';
      default:
        return 'intermediate';
    }
  };

  // 根据进度确定状态
  const determineStatus = (progress: number): 'in-progress' | 'completed' | 'not-started' => {
    if (progress >= 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  };

  const categories = ['all', ...Array.from(new Set(courses.map(course => course.category)))];
  const levels = [
    { value: 'all', label: '全部' },
    { value: 'beginner', label: '初级' },
    { value: 'intermediate', label: '中级' },
    { value: 'advanced', label: '高级' },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getLevelLabel = (level: string) => {
    return levels.find(l => l.value === level)?.label || level;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      case 'not-started': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'in-progress': '进行中',
      'completed': '已完成',
      'not-started': '未开始'
    };
    return statusMap[status] || '未知';
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => c.status === 'in-progress').length,
    completed: courses.filter(c => c.status === 'completed').length,
    notStarted: courses.filter(c => c.status === 'not-started').length,
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/student')}
          sx={{ mb: 2 }}
        >
          返回学生主页
        </Button>
        <Typography variant="h4">我的课程</Typography>
        <Box></Box> {/* 占位符，用于保持标题居中 */}
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchCourses}>
              重新加载
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总课程数
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                进行中
              </Typography>
              <Typography variant="h4">{stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                已完成
              </Typography>
              <Typography variant="h4">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                未开始
              </Typography>
              <Typography variant="h4">{stats.notStarted}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 筛选区域 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="搜索课程..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>分类</InputLabel>
          <Select
            value={selectedCategory}
            label="分类"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <MenuItem key={category} value={category}>
                {category === 'all' ? '全部分类' : category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>难度</InputLabel>
          <Select
            value={selectedLevel}
            label="难度"
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            {levels.map(level => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 课程列表 */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="160"
                image={course.thumbnail}
                alt={course.title}
              />
              
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={getLevelLabel(course.level)} 
                    size="small" 
                    color={getLevelColor(course.level) as any}
                    variant="outlined"
                  />
                  <Chip 
                    label={getStatusLabel(course.status)} 
                    size="small" 
                    color={getStatusColor(course.status) as any}
                  />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                  {course.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar
                    src={course.instructorAvatar}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {course.instructor}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.875rem' }}>
                  {course.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={course.rating} readOnly size="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {course.rating}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <AccessTime sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    {course.duration}小时
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <People sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    {course.studentsCount}
                  </Typography>
                </Box>

                {course.status !== 'not-started' && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">学习进度</Typography>
                      <Typography variant="body2" color="primary">
                        {isNaN(Number(course.progress)) ? '0.0' : Math.max(0, Math.min(100, course.progress || 0)).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0))} 
                      sx={{ height: 8, borderRadius: 5 }}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {course.tags.slice(0, 2).map((tag) => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayCircle />}
                  size="small"
                  onClick={() => navigate(`/student/course/${course.id}`)}
                >
                  {course.status === 'not-started' ? '加入学习' :
                   course.status === 'completed' ? '复习课程' :
                   '继续学习'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  上次学习: {course.lastAccess}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCourses.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            没有找到匹配的课程
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Box>
  );
};

export default MyCourses;