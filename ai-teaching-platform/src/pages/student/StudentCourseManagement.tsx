import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Rating,
  Pagination,
  Container,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search,
  School,
  AccessTime,
  People,
  Star,
  PlayCircle,
  Info,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  category: string;
  level: string;
  rating: number;
  studentsCount: number;
  duration: number;
  tags: string[];
  thumbnail: string;
  enrolled: boolean;
  progress: number;
  completedChapters: number;
  totalChapters: number;
}

const StudentCourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my'>('my');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); // 添加所有课程的状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 添加难度映射函数
  const mapDifficultyToLevel = (difficulty: string) => {
    const levelMap: { [key: string]: string } = {
      'BEGINNER': 'beginner',
      'INTERMEDIATE': 'intermediate',
      'ADVANCED': 'advanced',
      'EASY': 'beginner',
      'MEDIUM': 'intermediate',
      'HARD': 'advanced'
    };
    return levelMap[difficulty?.toUpperCase()] || 'beginner';
  };

  // 处理URL参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      // 不再处理materials和graph标签
    }
  }, [location.search]);

  const categories = ['全部', '数学', '计算机', '英语', '物理', '化学', '生物'];
  const levels = [
    { value: 'all', label: '全部难度' },
    { value: 'beginner', label: '入门' },
    { value: 'intermediate', label: '中级' },
    { value: 'advanced', label: '高级' }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('开始获取课程数据');
      
      // 获取学生已选课程
      const myResponse = await courseAPI.getStudentCourses();
      console.log('获取到的学生课程数据:', myResponse);
      
      // 获取所有公开课程
      const allResponse = await courseAPI.getCourses({ limit: 100 });
      console.log('获取到的所有课程数据:', allResponse);
      
      // 处理我的课程数据
      let myCoursesData = [];
      if (myResponse && typeof myResponse === 'object') {
        if (Array.isArray(myResponse)) {
          myCoursesData = myResponse;
        } else if (Array.isArray(myResponse.data)) {
          myCoursesData = myResponse.data;
        } else if (myResponse.data) {
          myCoursesData = [myResponse.data];
        }
      }
      
      // 处理所有课程数据
      let allCoursesData = [];
      if (allResponse && typeof allResponse === 'object') {
        if (Array.isArray(allResponse)) {
          allCoursesData = allResponse;
        } else if (allResponse.data?.courses && Array.isArray(allResponse.data.courses)) {
          allCoursesData = allResponse.data.courses;
        } else if (Array.isArray(allResponse.data)) {
          allCoursesData = allResponse.data;
        } else if (allResponse.courses && Array.isArray(allResponse.courses)) {
          allCoursesData = allResponse.courses;
        }
      }
      
      console.log('处理后的我的课程数据:', myCoursesData);
      console.log('处理后的所有课程数据:', allCoursesData);
      
      // 创建已加入课程ID的集合，用于快速查找
      const enrolledCourseIds = new Set(myCoursesData.map(course => course.id));
      
      // 转换我的课程数据格式
      const formattedMyCourses = myCoursesData.map(course => ({
        id: course.id,
        title: course.title || course.name || '未命名课程',
        instructor: course.teacher 
          ? `${course.teacher.firstName || ''}${course.teacher.lastName || ''}` 
          : (course.instructor || course.teacher?.username || '未知教师'),
        description: course.description || '暂无描述',
        category: course.category || course.department || '未分类',
        level: mapDifficultyToLevel(course.difficulty || course.level),
        duration: course.duration || course.totalHours || 0,
        studentsCount: course._count?.enrollments || course.studentsCount || course.studentCount || 0,
        tags: course.tags || [course.category || course.department || '其他'],
        thumbnail: course.coverImage || course.thumbnail || course.imageUrl || '/api/placeholder/400/200',
        enrolled: true,
        progress: isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0)),
        completedChapters: course.completedChapters || course.completedHours || 0,
        totalChapters: course.totalChapters || course._count?.chapters || course.totalHours || 0,
        rating: course.rating || course.score || 0,
      }));
      
      // 转换所有课程数据格式，并标记是否已加入
      const formattedAllCourses = allCoursesData
        // 只显示已发布或激活的课程
        .filter(course => course.status === 'PUBLISHED' || course.status === 'ACTIVE')
        .map(course => ({
          id: course.id,
          title: course.title || course.name || '未命名课程',
          instructor: course.teacher 
            ? `${course.teacher.firstName || ''}${course.teacher.lastName || ''}` 
            : (course.instructor || course.teacher?.username || '未知教师'),
          description: course.description || '暂无描述',
          category: course.category || course.department || '未分类',
          level: mapDifficultyToLevel(course.difficulty || course.level),
          duration: course.duration || course.totalHours || 0,
          studentsCount: course._count?.enrollments || course.studentsCount || course.studentCount || 0,
          tags: course.tags || [course.category || course.department || '其他'],
          thumbnail: course.coverImage || course.thumbnail || course.imageUrl || '/api/placeholder/400/200',
          enrolled: enrolledCourseIds.has(course.id),
          progress: isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0)),
          completedChapters: course.completedChapters || course.completedHours || 0,
          totalChapters: course.totalChapters || course._count?.chapters || course.totalHours || 0,
          rating: course.rating || course.score || 0,
        }));
      
      console.log('格式化后的我的课程数据:', formattedMyCourses);
      console.log('格式化后的所有课程数据:', formattedAllCourses);
      
      setMyCourses(formattedMyCourses);
      setAllCourses(formattedAllCourses);
      setError(null);
    } catch (err: any) {
      console.error('获取课程数据失败:', err);
      const errorMessage = err.response?.data?.message || err.message || '获取课程数据失败';
      setError(errorMessage);
      alert(`加载课程数据失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getLevelText = (level: string) => {
    const levelMap: { [key: string]: string } = {
      'beginner': '入门',
      'intermediate': '中级',
      'advanced': '高级'
    };
    return levelMap[level] || level;
  };

  const getLevelColor = (level: string) => {
    const colorMap: { [key: string]: 'default' | 'success' | 'warning' | 'error' } = {
      'beginner': 'success',
      'intermediate': 'warning',
      'advanced': 'error'
    };
    return colorMap[level] || 'default';
  };

  const filteredCourses = allCourses; // 使用所有课程进行过滤
  
  const displayCourses = filteredCourses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleStartLearning = (courseId: string) => {
    navigate(`/student/course/${courseId}`);
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      // 调用API加入课程
      console.log('尝试加入课程:', courseId);
      const response = await courseAPI.enrollCourse(courseId);
      console.log('加入课程响应:', response);
      
      // 重新获取课程数据
      await fetchCourses();
      
      // 显示成功消息
      alert('成功加入课程！');
    } catch (err: any) {
      console.error('加入课程失败:', err);
      // 更详细的错误信息
      let errorMessage = '加入课程失败，请稍后重试';
      if (err.response) {
        // 服务器响应了错误状态码
        if (err.response.status === 400) {
          errorMessage = '您已经加入了这门课程';
        } else if (err.response.status === 404) {
          errorMessage = '课程不存在';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `服务器错误: ${err.response.status}`;
        }
      } else if (err.request) {
        // 请求已发出但没有收到响应
        errorMessage = '网络错误，请检查网络连接';
      } else if (err.message) {
        // 其他错误
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      alert(`加入课程失败: ${errorMessage}`);
    }
  };

  const handleUnenrollCourse = async (courseId: string) => {
    try {
      // 调用API退出课程
      await courseAPI.unenrollCourse(courseId);
      
      // 重新获取课程数据
      await fetchCourses();
      
      // 显示成功消息
      alert('成功退出课程！');
    } catch (err: any) {
      console.error('退出课程失败:', err);
      setError(err.response?.data?.message || err.message || '退出课程失败，请稍后重试');
    }
  };

  const handleJoinCourses = () => {
    // 不再需要此功能
  };

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              加载课程数据失败: {error}
            </Alert>
            <Button variant="contained" onClick={fetchCourses}>
              重新加载
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 添加返回按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/student')}
          sx={{ mr: 2, textTransform: 'none' }}
          color="inherit"
        >
          返回学生主页
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          课程中心
        </Typography>
        
        {/* 标签切换 - 只保留我的课程 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
            >
              所有课程
            </Button>
          </Box>
        </Box>

        {/* 搜索和筛选 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="搜索课程..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>分类</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="分类"
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat.toLowerCase()}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>难度</InputLabel>
            <Select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              label="难度"
            >
              {levels.map(level => (
                <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 课程网格 */}
        {displayCourses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary">
              暂无课程
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {displayCourses.map((course) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={course.thumbnail}
                      alt={course.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h2" noWrap>
                          {course.title}
                        </Typography>
                        <Chip 
                          label={getLevelText(course.level)} 
                          size="small" 
                          color={getLevelColor(course.level)}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {course.instructor} | {course.category}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {course.description.substring(0, 80)}...
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Rating value={course.rating} readOnly size="small" />
                        <Typography variant="body2" color="textSecondary">
                          {course.rating}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ({course.studentsCount}人)
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        {course.tags.slice(0, 2).map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>

                      {course.enrolled && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            进度: {course.completedChapters || 0}/{course.totalChapters || 0} 章节
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box sx={{ flex: 1, bgcolor: 'grey.200', borderRadius: 1, height: 6 }}>
                              <Box 
                                sx={{ 
                                  width: `${isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0))}%`, 
                                  bgcolor: 'primary.main', 
                                  height: 6, 
                                  borderRadius: 1 
                                }} 
                              />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                              {isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0))}%
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                        {course.duration}小时
                      </Typography>
                      {course.enrolled ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayCircle />}
                          onClick={() => handleStartLearning(course.id)}
                        >
                          进入学习
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<School />}
                          onClick={() => handleEnrollCourse(course.id)}
                        >
                          加入学习
                        </Button>
                      )}
                    </CardActions>

                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 分页 */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default StudentCourseManagement;