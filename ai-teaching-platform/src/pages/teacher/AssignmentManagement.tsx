import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  useTheme,
  Tooltip,
  Avatar,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Link,
  ArrowBack,
  Send,
  Cancel,
  Assignment,
  Assignment as AssignmentIcon,
  School,
  Book,
  Schedule,
  Timer,
  Grade,
  CheckCircle,
  LibraryBooks,
  Quiz,
  TaskAlt,
  Description,
  RateReview,
  Folder,
  FolderOpen,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentAPI, chapterAPI, knowledgePointAPI } from '../../services/api';


interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'homework' | 'quiz' | 'exam' | 'project';
  difficulty: 'easy' | 'medium' | 'hard';
  totalScore: number;
  passingScore: number;
  timeLimit: number;
  startTime: string;
  endTime: string;
  status: 'draft' | 'published' | 'grading' | 'completed';
  course?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
  knowledgePoint?: {
    id: string;
    title: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  statistics?: {
    totalSubmissions: number;
    averageScore: number;
    passRate: number;
  };
  questions?: any[]; // 添加 questions 属性
}

// 添加章节和知识点接口
interface Chapter {
  id: string;
  title: string;
  courseId: string;
  status: string;
  knowledgePoints: KnowledgePoint[];
}

interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  chapterId: string;
}

const AssignmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const courseId = params.courseId as string;
  const theme = useTheme();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // 添加章节和知识点状态
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [filteredKnowledgePoints, setFilteredKnowledgePoints] = useState<KnowledgePoint[]>([]);

  // 添加创建和编辑作业的状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'homework' as 'homework' | 'quiz' | 'exam' | 'project',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    totalScore: 100,
    passingScore: 60,
    timeLimit: 60,
    startTime: '',
    endTime: '',
    courseId: '',
    chapterId: '',
    knowledgePointId: '',
    status: 'draft' as 'draft' | 'published' | 'grading' | 'completed',
  });

  useEffect(() => {
    fetchAssignments();
    // 修复：确保在组件加载时获取章节和知识点数据
    fetchChapters();
  }, []);

  // 当章节改变时，过滤知识点
  useEffect(() => {
    if (formData.chapterId) {
      const filtered = knowledgePoints.filter((kp: KnowledgePoint) => kp.chapterId === formData.chapterId);
      setFilteredKnowledgePoints(filtered);
      // 如果当前选中的知识点不在新的章节中，则清空知识点选择
      if (formData.knowledgePointId && !filtered.some((kp: KnowledgePoint) => kp.id === formData.knowledgePointId)) {
        setFormData(prev => ({ ...prev, knowledgePointId: '' }));
      }
    } else {
      setFilteredKnowledgePoints([]);
      // 修复：当章节未选择时，也清空知识点选择
      if (formData.knowledgePointId) {
        setFormData(prev => ({ ...prev, knowledgePointId: '' }));
      }
    }
  }, [formData.chapterId, knowledgePoints, formData.knowledgePointId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // 添加调试日志
      console.log('Fetching assignments for courseId:', courseId);
      
      // 修复：传递课程ID参数以获取特定课程的作业
      const response = await assignmentAPI.getAssignments({ courseId: courseId || undefined });
      
      // 添加调试日志
      console.log('API response:', response);
      
      // 处理后端返回的数据结构
      let assignmentsData = [];
      if (response && response.success && response.data) {
        // 如果后端返回的是带success字段的对象
        assignmentsData = Array.isArray(response.data.assignments) 
          ? response.data.assignments 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
      } else if (response && Array.isArray(response)) {
        // 如果后端直接返回数组
        assignmentsData = response;
      } else if (response && response.assignments) {
        // 如果后端返回的是带assignments字段的对象
        assignmentsData = Array.isArray(response.assignments) 
          ? response.assignments 
          : [];
      } else {
        // 其他情况，确保是空数组
        assignmentsData = [];
      }
      
      // 添加调试日志
      console.log('Assignments data before transformation:', assignmentsData);
      
      // 转换数据结构以匹配前端接口
      const transformedAssignments = assignmentsData.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        type: assignment.type || 'homework',
        difficulty: 'medium', // 后端数据中没有这个字段，使用默认值
        totalScore: assignment.totalPoints || 100,
        passingScore: Math.floor((assignment.totalPoints || 100) * 0.6),
        timeLimit: assignment.timeLimit || 60,
        startTime: assignment.createdAt || '',
        endTime: assignment.dueDate || '',
        status: assignment.status || 'draft', // 确保状态是小写
        course: assignment.knowledgePoint?.chapter?.course ? {
          id: assignment.knowledgePoint.chapter.course.id,
          title: assignment.knowledgePoint.chapter.course.name || assignment.knowledgePoint.chapter.course.title
        } : undefined,
        chapter: assignment.knowledgePoint?.chapter ? {
          id: assignment.knowledgePoint.chapter.id,
          title: assignment.knowledgePoint.chapter.title
        } : undefined,
        knowledgePoint: assignment.knowledgePoint ? {
          id: assignment.knowledgePoint.id,
          title: assignment.knowledgePoint.title
        } : undefined,
        questions: assignment.questions || []
      }));
      
      // 添加调试日志
      console.log('转换后的作业数据:', transformedAssignments);
      
      setAssignments(transformedAssignments);
      setError(null);
    } catch (error: any) {
      console.error('获取作业失败:', error);
      setError(`获取作业失败: ${error.response?.data?.error || error.message || '请稍后重试'}`);
      setAssignments([]); // 确保是数组
    } finally {
      setLoading(false);
    }
  };

  // 获取章节数据
  const fetchChapters = async () => {
    try {
      console.log('Fetching chapters for course:', courseId);
      // 修复：确保正确传递课程ID参数
      const response = await chapterAPI.getChapters(courseId || undefined, 'published');
      console.log('Chapters response:', response);
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      setChapters(chaptersData);
      
      // 同时获取所有知识点
      // 修复：确保正确传递课程ID参数
      const kpResponse = await knowledgePointAPI.getKnowledgePoints({ courseId: courseId || undefined });
      console.log('Knowledge points response:', kpResponse);
      const kpData = kpResponse.data || kpResponse;
      const knowledgePointsData = Array.isArray(kpData) ? kpData : kpData.knowledgePoints || [];
      setKnowledgePoints(knowledgePointsData);
      
      // 如果已经有选中的章节，需要更新知识点过滤
      if (formData.chapterId) {
        const filtered = knowledgePointsData.filter((kp: KnowledgePoint) => kp.chapterId === formData.chapterId);
        setFilteredKnowledgePoints(filtered);
      }
    } catch (error: any) {
      console.error('获取章节或知识点失败:', error);
      setError(`获取章节或知识点失败: ${error.response?.data?.error || error.message || '请稍后重试'}`);
    }
  };

  const handleCreate = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      type: 'homework', // 确保使用英文小写值
      difficulty: 'medium',
      totalScore: 100,
      passingScore: 60,
      timeLimit: 60,
      startTime: '',
      endTime: '',
      courseId: courseId || '',
      chapterId: '',
      knowledgePointId: '',
      status: 'draft',
    });
    setCreateDialogOpen(true);
    // 修复：每次打开创建对话框时重新获取章节数据
    fetchChapters();
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    // 查找作业关联的知识点对应的章节
    let chapterId = '';
    if (assignment.knowledgePoint?.id) {
      const kp = knowledgePoints.find(k => k.id === assignment.knowledgePoint?.id);
      if (kp) {
        chapterId = kp.chapterId;
      }
    }
    
    // 确保类型值是有效的枚举值
    const validTypes = ['homework', 'quiz', 'exam', 'project'];
    const assignmentType = validTypes.includes(assignment.type) ? assignment.type : 'homework';
    
    setFormData({
      title: assignment.title,
      description: assignment.description,
      type: assignmentType as 'homework' | 'quiz' | 'exam' | 'project',
      difficulty: assignment.difficulty,
      totalScore: assignment.totalScore,
      passingScore: assignment.passingScore,
      timeLimit: assignment.timeLimit,
      startTime: assignment.startTime ? assignment.startTime.slice(0, 16) : '',
      endTime: assignment.endTime ? assignment.endTime.slice(0, 16) : '',
      courseId: assignment.course?.id || courseId || '',
      chapterId: chapterId,
      knowledgePointId: assignment.knowledgePoint?.id || '',
      status: assignment.status || 'draft', // 确保状态被正确设置
    });
    setCreateDialogOpen(true);
    // 修复：每次打开编辑对话框时重新获取章节数据和题目数据
    fetchChapters();
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditingAssignment(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // 检查必填字段
      const missingFields = [];
      if (!formData.title) missingFields.push('作业标题');
      if (!formData.type) missingFields.push('作业类型');
      if (!formData.knowledgePointId) missingFields.push('知识点');
      
      if (missingFields.length > 0) {
        setError(`请填写所有必填字段：${missingFields.join('、')}`);
        return;
      }

      // 构建符合后端API期望的请求体
      const assignmentData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        knowledgePointId: formData.knowledgePointId, // 直接传递知识点ID
        dueDate: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        timeLimit: formData.timeLimit ? Number(formData.timeLimit) : undefined,
        totalPoints: formData.totalScore,
        status: formData.status // 添加状态字段
        // 移除状态字段，让后端设置默认状态
      };

      // 移除undefined值
      Object.keys(assignmentData).forEach(key => {
        if (assignmentData[key] === undefined) {
          delete assignmentData[key];
        }
      });

      console.log('Sending assignment data:', assignmentData);

      let response;
      if (editingAssignment) {
        response = await assignmentAPI.updateAssignment(editingAssignment.id, assignmentData);
      } else {
        response = await assignmentAPI.createAssignment(assignmentData);
      }
      
      // 检查后端返回的数据
      if (response && (response.success === false || response.error)) {
        throw new Error(response.error || '操作失败');
      }

      setCreateDialogOpen(false);
      fetchAssignments();
    } catch (error: any) {
      console.error('保存作业失败:', error);
      setError(`保存作业失败: ${error.response?.data?.error || error.message || '请稍后重试'}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assignmentAPI.deleteAssignment(id);
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('删除作业失败:', error);
      setError(`删除作业失败: ${error.response?.data?.error || error.message || '请稍后重试'}`);
    }
  };

  // 添加发布作业的函数
  const handlePublish = async (id: string) => {
    try {
      // 更新作业状态为published（与数据库保持一致）
      await assignmentAPI.updateAssignment(id, { status: 'published' });
      // 重新获取作业列表以更新状态
      fetchAssignments();
    } catch (error) {
      console.error('发布作业失败:', error);
      setError('发布作业失败，请稍后重试');
    }
  };

  // 添加取消发布作业的函数
  const handleUnpublish = async (id: string) => {
    try {
      // 更新作业状态为draft（与数据库保持一致）
      await assignmentAPI.updateAssignment(id, { status: 'draft' });
      // 重新获取作业列表以更新状态
      fetchAssignments();
    } catch (error) {
      console.error('取消发布作业失败:', error);
      setError('取消发布作业失败，请稍后重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'default';
      case 'published': return 'success'; // 改为绿色表示已发布
      case 'grading': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'grading': return '批改中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'homework': return '作业';
      case 'quiz': return '测验';
      case 'exam': return '考试';
      case 'project': return '项目';
      case 'single_choice': return '单选题';
      case 'multiple_choice': return '多选题';
      case 'short_answer': return '简答题';
      case 'programming': return '编程题';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取作业类型对应的图标
  const getAssignmentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'homework': return <Description />;
      case 'quiz': return <Quiz />;
      case 'exam': return <TaskAlt />;
      case 'project': return <LibraryBooks />;
      default: return <Description />;
    }
  };

  // 获取作业类型对应的颜色
  const getAssignmentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'homework': return theme.palette.primary.main;
      case 'quiz': return theme.palette.secondary.main;
      case 'exam': return theme.palette.error.main;
      case 'project': return theme.palette.success.main;
      default: return theme.palette.primary.main;
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || a.type === selectedType;
    return matchesSearch && matchesType;
  });

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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchAssignments}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和返回按钮 */}
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
          <IconButton 
            onClick={() => navigate('/teacher/courses')} 
            sx={{ 
              mr: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
            title="返回我的课程"
          >
            <ArrowBack color="primary" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ 
              mr: 2, 
              bgcolor: theme.palette.primary.main,
              width: 48,
              height: 48
            }}>
              <AssignmentIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 0, fontWeight: 'bold' }}>
                作业管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理课程作业、测验和考试
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${filteredAssignments.length} 个作业`} 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </CardContent>
      </Card>

      {/* 操作按钮和搜索筛选区域 */}
      <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                placeholder="搜索作业..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search color="action" />,
                  sx: { borderRadius: 2 }
                }}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>类型</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="类型"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">全部类型</MenuItem>
                  <MenuItem value="homework">作业</MenuItem>
                  <MenuItem value="quiz">测验</MenuItem>
                  <MenuItem value="exam">考试</MenuItem>
                  <MenuItem value="project">项目</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: 2,
                  fontWeight: 'bold',
                  px: 3
                }}
              >
                创建作业
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 作业列表 */}
      <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>作业名称</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>所属课程</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>类型</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>难度</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>总分</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>及格分</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>时间限制</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>开始时间</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>结束时间</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>提交人数</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>平均分数</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>及格率</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>关联知识点</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <AssignmentIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="h6" color="text.secondary">
                        暂无作业数据
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        点击"创建作业"按钮创建新的作业
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreate}
                        sx={{ mt: 1 }}
                      >
                        创建作业
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => (
                  <React.Fragment key={assignment.id}>
                    <TableRow 
                      hover
                      sx={{ 
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            mr: 2, 
                            bgcolor: getAssignmentTypeColor(assignment.type),
                            width: 36,
                            height: 36
                          }}>
                            {getAssignmentTypeIcon(assignment.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {assignment.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {assignment.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <School sx={{ mr: 1, color: theme.palette.primary.main }} fontSize="small" />
                          {assignment.course?.title || '未知课程'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTypeLabel(assignment.type)}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getDifficultyLabel(assignment.difficulty)}
                          color={getDifficultyColor(assignment.difficulty) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Grade sx={{ mr: 1, color: theme.palette.success.main }} fontSize="small" />
                          {assignment.totalScore}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ mr: 1, color: theme.palette.warning.main }} fontSize="small" />
                          {assignment.passingScore}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Timer sx={{ mr: 1, color: theme.palette.info.main }} fontSize="small" />
                          {formatDuration(assignment.timeLimit)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Schedule sx={{ mr: 1, color: theme.palette.secondary.main }} fontSize="small" />
                          {formatDateTime(assignment.startTime)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Schedule sx={{ mr: 1, color: theme.palette.error.main }} fontSize="small" />
                          {formatDateTime(assignment.endTime)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(assignment.status)}
                          color={getStatusColor(assignment.status) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{assignment.statistics?.totalSubmissions || 0}</TableCell>
                      <TableCell>{assignment.statistics?.averageScore || 0}</TableCell>
                      <TableCell>{assignment.statistics?.passRate || 0}%</TableCell>
                      <TableCell>
                        {assignment.knowledgePoint ? (
                          <Chip 
                            label={assignment.knowledgePoint.title}
                            color="secondary" 
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            未关联
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button 
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            sx={{ 
                              borderRadius: 1,
                              minWidth: 'auto',
                              px: 1,
                              '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                              } 
                            }}
                          >
                            查看详情
                          </Button>
                          <Button 
                            size="small"
                            variant="outlined"
                            onClick={() => handleEdit(assignment)}
                            startIcon={<Edit />}
                            sx={{ 
                              borderRadius: 1,
                              minWidth: 'auto',
                              px: 1,
                              '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                              } 
                            }}
                          >
                            编辑
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignment.id}/questions`)}
                            startIcon={<Quiz />}
                            sx={{ 
                              borderRadius: 1,
                              minWidth: 'auto',
                              px: 1,
                              '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                              } 
                            }}
                          >
                            组卷
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignment.id}/grading`)}
                            startIcon={<RateReview />}
                            sx={{ 
                              borderRadius: 1,
                              minWidth: 'auto',
                              px: 1,
                              '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                              } 
                            }}
                          >
                            批改作业
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDelete(assignment.id)}
                            startIcon={<Delete />}
                            sx={{ 
                              borderRadius: 1,
                              minWidth: 'auto',
                              px: 1,
                              '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                              } 
                            }}
                          >
                            删除
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>



      {/* 创建/编辑作业对话框 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[10],
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          pt: 3,
          px: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.8)})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Avatar sx={{ 
            mr: 2, 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            width: 48,
            height: 48
          }}>
            <AssignmentIcon sx={{ color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {editingAssignment ? '编辑作业' : '创建作业'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {editingAssignment ? '修改作业信息' : '填写作业基本信息'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* 基本信息部分 */}
            <Card sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              boxShadow: 'none'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.primary.main,
                  width: 32,
                  height: 32
                }}>
                  <Description fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  基本信息
                </Typography>
              </Box>
              
              <TextField
                label="作业名称"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
              
              <TextField
                label="作业描述"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
            </Card>
            
            {/* 类型和难度设置 */}
            <Card sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.secondary.main, 0.02),
              boxShadow: 'none'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.secondary.main,
                  width: 32,
                  height: 32
                }}>
                  <Quiz fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                  类型和难度
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>作业类型</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      label="作业类型"
                      sx={{ minWidth: 120, borderRadius: 2 }}
                    >
                      <MenuItem value="homework">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Description sx={{ mr: 1, color: theme.palette.primary.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="作业">
                            作业
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="quiz">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Quiz sx={{ mr: 1, color: theme.palette.secondary.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="测验">
                            测验
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="exam">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <TaskAlt sx={{ mr: 1, color: theme.palette.error.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="考试">
                            考试
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="project">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <LibraryBooks sx={{ mr: 1, color: theme.palette.success.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="项目">
                            项目
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>难度</InputLabel>
                    <Select
                      value={formData.difficulty}
                      onChange={(e) => handleFormChange('difficulty', e.target.value)}
                      label="难度"
                      sx={{ minWidth: 120, borderRadius: 2 }}
                    >
                      <MenuItem value="easy">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <CheckCircle sx={{ mr: 1, color: theme.palette.success.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="简单">
                            简单
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="medium">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Timer sx={{ mr: 1, color: theme.palette.warning.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="中等">
                            中等
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="hard">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Cancel sx={{ mr: 1, color: theme.palette.error.main }} />
                          <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            width: '100%'
                          }} title="困难">
                            困难
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Card>
            
            {/* 作业状态设置 */}
            <Card sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.info.main, 0.02),
              boxShadow: 'none'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.info.main,
                  width: 32,
                  height: 32
                }}>
                  <Schedule fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                  作业状态
                </Typography>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>状态</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  label="状态"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="draft">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Folder sx={{ mr: 1, color: theme.palette.text.secondary }} />
                      草稿
                    </Box>
                  </MenuItem>
                  <MenuItem value="published">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderOpen sx={{ mr: 1, color: theme.palette.success.main }} />
                      已发布
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                选择"已发布"状态可立即发布作业给学生，选择"草稿"状态可保存为草稿
              </Typography>
            </Card>
            
            {/* 分数设置 */}
            <Card sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.success.main, 0.02),
              boxShadow: 'none'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.success.main,
                  width: 32,
                  height: 32
                }}>
                  <Grade fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  分数设置
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="总分"
                    type="number"
                    value={formData.totalScore}
                    onChange={(e) => handleFormChange('totalScore', parseInt(e.target.value))}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="及格分"
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => handleFormChange('passingScore', parseInt(e.target.value))}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Grid>
              </Grid>
            </Card>
            
            {/* 时间设置 */}
            <Card sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.warning.main, 0.02),
              boxShadow: 'none'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.warning.main,
                  width: 32,
                  height: 32
                }}>
                  <Timer fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                  时间设置
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="时间限制(分钟)"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => handleFormChange('timeLimit', parseInt(e.target.value))}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="开始时间"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleFormChange('startTime', e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                    error={!formData.startTime}
                    helperText={!formData.startTime ? '开始时间为必填项' : ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="结束时间"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleFormChange('endTime', e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
                    error={!formData.endTime}
                    helperText={!formData.endTime ? '结束时间为必填项' : ''}
                  />
                </Grid>
              </Grid>
            </Card>
            
            {/* 关联设置 */}
            <Card sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.error.main, 0.02),
              boxShadow: 'none'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  mr: 1.5, 
                  bgcolor: theme.palette.error.main,
                  width: 32,
                  height: 32
                }}>
                  <Book fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                  关联设置
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>章节 *</InputLabel>
                    <Select
                      value={formData.chapterId}
                      onChange={(e) => handleFormChange('chapterId', e.target.value)}
                      label="章节 *"
                      error={!formData.chapterId}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">
                        <em>请选择章节</em>
                      </MenuItem>
                      {chapters.map((chapter) => (
                        <MenuItem key={chapter.id} value={chapter.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Folder sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              maxWidth: '100%',
                              width: '100%'
                            }} title={chapter.title}>
                              {chapter.title}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {!formData.chapterId && (
                      <Typography variant="caption" color="error">
                        章节为必选项
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required disabled={!formData.chapterId}>
                    <InputLabel>知识点 *</InputLabel>
                    <Select
                      value={formData.knowledgePointId}
                      onChange={(e) => handleFormChange('knowledgePointId', e.target.value)}
                      label="知识点 *"
                      error={!formData.knowledgePointId}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">
                        <em>请选择知识点</em>
                      </MenuItem>
                      {filteredKnowledgePoints.map((kp) => (
                        <MenuItem key={kp.id} value={kp.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <FolderOpen sx={{ mr: 1, color: theme.palette.secondary.main }} />
                            <Typography sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              maxWidth: '100%',
                              width: '100%'
                            }} title={kp.title}>
                              {kp.title}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {!formData.knowledgePointId && (
                      <Typography variant="caption" color="error">
                        知识点为必选项
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Card>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
          <Button 
            onClick={handleDialogClose} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.title || !formData.type || !formData.startTime || !formData.endTime || !formData.chapterId || !formData.knowledgePointId}
            sx={{ 
              borderRadius: 2,
              boxShadow: 2,
              fontWeight: 'bold',
              px: 3
            }}
          >
            {editingAssignment ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentManagement;
