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
  PlayCircle,
  Info,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseAPI, videoSegmentAPI, studentStatsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  category: string;
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
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); // 所有课程的状态
  
  // 判断当前是"我的课程"还是"加入课程"页面
  const isExploreMode = location.pathname === '/student/courses/explore';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  // 处理URL参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      // 不再处理materials和graph标签
    }
  }, [location.search]);

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
      // 确保只包含有效的课程ID
      const enrolledCourseIds = new Set(myCoursesData
        .filter(course => course && course.id) // 过滤掉无效的课程数据
        .map(course => course.id)
      );
      
      // 转换我的课程数据格式
      const formattedMyCourses = myCoursesData.map((course: any) => ({
        id: course.id,
        title: course.title || course.name || '未命名课程',
        instructor: course.teacher 
          ? `${course.teacher.firstName || ''}${course.teacher.lastName || ''}` 
          : (course.instructor || course.teacher?.username || '未知教师'),
        description: course.description || '暂无描述',
        category: course.category || '未分类',
        duration: course.duration || course.totalHours || 0,
        studentsCount: course._count?.enrollments || course.studentsCount || course.studentCount || 0,
        tags: Array.isArray(course.tags) ? course.tags : (typeof course.tags === 'string' ? JSON.parse(course.tags || '[]') : [course.category || '其他']),
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
        .filter((course: any) => course.status === 'PUBLISHED' || course.status === 'ACTIVE')
        .map((course: any) => ({
          id: course.id,
          title: course.title || course.name || '未命名课程',
          instructor: course.teacher 
            ? `${course.teacher.firstName || ''}${course.teacher.lastName || ''}` 
            : (course.instructor || course.teacher?.username || '未知教师'),
          description: course.description || '暂无描述',
          category: course.category || '未分类',
          duration: course.duration || course.totalHours || 0,
          studentsCount: course._count?.enrollments || course.studentsCount || course.studentCount || 0,
          tags: Array.isArray(course.tags) ? course.tags : (typeof course.tags === 'string' ? JSON.parse(course.tags || '[]') : [course.category || '其他']),
          thumbnail: course.coverImage || course.thumbnail || course.imageUrl || '/api/placeholder/400/200',
          // 确保只在确实已加入时才标记为已加入
        enrolled: course.id && enrolledCourseIds.has(course.id),
          progress: isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0)),
          completedChapters: course.completedChapters || course.completedHours || 0,
          totalChapters: course.totalChapters || course._count?.chapters || course.totalHours || 0,
          rating: course.rating || course.score || 0,
        }));
      
      console.log('格式化后的我的课程数据:', formattedMyCourses);
      console.log('格式化后的所有课程数据:', formattedAllCourses);
      
      // 获取基于视频片段计算的课程进度
      try {
        // 为我的课程获取视频进度和学习统计数据
        const myCoursesWithProgress = await Promise.all(
          formattedMyCourses.map(async (course: Course) => {
            try {
              // 获取视频进度
              const videoProgressResponse = await videoSegmentAPI.getCourseProgressByVideoSegments(course.id);
              console.log(`获取课程 ${course.id} 的视频进度:`, videoProgressResponse);
              
              // 获取学习统计数据
              const studentStatsResponse = await studentStatsAPI.getStudentStats(course.id);
              console.log(`获取课程 ${course.id} 的学习统计数据:`, studentStatsResponse);
              
              let progress = course.progress;
              if (videoProgressResponse && videoProgressResponse.data) {
                progress = videoProgressResponse.data.overallProgress || 0;
              }
              
              let studyTime = course.duration;
              if (studentStatsResponse && studentStatsResponse.data && studentStatsResponse.data.studyTime) {
                studyTime = studentStatsResponse.data.studyTime / 60; // 转换为小时
              }
              
              return {
                ...course,
                progress,
                duration: studyTime
              };
            } catch (err) {
              console.error(`获取课程 ${course.id} 的进度数据失败:`, err);
              return course;
            }
          })
        );
        
        // 为所有课程获取视频进度和学习统计数据（仅针对已加入的课程）
        const allCoursesWithProgress = await Promise.all(
          formattedAllCourses.map(async (course: any) => {
            // 只为已加入的课程获取进度数据
            if (course.enrolled) {
              try {
                // 获取视频进度
                const videoProgressResponse = await videoSegmentAPI.getCourseProgressByVideoSegments(course.id);
                console.log(`获取课程 ${course.id} 的视频进度:`, videoProgressResponse);
                
                // 获取学习统计数据
                const studentStatsResponse = await studentStatsAPI.getStudentStats(course.id);
                console.log(`获取课程 ${course.id} 的学习统计数据:`, studentStatsResponse);
                
                let progress = course.progress;
                if (videoProgressResponse && videoProgressResponse.data) {
                  progress = videoProgressResponse.data.overallProgress || 0;
                }
                
                let studyTime = course.duration;
                if (studentStatsResponse && studentStatsResponse.data && studentStatsResponse.data.studyTime) {
                  studyTime = studentStatsResponse.data.studyTime / 60; // 转换为小时
                }
                
                return {
                  ...course,
                  progress,
                  duration: studyTime
                };
              } catch (err) {
                console.error(`获取课程 ${course.id} 的进度数据失败:`, err);
              }
            }
            return course;
          })
        );
        
        setMyCourses(myCoursesWithProgress);
        setAllCourses(allCoursesWithProgress);
      } catch (err) {
        console.error('获取进度数据失败:', err);
        // 如果获取进度数据失败，仍然使用原始数据
        setMyCourses(formattedMyCourses);
        setAllCourses(formattedAllCourses);
      }
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

  

  // 根据当前模式选择要显示的课程
  // 在加入课程页面显示所有可加入的课程（包括已加入的，但会特殊标记）
  const baseCourses = isExploreMode ? allCourses : myCourses;
  
  const displayCourses = baseCourses
    .filter((course: Course) => {
      // 筛选逻辑保持不变
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
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

  const totalPages = Math.ceil(baseCourses.length / itemsPerPage);

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
    <Box sx={{ 
      flexGrow: 1, 
      background: '#f5f7fa',
      minHeight: '100vh',
      p: 3
    }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 添加返回按钮 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          background: 'white',
          borderRadius: 3,
          p: 3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/student')}
            sx={{ 
              mr: 2, 
              textTransform: 'none',
              color: '#2c3e50',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(44, 62, 80, 0.08)'
              }
            }}
            color="inherit"
          >
            返回学生主页
          </Button>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 700,
            color: '#2c3e50'
          }}>
            {isExploreMode ? '加入课程' : '我的课程'}
          </Typography>
        </Box>

        {/* 统计卡片 - 只在加入课程页面显示 */}
        {isExploreMode && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3,
                background: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ 
                    color: '#64748b', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}>
                    可选课程
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                    {allCourses.filter(course => !course.enrolled).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3,
                background: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ 
                    color: '#64748b', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}>
                    已加入
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                    {allCourses.filter(course => course.enrolled).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3,
                background: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ 
                    color: '#64748b', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}>
                    热门课程
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                    {allCourses.filter(course => course.studentsCount > 10).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* 标签切换 - 根据模式显示不同内容 */}
        {!isExploreMode && (
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: 3,
            background: 'white',
            borderRadius: 3,
            p: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  background: '#3b82f6',
                  '&:hover': {
                    background: '#2563eb',
                  }
                }}
              >
                所有课程
              </Button>
            </Box>
          </Box>
        )}

        {/* 搜索和筛选 */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3, 
          flexWrap: 'wrap',
          background: 'white',
          borderRadius: 3,
          p: 3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <TextField
            placeholder="搜索课程..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#64748b' }} />,
              sx: {
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-focused': {
                  backgroundColor: '#f1f5f9',
                  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                }
              }
            }}
            sx={{ 
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        {/* 课程网格 */}
        {displayCourses.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'white',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>
              {isExploreMode ? '暂无可加入的课程' : '暂无课程'}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {displayCourses.map((course) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 3,
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                    },
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      height: 8, 
                      background: course.enrolled 
                        ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                        : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                    }} />
                    
                    <CardContent sx={{ flexGrow: 1, pt: 3, px: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ position: 'relative', flex: 1 }}>
                          <Typography variant="h6" component="h2" noWrap sx={{ 
                            fontWeight: 700, 
                            fontSize: '1.2rem',
                            color: '#333',
                            lineHeight: 1.3
                          }}>
                            {course.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {isExploreMode && course.enrolled && (
                              <Chip 
                                label="已加入" 
                                size="small" 
                                color="success" 
                                sx={{ 
                                  bgcolor: '#10b981', 
                                  color: 'white',
                                  fontWeight: 600,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  height: 24
                                }}
                              />
                            )}
                            <Chip 
                              label={`${course.studentsCount} 人学习`} 
                              size="small" 
                              variant="outlined"
                              sx={{
                                fontSize: '0.75rem',
                                height: 24,
                                borderRadius: 1,
                                borderColor: 'rgba(59, 130, 246, 0.3)',
                                color: '#3b82f6'
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                          color: '#64748b',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}>
                          {course.instructor.charAt(0)}
                        </Box>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 500,
                          color: '#475569'
                        }}>
                          {course.instructor}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ 
                        mb: 3, 
                        lineHeight: 1.6,
                        color: '#64748b',
                        fontSize: '0.875rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {course.description}
                      </Typography>

                      {course.enrolled && (
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 600,
                              color: '#334155'
                            }}>
                              学习进度
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              minWidth: 45,
                              color: '#3b82f6'
                            }}>
                              {isNaN(Number(course.progress)) ? '0.0' : Math.max(0, Math.min(100, course.progress || 0)).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            flex: 1, 
                            bgcolor: '#e2e8f0', 
                            borderRadius: 4, 
                            height: 8, 
                            overflow: 'hidden' 
                          }}>
                            <Box 
                              sx={{ 
                                width: `${isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0))}%`, 
                                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', 
                                height: 8, 
                                borderRadius: 4,
                                transition: 'width 0.6s ease'
                              }} 
                            />
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Array.isArray(course.tags) && course.tags.slice(0, 3).map((tag) => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              borderRadius: 1,
                              borderColor: 'rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6'
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ 
                      justifyContent: 'flex-end', 
                      px: 3, 
                      pb: 3, 
                      pt: 1,
                      background: '#f8fafc'
                    }}>
                      {isExploreMode ? (
                        // 在加入课程页面，显示不同的按钮状态
                        course.enrolled ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayCircle />}
                            onClick={() => handleStartLearning(course.id)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                              py: 1,
                              background: '#10b981',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                              '&:hover': {
                                background: '#059669',
                                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                                transform: 'translateY(-2px)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            进入学习
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<School />}
                            onClick={() => handleEnrollCourse(course.id)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                              py: 1,
                              borderColor: '#3b82f6',
                              color: '#3b82f6',
                              background: '#f0f9ff',
                              '&:hover': {
                                borderColor: '#2563eb',
                                backgroundColor: '#e0f2fe',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            加入学习
                          </Button>
                        )
                      ) : (
                        // 在我的课程页面，只显示进入学习按钮
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayCircle />}
                          onClick={() => handleStartLearning(course.id)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            background: '#10b981',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                            '&:hover': {
                              background: '#059669',
                              boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          进入学习
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 分页 */}
            {totalPages > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 6,
                background: 'white',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      fontWeight: 600,
                      '&.Mui-selected': {
                        background: '#3b82f6',
                        color: 'white'
                      }
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default StudentCourseManagement;
