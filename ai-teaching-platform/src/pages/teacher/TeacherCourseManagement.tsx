import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  useTheme,
  alpha,
  styled,
  Divider
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Search,
  School,
  Group,
  AccessTime,
  Assessment,
  ArrowBack,
  MenuBook,      // 课件图标
  Description,   // 资料图标
  ViewModule,    // 章节图标
  Psychology,    // 知识点图标
  Quiz,         // 题库图标
  Assignment,    // 作业图标
  ViewList,
  MoreVert,
  FilterList,
  SmartToy,      // AI助手图标
  CheckCircle,   // 已创建图标
  Error,         // 错误图标
  Refresh        // 刷新图标
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  teacher: string;
  credits: number;
  semester: string;
  status: 'active' | 'inactive' | 'draft';
  studentCount: number;
  totalHours: number;
  completedHours: number;
  startDate: string;
  endDate: string;
  difficulty: string;
  prerequisites: string[];
  tags: string[];
  agentAppId?: string;      // Dify Agent应用ID
  agentAccessToken?: string; // Dify Agent应用访问令牌
}

const TeacherCourseManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // 自定义样式组件
  const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    },
  }));

  const StatsCard = styled(Card)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    },
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }));

  const CourseCard = styled(Card)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
    },
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }));

  // 状态管理
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentAppInfo, setAgentAppInfo] = useState<any>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  
  // 添加编辑表单的state
  const [editForm, setEditForm] = useState({
    title: '',
    code: '',
    description: '',
    status: 'draft' as 'active' | 'inactive' | 'draft',
    credits: 3,
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    tags: [] as string[]
  });
  
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [showFilters, setShowFilters] = useState(false);

  const difficulties = ['EASY', 'MEDIUM', 'HARD'] as const;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getMyCourses();
      
      console.log('原始课程数据:', response);
      
      // 处理后端数据结构
      let coursesData = [];
      
      // 检查不同可能的返回格式
      if (response.courses) {
        coursesData = response.courses;
      } else if (response.data && response.data.courses) {
        coursesData = response.data.courses;
      } else if (response.data && Array.isArray(response.data)) {
        coursesData = response.data;
      } else {
        coursesData = response.data || response;
      }

      // 确保coursesData是数组
      if (!Array.isArray(coursesData)) {
        coursesData = [coursesData];
      }

      console.log('处理后的课程数据:', coursesData);

      // 转换后端数据格式到前端格式
      const convertBackendCourse = (course: any): Course => {
        console.log('转换单个课程:', course);
        console.log('课程agentAppId:', course.agentAppId);
        console.log('课程agentAccessToken:', course.agentAccessToken);
        return {
          id: course.id,
          name: course.title || course.name || '未命名课程',
          code: course.code || '',
          description: course.description || '暂无描述',
          credits: Number(course.credits) || 3,
          department: course.college || course.department || course.category || '其他',
          teacher: '当前教师',
          studentCount: Number(course.enrollmentCount) || Number(course.studentCount) || 0,
          totalHours: Number(course.credits) ? Number(course.credits) * 16 : 48,
          completedHours: 0,
          status: (course.status || 'draft').toLowerCase() as 'active' | 'inactive' | 'draft',
          semester: '2024-2025学年',
          startDate: course.createdAt || new Date().toISOString(),
          endDate: new Date(new Date().getTime() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: course.category || '其他',
          difficulty: course.difficulty || 'MEDIUM',
          prerequisites: [],
          tags: course.tags || [],
          agentAppId: course.agentAppId,
          agentAccessToken: course.agentAccessToken
        };
      };

      const convertedCourses = coursesData.map(convertBackendCourse);
      console.log('转换后的前端课程:', convertedCourses);
      console.log('转换后的课程agentAppId:', convertedCourses.map(c => ({ id: c.id, name: c.name, agentAppId: c.agentAppId })));
      
      setCourses(convertedCourses);
      setError(null);
    } catch (err: any) {
      console.error('获取课程数据失败:', err);
      setError(err.response?.data?.message || '获取课程数据失败，请稍后重试');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateCourse = () => {
    navigate('/teacher/courses/new');
  };

  const handleEditCourse = (course: Course) => {
    console.log('开始编辑课程:', course);
    setSelectedCourse(course);
    setEditForm({
      title: course.name,
      code: course.code,
      description: course.description,
      status: course.status,
      credits: course.credits,
      difficulty: (course.difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
      tags: Array.isArray(course.tags) ? course.tags : []
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCourse(null);
    setEditForm({ 
      title: '', 
      code: '', 
      description: '', 
      status: 'draft',
      credits: 3,
      difficulty: 'MEDIUM',
      tags: []
    });
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('确定要删除这门课程吗？此操作不可撤销。')) {
      try {
        await courseAPI.deleteCourse(courseId);
        setCourses(courses.filter(course => course.id !== courseId));
      } catch (error: any) {
        alert(`删除课程失败: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleEditFormChange = (field: string, value: string | number | string[]) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedCourse) {
      console.error('没有选择课程');
      return;
    }

    try {
      console.log('准备更新课程:', {
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        updateData: editForm
      });

      // 准备要发送的数据，确保字段名称与后端匹配
      const updateData = {
        name: editForm.title, // 将title改为name以匹配后端schema
        code: editForm.code,
        description: editForm.description,
        status: editForm.status.toUpperCase(), // 转换为大写以匹配数据库格式
        credits: editForm.credits,
        difficulty: editForm.difficulty,
        tags: editForm.tags
      };

      console.log('发送更新请求:', `/courses/${selectedCourse.id}`, updateData);

      // 调用API更新课程
      const response = await courseAPI.updateCourse(selectedCourse.id, updateData);
      console.log('更新响应:', response);

      // 更新本地状态
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === selectedCourse.id 
            ? { 
                ...course, 
                ...updateData, 
                name: updateData.name, 
                status: editForm.status,
                credits: updateData.credits,
                difficulty: updateData.difficulty,
                tags: updateData.tags
              }
            : course
        )
      );

      console.log('课程更新成功');
      
    } catch (error: any) {
      console.error('更新课程失败详情:', {
        error: error,
        response: error.response,
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
      
      alert(`更新课程失败: ${error.response?.data?.error || error.message}`);
    } finally {
      handleClose();
    }
  };

  // 处理打开Agent应用对话框
  const handleOpenAgentDialog = async (course: Course) => {
    setSelectedCourse(course);
    setAgentDialogOpen(true);
    setAgentLoading(true);
    setAgentError(null);
    
    try {
      // 获取Agent应用信息
      const response = await courseAPI.getAgentAppInfo(course.id);
      setAgentAppInfo(response.data || response);
    } catch (error: any) {
      console.error('获取Agent应用信息失败:', error);
      setAgentError(error.response?.data?.message || '获取Agent应用信息失败');
    } finally {
      setAgentLoading(false);
    }
  };

  // 处理关闭Agent应用对话框
  const handleCloseAgentDialog = () => {
    setAgentDialogOpen(false);
    setSelectedCourse(null);
    setAgentAppInfo(null);
    setAgentError(null);
  };

  // 处理关闭Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 处理创建或重新创建Agent应用
  const handleCreateAgentApp = async () => {
    if (!selectedCourse) return;
    
    setAgentLoading(true);
    setAgentError(null);
    
    try {
      // 根据接口文档，创建Agent应用需要两个步骤：
      // 1. 创建应用（需要登录获取access_token）
      // 2. 获取应用的访问令牌
      
      // 步骤1：创建应用
      const appResponse = await courseAPI.createAgentApp(selectedCourse.id);
      
      // 根据接口文档，响应格式应该是：
      // {
      //   "success": true,
      //   "data": {
      //     "agentAppId": "应用ID",
      //     "agentAccessToken": "访问令牌"
      //   },
      //   "message": "Agent应用创建成功"
      // }
      
      if (appResponse.success && appResponse.data) {
        setAgentAppInfo(appResponse.data);
        
        // 更新课程列表中的Agent应用信息
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === selectedCourse.id 
              ? { 
                  ...course, 
                  agentAppId: appResponse.data.agentAppId,
                  agentAccessToken: appResponse.data.agentAccessToken
                }
              : course
          )
        );
        
        // 显示成功消息
        setSnackbar({
          open: true,
          message: appResponse.message || 'Agent应用创建成功！',
          severity: 'success'
        });
      } else {
        throw new Error(appResponse.message || '创建Agent应用失败');
      }
      
    } catch (error: any) {
      console.error('创建Agent应用失败:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          '创建Agent应用失败';
      setAgentError(errorMessage);
      
      // 显示错误消息
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setAgentLoading(false);
    }
  };

  // 处理打开资源管理对话框
  const handleOpenResourceDialog = (course: Course) => {
    // 直接跳转到新的资源管理页面
    navigate(`/teacher/courses/${course.id}`);
  };

  // 处理关闭资源管理对话框
  // const handleCloseResourceDialog = () => {
  //   setResourceDialogOpen(false);
  //   setSelectedCourseForResource(null);
  // };

  // 跳转到对应的资源管理页面
  const navigateToResource = (type: string, courseId: string) => {
    const routes = {
      courseware: `/teacher/courses/${courseId}/courseware`,
      materials: `/teacher/courses/${courseId}/materials`,
      chapters: `/teacher/courses/${courseId}/chapters`,
      graph: `/teacher/courses/${courseId}/graph`,
      knowledge: `/teacher/courses/${courseId}/knowledge-points`,
      questions: `/teacher/courses/${courseId}/questions`,
      assignments: `/teacher/courses/${courseId}/assignments`
    };
    
    const route = routes[type as keyof typeof routes];
    if (route) {
      navigate(route);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '开课中';
      case 'inactive': return '已结课';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            我的课程
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateCourse}
          >
            新建课程
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchCourses}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 添加返回按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teacher')}
          sx={{ mr: 2, textTransform: 'none' }}
          color="inherit"
        >
          返回工作台
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          我的课程
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateCourse}
        >
          新建课程
        </Button>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    总课程数
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {courses.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    本学期开设
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 56,
                  height: 56
                }}>
                  <MenuBook sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    总学生数
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {courses.reduce((sum, course) => sum + course.studentCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    注册学生
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  width: 56,
                  height: 56
                }}>
                  <Group sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    课程状态
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {courses.filter(course => course.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    进行中课程
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  width: 56,
                  height: 56
                }}>
                  <Assessment sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* 搜索和筛选 */}
      <StyledCard sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              课程列表
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="搜索课程名称、代码或教师"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
              }}
              sx={{ flex: 1 }}
            />
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
              <FilterList />
            </IconButton>
          </Box>
          
          {showFilters && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>状态</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="状态"
                >
                  <MenuItem value="all">全部状态</MenuItem>
                  <MenuItem value="active">开课中</MenuItem>
                  <MenuItem value="inactive">已结课</MenuItem>
                  <MenuItem value="draft">草稿</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* 课程列表 */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
            <CourseCard>
              {/* 卡片头部 - 状态标签 */}
              <Box sx={{ 
                position: 'relative', 
                height: 120, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                borderRadius: '16px 16px 0 0',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16, 
                  display: 'flex', 
                  gap: 1 
                }}>
                  <Chip 
                    label={getStatusText(course.status)} 
                    size="small" 
                    color={getStatusColor(course.status) as any}
                    sx={{ 
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      '& .MuiChip-label': {
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                  <Chip 
                    label={course.department} 
                    size="small"
                    sx={{ 
                      backdropFilter: 'blur(4px)',
                      backgroundColor: alpha(theme.palette.background.paper, 0.9)
                    }}
                  />
                </Box>
                
                {/* 课程图标 */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)'
                }}>
                  <Avatar sx={{ 
                    width: 64, 
                    height: 64, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }}>
                    <School sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1, pt: 3, pb: 2 }}>
                {/* 课程标题和代码 */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" component="h2" noWrap sx={{ 
                    fontWeight: 700, 
                    fontSize: '1.25rem',
                    color: theme.palette.text.primary,
                    mb: 0.5
                  }}>
                    {course.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ 
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}>
                    {course.code}
                  </Typography>
                </Box>
                
                {/* 课程描述 */}
                <Typography variant="body2" color="textSecondary" sx={{ 
                  mb: 3, 
                  lineHeight: 1.7,
                  fontSize: '0.875rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {course.description}
                </Typography>

                {/* 统计信息 */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  mb: 3
                }}>
                  <Box sx={{ textAlign: 'center', px: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                      {course.studentCount}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      学生
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', px: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                      {course.credits}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      学分
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              {/* 操作按钮 */}
              <CardActions sx={{ 
                justifyContent: 'space-between', 
                px: 2.5, 
                pb: 2.5, 
                pt: 0
              }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditCourse(course)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      py: 0.75,
                      minWidth: 'auto',
                      fontSize: '0.8125rem'
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MenuBook />}
                    onClick={() => handleOpenResourceDialog(course)}
                    color="primary"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      py: 0.75,
                      minWidth: 'auto',
                      fontSize: '0.8125rem'
                    }}
                  >
                    资源
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SmartToy />}
                    onClick={() => handleOpenAgentDialog(course)}
                    color="primary"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      py: 0.75,
                      minWidth: 'auto',
                      fontSize: '0.8125rem'
                    }}
                  >
                    AI助手
                  </Button>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => handleDeleteCourse(course.id)}
                  color="error"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    py: 0.75,
                    minWidth: 'auto',
                    fontSize: '0.8125rem',
                    borderColor: alpha(theme.palette.error.main, 0.5),
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      bgcolor: alpha(theme.palette.error.main, 0.04)
                    }
                  }}
                >
                  删除
                </Button>
              </CardActions>
            </CourseCard>
          </Grid>
        ))}
      </Grid>

      {/* 编辑对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            编辑课程
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="课程名称"
                  variant="outlined"
                  value={editForm.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="课程代码"
                  variant="outlined"
                  value={editForm.code}
                  onChange={(e) => handleEditFormChange('code', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="课程描述"
                  variant="outlined"
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>难度级别</InputLabel>
                  <Select
                    value={editForm.difficulty}
                    onChange={(e) => handleEditFormChange('difficulty', e.target.value)}
                    label="难度级别"
                  >
                    {difficulties.map(diff => (
                      <MenuItem key={diff} value={diff}>
                        {diff === 'EASY' ? '简单' : diff === 'MEDIUM' ? '中等' : '困难'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="学分"
                  type="number"
                  variant="outlined"
                  value={editForm.credits}
                  onChange={(e) => handleEditFormChange('credits', Number(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="课程标签 (用逗号分隔)"
                  variant="outlined"
                  value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    handleEditFormChange('tags', tags);
                  }}
                  helperText="例如：编程, 基础, 必修"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>课程状态</InputLabel>
                  <Select
                    value={editForm.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    label="课程状态"
                  >
                    <MenuItem value="draft">草稿</MenuItem>
                    <MenuItem value="active">开课中</MenuItem>
                    <MenuItem value="inactive">已结课</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            取消
          </Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 资源管理对话框 - 已移除，改为跳转到新页面 */}

      {/* Agent应用管理对话框 */}
      <Dialog open={agentDialogOpen} onClose={handleCloseAgentDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            AI助手管理 - {selectedCourse?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {agentLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  正在获取AI助手信息...
                </Typography>
              </Box>
            ) : agentError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {agentError}
              </Alert>
            ) : agentAppInfo && agentAppInfo.agentAppId ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  AI助手已成功创建！
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="AI助手ID"
                      variant="outlined"
                      value={agentAppInfo.agentAppId}
                      InputProps={{ readOnly: true }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="访问令牌"
                      variant="outlined"
                      value={agentAppInfo.agentAccessToken || "未生成"}
                      InputProps={{ readOnly: true }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="嵌入代码"
                      variant="outlined"
                      multiline
                      rows={4}
                      value={agentAppInfo.iframeCode || "暂无嵌入代码"}
                      InputProps={{ readOnly: true }}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                  <Typography variant="body2" color="info.main">
                    提示：您可以将上述嵌入代码添加到课程页面中，让学生可以直接与AI助手互动。
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SmartToy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  尚未创建AI助手
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  为本课程创建AI助手，可以帮助学生解答问题、提供学习指导等。
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseAgentDialog} variant="outlined">
            关闭
          </Button>
          {!agentAppInfo?.agentAppId && (
            <Button 
              onClick={handleCreateAgentApp} 
              variant="contained" 
              startIcon={agentLoading ? <CircularProgress size={20} /> : <SmartToy />}
              disabled={agentLoading}
            >
              {agentLoading ? '创建中...' : '创建AI助手'}
            </Button>
          )}
          {agentAppInfo?.agentAppId && (
            <Button 
              onClick={handleCreateAgentApp} 
              variant="outlined" 
              startIcon={agentLoading ? <CircularProgress size={20} /> : <Refresh />}
              disabled={agentLoading}
            >
              {agentLoading ? '重新创建中...' : '重新创建'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity as any} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default TeacherCourseManagement;