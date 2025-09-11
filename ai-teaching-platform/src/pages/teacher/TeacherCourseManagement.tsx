import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Alert
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
  Assignment    // 作业图标
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  teacher: string;
  credits: number;
  semester: string;
  status: 'active' | 'inactive' | 'draft';
  studentCount: number;
  totalHours: number;
  completedHours: number;
  startDate: string;
  endDate: string;
  category: string;
  prerequisites: string[];
  tags: string[];
}

const TeacherCourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 添加编辑表单的state
  const [editForm, setEditForm] = useState({
    title: '',
    code: '',
    description: '',
    status: 'draft' as 'active' | 'inactive' | 'draft'
  });

  const departments = ['数学学院', '计算机学院', '外国语学院', '物理学院', '化学学院'];

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
          prerequisites: [],
          tags: course.tags || []
        };
      };

      const convertedCourses = coursesData.map(convertBackendCourse);
      console.log('转换后的前端课程:', convertedCourses);
      
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
    const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
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
      status: course.status
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCourse(null);
    setEditForm({ title: '', code: '', description: '', status: 'draft' });
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

  const handleEditFormChange = (field: string, value: string) => {
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
        status: editForm.status.toUpperCase() // 转换为大写以匹配数据库格式
      };

      console.log('发送更新请求:', `/courses/${selectedCourse.id}`, updateData);

      // 调用API更新课程
      const response = await courseAPI.updateCourse(selectedCourse.id, updateData);
      console.log('更新响应:', response);

      // 更新本地状态
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === selectedCourse.id 
            ? { ...course, ...updateData, name: updateData.name, status: editForm.status }
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    总课程数
                  </Typography>
                  <Typography variant="h4">
                    {courses.length}
                  </Typography>
                </Box>
                <School color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    总学生数
                  </Typography>
                  <Typography variant="h4">
                    {courses.reduce((sum, course) => sum + course.studentCount, 0)}
                  </Typography>
                </Box>
                <Group color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    总学时
                  </Typography>
                  <Typography variant="h4">
                    {courses.reduce((sum, course) => sum + course.totalHours, 0)}小时
                  </Typography>
                </Box>
                <AccessTime color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    平均学分
                  </Typography>
                  <Typography variant="h4">
                    {(courses.reduce((sum, course) => sum + course.credits, 0) / courses.length).toFixed(1)}
                  </Typography>
                </Box>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 搜索和筛选 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>学院</InputLabel>
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            label="学院"
          >
            <MenuItem value="all">全部学院</MenuItem>
            {departments.map(dept => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </Select>
        </FormControl>
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

      {/* 课程列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>课程信息</TableCell>
              <TableCell>学院</TableCell>
              <TableCell>学分</TableCell>
              <TableCell>学生数</TableCell>
              <TableCell>进度</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {course.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {course.code}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {course.description.substring(0, 50)}...
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={course.department} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {course.credits}学分
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {course.studentCount}人
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={isNaN(Number((course.completedHours || 0) / (course.totalHours || 1)) * 100) ? 0 : Math.max(0, Math.min(100, ((course.completedHours || 0) / (course.totalHours || 1)) * 100))} 
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      {isNaN(Number(((course.completedHours || 0) / (course.totalHours || 1)) * 100)) ? 0 : Math.round(Math.max(0, Math.min(100, ((course.completedHours || 0) / (course.totalHours || 1)) * 100)))}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(course.status)} 
                    color={getStatusColor(course.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEditCourse(course)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MenuBook />}
                      onClick={() => handleOpenResourceDialog(course)}
                      color="primary"
                    >
                      资源管理
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteCourse(course.id)}
                      color="error"
                    >
                      删除
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 编辑对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          编辑课程
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
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 资源管理对话框 - 已移除，改为跳转到新页面 */}

    </Box>
  );
};

export default TeacherCourseManagement;