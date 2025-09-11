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
  Tabs,
  Tab,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentAPI, questionAPI, chapterAPI, knowledgePointAPI } from '../../services/api';


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
  questions?: Question[]; // 添加题目列表
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

// 添加题目接口
interface Question {
  id: string;
  title: string;
  content: string;
  type: string;
  difficulty: string;
  points: number;
  selected?: boolean; // 用于标记是否选中
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const AssignmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = '';

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
    questions: [] as string[], // 存储选中的题目ID
  });

  // 添加题目相关的状态
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  
  // 添加缺少的函数
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 获取URL中的课程ID
  const urlParams = new URLSearchParams(window.location.search);
  const courseIdFromUrl = urlParams.get('course');

  useEffect(() => {
    fetchAssignments();
    // 修复：确保在组件加载时获取章节和知识点数据
    fetchChapters();
  }, []);

  // 当章节改变时，过滤知识点
  useEffect(() => {
    if (formData.chapterId) {
      const filtered = knowledgePoints.filter(kp => kp.chapterId === formData.chapterId);
      setFilteredKnowledgePoints(filtered);
      // 如果当前选中的知识点不在新的章节中，则清空知识点选择
      if (formData.knowledgePointId && !filtered.some(kp => kp.id === formData.knowledgePointId)) {
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
      // 修复：传递课程ID参数以获取特定课程的作业
      const response = await assignmentAPI.getAssignments({ courseId: courseIdFromUrl || undefined });
      
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
        status: assignment.status || 'draft',
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
      console.log('Fetching chapters for course:', courseIdFromUrl);
      // 修复：确保正确传递课程ID参数
      const response = await chapterAPI.getChapters(courseIdFromUrl || undefined, 'published');
      console.log('Chapters response:', response);
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      setChapters(chaptersData);
      
      // 同时获取所有知识点
      // 修复：确保正确传递课程ID参数
      const kpResponse = await knowledgePointAPI.getKnowledgePoints({ courseId: courseIdFromUrl || undefined });
      console.log('Knowledge points response:', kpResponse);
      const kpData = kpResponse.data || kpResponse;
      const knowledgePointsData = Array.isArray(kpData) ? kpData : kpData.knowledgePoints || [];
      setKnowledgePoints(knowledgePointsData);
      
      // 如果已经有选中的章节，需要更新知识点过滤
      if (formData.chapterId) {
        const filtered = knowledgePointsData.filter(kp => kp.chapterId === formData.chapterId);
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
      courseId: courseIdFromUrl || '',
      chapterId: '',
      knowledgePointId: '',
      questions: [],
    });
    setSelectedQuestions([]);
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
      courseId: assignment.course?.id || courseIdFromUrl || '',
      chapterId: chapterId,
      knowledgePointId: assignment.knowledgePoint?.id || '',
      questions: assignment.questions?.map(q => q.id) || [],
    });
    setSelectedQuestions(assignment.questions?.map(q => q.id) || []);
    setCreateDialogOpen(true);
    // 修复：每次打开编辑对话框时重新获取章节数据和题目数据
    fetchChapters();
    fetchQuestions(); // 确保题目数据已加载
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
      // 调用实际的API获取题目列表
      const response = await questionAPI.getQuestions();
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
        questionIds: formData.questions,
        totalPoints: formData.totalScore
        // 注意：编辑时不要强制设置状态为DRAFT，保留原有状态
      };

      // 移除undefined值
      Object.keys(assignmentData).forEach(key => {
        if (assignmentData[key] === undefined) {
          delete assignmentData[key];
        }
      });

      // 如果是编辑作业且没有修改题目，则不传递questionIds字段
      if (editingAssignment && (!assignmentData.questionIds || assignmentData.questionIds.length === 0)) {
        delete assignmentData.questionIds;
      }

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

  const toggleRowExpand = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  // 添加题目选择相关的函数
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAllQuestions = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const handleAddQuestions = () => {
    setFormData(prev => ({
      ...prev,
      questions: selectedQuestions,
    }));
    setShowQuestionSelector(false);
  };

  const handleRemoveQuestion = (questionId: string) => {
    const newSelectedQuestions = selectedQuestions.filter(id => id !== questionId);
    setSelectedQuestions(newSelectedQuestions);
    setFormData(prev => ({
      ...prev,
      questions: newSelectedQuestions,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'info';
      case 'grading': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="全部作业" />
          <Tab label="作业" />
          <Tab label="测验" />
          <Tab label="考试" />
          <Tab label="项目" />
        </Tabs>
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
              <TableCell>关联关系</TableCell>
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
                          关联资源:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {assignment.id === '1' && (
                            <>
                              <Chip 
                                label="极限练习题" 
                                color="primary" 
                                variant="outlined"
                                size="small"
                              />
                              <Chip 
                                label="极限概念PPT" 
                                color="secondary" 
                                variant="outlined"
                                size="small"
                              />
                            </>
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
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="总分"
                    type="number"
                    value={formData.totalScore}
                    onChange={(e) => handleFormChange('totalScore', parseInt(e.target.value))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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

            {/* 题目选择部分 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                题目设置
              </Typography>
              
              <Button 
                variant="outlined" 
                startIcon={<Link />}
                onClick={() => {
                  fetchQuestions();
                  setShowQuestionSelector(true);
                }}
                sx={{ mb: 2 }}
              >
                从题库选择题目
              </Button>
              
              {/* 已选择的题目列表 */}
              {selectedQuestions.length > 0 && (
                <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.light' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>题目</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>类型</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>难度</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>分值</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {questions
                        .filter(q => selectedQuestions.includes(q.id))
                        .map((question) => (
                          <TableRow 
                            key={question.id} 
                            sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {question.title}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {question.content}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getTypeLabel(question.type)} 
                                size="small" 
                                color={
                                  question.type === 'single_choice' ? 'primary' :
                                  question.type === 'multiple_choice' ? 'secondary' :
                                  question.type === 'short_answer' ? 'success' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getDifficultyLabel(question.difficulty)} 
                                size="small" 
                                color={
                                  question.difficulty === 'easy' ? 'success' :
                                  question.difficulty === 'medium' ? 'warning' :
                                  question.difficulty === 'hard' ? 'error' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>{question.points}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveQuestion(question.id)}
                                color="error"
                                sx={{ '&:hover': { backgroundColor: 'error.light', color: 'white' } }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {selectedQuestions.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center', p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                  尚未选择任何题目，请点击"从题库选择题目"按钮添加题目
                </Typography>
              )}
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

      {/* 题目选择对话框 */}
      <Dialog 
        open={showQuestionSelector} 
        onClose={() => setShowQuestionSelector(false)} 
        maxWidth="lg" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ pb: 1, backgroundColor: 'primary.main', color: 'white' }}>
          选择题目
          <TextField
            placeholder="搜索题目..."
            value={questionSearchTerm}
            onChange={(e) => setQuestionSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'white' }} />,
            }}
            sx={{ mt: 2, backgroundColor: 'white', borderRadius: 1 }}
            fullWidth
          />
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell padding="checkbox" sx={{ backgroundColor: 'primary.light' }}>
                    <IconButton 
                      size="small" 
                      onClick={handleSelectAllQuestions}
                      sx={{ color: 'white' }}
                    >
                      {selectedQuestions.length === questions.length && questions.length > 0 ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'primary.light', color: 'white', fontWeight: 'bold' }}>题目</TableCell>
                  <TableCell sx={{ backgroundColor: 'primary.light', color: 'white', fontWeight: 'bold' }}>类型</TableCell>
                  <TableCell sx={{ backgroundColor: 'primary.light', color: 'white', fontWeight: 'bold' }}>难度</TableCell>
                  <TableCell sx={{ backgroundColor: 'primary.light', color: 'white', fontWeight: 'bold' }}>分值</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions
                  .filter(q => 
                    q.title.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                    q.content.toLowerCase().includes(questionSearchTerm.toLowerCase())
                  )
                  .map((question) => (
                    <TableRow 
                      key={question.id} 
                      selected={selectedQuestions.includes(question.id)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&.Mui-selected': { backgroundColor: 'primary.light' }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuestionSelect(question.id)}
                          sx={{ 
                            backgroundColor: selectedQuestions.includes(question.id) ? 'primary.main' : 'transparent',
                            color: selectedQuestions.includes(question.id) ? 'white' : 'inherit',
                            '&:hover': { 
                              backgroundColor: selectedQuestions.includes(question.id) ? 'primary.dark' : 'action.hover' 
                            }
                          }}
                        >
                          {selectedQuestions.includes(question.id) ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {question.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {question.content}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTypeLabel(question.type)} 
                          size="small" 
                          color={
                            question.type === 'single_choice' ? 'primary' :
                            question.type === 'multiple_choice' ? 'secondary' :
                            question.type === 'short_answer' ? 'success' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getDifficultyLabel(question.difficulty)} 
                          size="small" 
                          color={
                            question.difficulty === 'easy' ? 'success' :
                            question.difficulty === 'medium' ? 'warning' :
                            question.difficulty === 'hard' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={question.points} 
                          size="small" 
                          color="info"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: 'background.default' }}>
          <Button 
            onClick={() => setShowQuestionSelector(false)} 
            variant="outlined"
          >
            取消
          </Button>
          <Button 
            onClick={handleAddQuestions} 
            variant="contained"
            disabled={selectedQuestions.length === 0}
            sx={{ minWidth: 150 }}
          >
            添加选中的题目 ({selectedQuestions.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentManagement;