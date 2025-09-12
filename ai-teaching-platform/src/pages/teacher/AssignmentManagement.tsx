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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Link,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  Send,
  Cancel,
  Assignment,
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // 添加章节和知识点状态
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [filteredKnowledgePoints, setFilteredKnowledgePoints] = useState<KnowledgePoint[]>([]);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
      if (response.success) {
        // 如果后端返回的是带success字段的对象
        assignmentsData = Array.isArray(response.data.assignments) 
          ? response.data.assignments 
          : response.data;
      } else {
        // 如果后端直接返回数组或对象
        assignmentsData = Array.isArray(response) 
          ? response 
          : response.assignments || [];
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
        status: assignment.status?.toLowerCase() || 'draft', // 确保状态是小写
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
      type: 'homework',
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
    
    setFormData({
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
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

  // 添加获取题目列表的函数
  const fetchQuestions = async () => {
    try {
      // 调用实际的API获取题目列表，传递课程ID
      const response = await questionAPI.getQuestions({ courseId });
      const data = response.data || response;
      setQuestions(Array.isArray(data) ? data : data.questions || []);
    } catch (error) {
      console.error('获取题目失败:', error);
      // 如果API调用失败，使用模拟数据
      const mockQuestions: Question[] = [
        {
          id: '1',
          title: '函数极限的基本概念',
          content: '当x趋近于0时，sin(x)/x的极限值是多少？',
          type: 'single_choice',
          difficulty: 'medium',
          points: 5,
        },
        {
          id: '2',
          title: '导数计算',
          content: '求函数f(x) = x^2的导数',
          type: 'short_answer',
          difficulty: 'easy',
          points: 3,
        },
        {
          id: '3',
          title: '积分应用',
          content: '计算定积分∫(0 to 1) x^2 dx',
          type: 'short_answer',
          difficulty: 'hard',
          points: 8,
        },
      ];
      setQuestions(mockQuestions);
    }
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
    } catch (error) {
      console.error('删除作业失败:', error);
      setError('删除作业失败，请稍后重试');
    }
  };

  // 添加发布作业的函数
  const handlePublish = async (id: string) => {
    try {
      // 更新作业状态为PUBLISHED（与数据库保持一致）
      await assignmentAPI.updateAssignment(id, { status: 'PUBLISHED' });
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
      // 更新作业状态为DRAFT（与数据库保持一致）
      await assignmentAPI.updateAssignment(id, { status: 'DRAFT' });
      // 重新获取作业列表以更新状态
      fetchAssignments();
    } catch (error) {
      console.error('取消发布作业失败:', error);
      setError('取消发布作业失败，请稍后重试');
    }
  };

  const toggleRowExpand = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
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
    switch (type) {
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
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/teacher/courses')} 
          sx={{ mr: 2 }}
          title="返回我的课程"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          作业管理
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索作业..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ flex: 1 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>类型</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            label="类型"
          >
            <MenuItem value="">全部类型</MenuItem>
            <MenuItem value="homework">作业</MenuItem>
            <MenuItem value="quiz">测验</MenuItem>
            <MenuItem value="exam">考试</MenuItem>
            <MenuItem value="project">项目</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          创建作业
        </Button>

      </Box>

      {/* 作业列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>作业名称</TableCell>
              <TableCell>所属课程</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>难度</TableCell>
              <TableCell>总分</TableCell>
              <TableCell>及格分</TableCell>
              <TableCell>时间限制</TableCell>
              <TableCell>开始时间</TableCell>
              <TableCell>结束时间</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>提交人数</TableCell>
              <TableCell>平均分数</TableCell>
              <TableCell>及格率</TableCell>
              <TableCell>关联知识点</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} align="center">
                  <Typography variant="body2" color="text.secondary">
                    暂无作业数据
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAssignments.map((assignment) => (
                <React.Fragment key={assignment.id}>
                  <TableRow>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {assignment.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {assignment.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{assignment.course?.title || '未知课程'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeLabel(assignment.type)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDifficultyLabel(assignment.difficulty)}
                        color={getDifficultyColor(assignment.difficulty) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{assignment.totalScore}</TableCell>
                    <TableCell>{assignment.passingScore}</TableCell>
                    <TableCell>{formatDuration(assignment.timeLimit)}</TableCell>
                    <TableCell>{formatDateTime(assignment.startTime)}</TableCell>
                    <TableCell>{formatDateTime(assignment.endTime)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(assignment.status)}
                        color={getStatusColor(assignment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{assignment.statistics?.totalSubmissions || 0}</TableCell>
                    <TableCell>{assignment.statistics?.averageScore || 0}</TableCell>
                    <TableCell>{assignment.statistics?.passRate || 0}%</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleRowExpand(assignment.id)}
                        color={expandedRows.has(assignment.id) ? 'primary' : 'default'}
                      >
                        {expandedRows.has(assignment.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        size="small"
                        onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignment.id}/questions`)}
                        title="组卷"
                      >
                        <Link />
                      </IconButton>
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignment.id}/grading`)}
                        title="批改作业"
                      >
                        <Assignment />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(assignment.id) && (
                    <TableRow>
                      <TableCell colSpan={15} sx={{ backgroundColor: 'action.hover', p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          关联知识点:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {assignment.knowledgePoint && (
                            <Chip 
                              label={assignment.knowledgePoint.title}
                              color="secondary" 
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>



      {/* 创建/编辑作业对话框 */}
      <Dialog open={createDialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          {editingAssignment ? '编辑作业' : '创建作业'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* 基本信息部分 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                基本信息
              </Typography>
              
              <TextField
                label="作业名称"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="作业描述"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
            
            {/* 类型和难度设置 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                类型和难度
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>作业类型</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      label="作业类型"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="homework">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="easy">
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
            </Box>
            
            {/* 作业状态设置 */}
            <Box sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                作业状态
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>状态</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  label="状态"
                >
                  <MenuItem value="draft">草稿</MenuItem>
                  <MenuItem value="published">已发布</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                选择"已发布"状态可立即发布作业给学生，选择"草稿"状态可保存为草稿
              </Typography>
            </Box>
            
            {/* 分数设置 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                分数设置
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="总分"
                    type="number"
                    value={formData.totalScore}
                    onChange={(e) => handleFormChange('totalScore', parseInt(e.target.value))}
                    fullWidth
                    required
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
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* 时间设置 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                时间设置
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="时间限制(分钟)"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => handleFormChange('timeLimit', parseInt(e.target.value))}
                    fullWidth
                    required
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
                    InputLabelProps={{
                      shrink: true,
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
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!formData.endTime}
                    helperText={!formData.endTime ? '结束时间为必填项' : ''}
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* 关联设置 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                关联设置
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>章节 *</InputLabel>
                    <Select
                      value={formData.chapterId}
                      onChange={(e) => handleFormChange('chapterId', e.target.value)}
                      label="章节 *"
                      error={!formData.chapterId}
                    >
                      <MenuItem value="">
                        <em>请选择章节</em>
                      </MenuItem>
                      {chapters.map((chapter) => (
                        <MenuItem key={chapter.id} value={chapter.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                    >
                      <MenuItem value="">
                        <em>请选择知识点</em>
                      </MenuItem>
                      {filteredKnowledgePoints.map((kp) => (
                        <MenuItem key={kp.id} value={kp.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: 'background.default' }}>
          <Button onClick={handleDialogClose} variant="outlined">
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.title || !formData.type || !formData.startTime || !formData.endTime || !formData.chapterId || !formData.knowledgePointId}
            sx={{ minWidth: 100 }}
          >
            {editingAssignment ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentManagement;
