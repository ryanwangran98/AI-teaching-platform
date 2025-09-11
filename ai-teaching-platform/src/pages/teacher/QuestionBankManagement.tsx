import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Link,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { questionAPI, chapterAPI, knowledgePointAPI } from '../../services/api';


interface Question {
  id: string;
  title: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  knowledgePointId: string;
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  estimatedTime: number;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  usageCount: number;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
  knowledgePoint?: {
    id: string;
    title: string;
    chapter: {
      id: string;
      title: string;
    };
  };
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
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const QuestionBankManagement: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState('');

  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [chapters, setChapters] = useState<Array<{id: string, title: string}>>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<Array<{id: string, title: string, chapterId: string}>>([]);
  const [filteredKnowledgePoints, setFilteredKnowledgePoints] = useState<Array<{id: string, title: string, chapterId: string}>>([]);

  
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'single_choice' as 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    points: 1,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    selectedChapterId: '',
    knowledgePointId: ''
  });

  useEffect(() => {
    fetchQuestions();
    fetchChapters();
    fetchKnowledgePoints();

  }, []);



  const fetchChapters = async () => {
    try {
      const response = await chapterAPI.getChapters(undefined, 'all');
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      
      const mappedChapters = chaptersData.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title || chapter.name || '未知章节'
      }));
      
      setChapters(mappedChapters);
    } catch (error) {
      console.error('获取章节失败:', error);
      // 使用默认章节数据，确保ID格式与后端一致
      setChapters([
        { id: 'chapter1', title: '第一章 函数与极限' },
        { id: 'chapter2', title: '第二章 导数与微分' },
        { id: 'chapter3', title: '第三章 积分学' }
      ]);
    }
  };

  const fetchKnowledgePoints = async () => {
    try {
      const response = await knowledgePointAPI.getKnowledgePoints();
      const data = response.data || response;
      const knowledgePointsData = Array.isArray(data) ? data : data.knowledgePoints || [];
      
      const mappedKnowledgePoints = knowledgePointsData.map((kp: any) => ({
        id: kp.id,
        title: kp.title || kp.name || '未知知识点',
        chapterId: kp.chapterId || ''
      }));
      
      setKnowledgePoints(mappedKnowledgePoints);
      setFilteredKnowledgePoints(mappedKnowledgePoints);
    } catch (error) {
      console.error('获取知识点失败:', error);
      // 使用默认知识点数据，确保ID格式与后端一致
      const defaultKnowledgePoints = [
        { id: 'kp1', title: '极限概念', chapterId: 'chapter1' },
        { id: 'kp2', title: '极限运算规则', chapterId: 'chapter1' },
        { id: 'kp3', title: '导数概念', chapterId: 'chapter2' },
        { id: 'kp4', title: '微分中值定理', chapterId: 'chapter2' }
      ];
      setKnowledgePoints(defaultKnowledgePoints);
      setFilteredKnowledgePoints(defaultKnowledgePoints);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getQuestions();
      const data = response.data || response;
      setQuestions(Array.isArray(data) ? data : data.questions || []);
      setError(null);
    } catch (error) {
      console.error('获取题目失败:', error);
      setError('获取题目失败，请稍后重试');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setEditingQuestion(null);
    setCreateForm({
      title: '',
      content: '',
      type: 'single_choice',
      difficulty: 'medium',
      points: 1,
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      selectedChapterId: '',
      knowledgePointId: ''
    });
    setFilteredKnowledgePoints(knowledgePoints);
  };

  const handleCreateSubmit = async () => {
    try {
      // 验证答案格式
      let errorMessage = '';
      
      // 检查必填字段
      if (!createForm.title) {
        errorMessage = '题目标题为必填项';
      } else if (!createForm.content) {
        errorMessage = '题目内容为必填项';
      } else if (!createForm.knowledgePointId) {
        errorMessage = '知识点为必选项';
      }
      
      // 根据题型验证答案格式
      if (!errorMessage) {
        switch (createForm.type) {
          case 'single_choice':
            // 单选题答案应该是A-Z的单个字母
            if (!/^[A-Z]$/.test(createForm.correctAnswer)) {
              errorMessage = '单选题的正确答案应为单个大写字母（如：A、B、C等）';
            }
            break;
          case 'multiple_choice':
            // 多选题答案应该是A-Z字母的组合，用逗号分隔
            if (!/^[A-Z](,[A-Z])*$/.test(createForm.correctAnswer)) {
              errorMessage = '多选题的正确答案应为大写字母组合，用逗号分隔（如：A,B,C）';
            }
            break;
          case 'true_false':
            // 判断题答案应该是"正确"或"错误"
            if (createForm.correctAnswer !== '正确' && createForm.correctAnswer !== '错误') {
              errorMessage = '判断题的正确答案应为"正确"或"错误"';
            }
            break;
          case 'fill_blank':
            // 填空题答案不能为空
            if (!createForm.correctAnswer || createForm.correctAnswer.trim() === '') {
              errorMessage = '填空题的正确答案不能为空';
            }
            break;
          case 'short_answer':
          case 'essay':
            // 简答题和论述题答案不能为空
            if (!createForm.correctAnswer || createForm.correctAnswer.trim() === '') {
              errorMessage = '简答题和论述题的正确答案不能为空';
            }
            break;
          default:
            if (!createForm.correctAnswer) {
              errorMessage = '正确答案为必填项';
            }
        }
      }
      
      // 检查选择题选项
      if ((createForm.type === 'single_choice' || createForm.type === 'multiple_choice') && 
          (!Array.isArray(createForm.options) || createForm.options.length === 0)) {
        errorMessage = '选择题至少需要一个选项';
      }
      
      // 如果有错误信息，显示错误并返回
      if (errorMessage) {
        setError(errorMessage);
        return;
      }

      const newQuestion = {
        title: createForm.title,
        content: createForm.content,
        type: createForm.type,
        difficulty: createForm.difficulty,
        points: createForm.points,
        options: createForm.type === 'single_choice' || createForm.type === 'multiple_choice' 
          ? (Array.isArray(createForm.options) ? createForm.options.filter(o => o && o.trim() !== '') : [])
          : undefined,
        correctAnswer: createForm.correctAnswer,
        explanation: createForm.explanation,
        knowledgePointId: createForm.knowledgePointId
      };

      if (editingQuestion) {
        await questionAPI.updateQuestion(editingQuestion.id, newQuestion);
      } else {
        await questionAPI.createQuestion(newQuestion);
      }
      setCreateDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error(editingQuestion ? '更新题目失败:' : '创建题目失败:', error);
      setError(editingQuestion ? '更新题目失败，请稍后重试' : '创建题目失败，请稍后重试');
    }
  };

  const handleEdit = useCallback((question: Question) => {
    setEditingQuestion(question);
    
    // 获取题目的章节ID（从知识点中获取）
    const selectedChapterId = question.knowledgePoint?.chapter?.id || '';
    
    // 初始化选项数组
    let options = ['', '', '', ''];
    if (question.options && Array.isArray(question.options)) {
      options = [...question.options];
      // 确保至少有4个选项
      while (options.length < 4) {
        options.push('');
      }
    }
    
    setCreateForm({
      title: question.title,
      content: question.content,
      type: question.type,
      difficulty: question.difficulty,
      points: question.points,
      options: options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      selectedChapterId: selectedChapterId,
      knowledgePointId: question.knowledgePointId || ''
    });
    
    // 设置章节后筛选知识点
    if (selectedChapterId) {
      const filtered = knowledgePoints.filter(kp => kp.chapterId === selectedChapterId);
      setFilteredKnowledgePoints(filtered);
    } else {
      // 如果没有章节信息，尝试从知识点列表中查找
      const currentKnowledgePoint = knowledgePoints.find(kp => kp.id === question.knowledgePointId);
      if (currentKnowledgePoint && currentKnowledgePoint.chapterId) {
        const filtered = knowledgePoints.filter(kp => kp.chapterId === currentKnowledgePoint.chapterId);
        setFilteredKnowledgePoints(filtered);
        // 更新表单中的章节ID
        setCreateForm(prev => ({
          ...prev,
          selectedChapterId: currentKnowledgePoint.chapterId
        }));
      } else {
        setFilteredKnowledgePoints(knowledgePoints);
      }
    }
    
    setCreateDialogOpen(true);
  }, [knowledgePoints]);

  const handleCreateFormChange = (field: string, value: any) => {
    setCreateForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // 当切换题型时，确保options字段正确初始化
      if (field === 'type' && (value === 'single_choice' || value === 'multiple_choice')) {
        if (!Array.isArray(newForm.options) || newForm.options.length === 0) {
          newForm.options = ['', '', '', ''];
        }
        // 清空之前的选择题答案
        newForm.correctAnswer = '';
      }
      
      // 当选择章节时，筛选知识点并清空当前选中的知识点
      if (field === 'selectedChapterId') {
        if (value) {
          const filtered = knowledgePoints.filter(kp => kp.chapterId === value);
          setFilteredKnowledgePoints(filtered);
        } else {
          setFilteredKnowledgePoints(knowledgePoints);
        }
        newForm.knowledgePointId = ''; // 清空知识点选择
      }
      
      // 当选项发生变化时，检查正确答案是否仍然有效
      if (field === 'options' && Array.isArray(value)) {
        // 对于单选题和多选题，检查正确答案是否仍然有效
        if (newForm.type === 'single_choice') {
          // 单选题答案应该是A-Z的单个字母，且对应选项存在且不为空
          const answerIndex = newForm.correctAnswer.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1, ...
          if (answerIndex >= 0 && answerIndex < value.length && value[answerIndex]) {
            // 答案仍然有效，不需要更改
          } else {
            // 答案不再有效，清空答案
            newForm.correctAnswer = '';
          }
        } else if (newForm.type === 'multiple_choice') {
          // 多选题答案应该是A-Z字母的组合，用逗号分隔
          const answers = newForm.correctAnswer.split(',');
          const validAnswers = answers.filter(answer => {
            const answerIndex = answer.charCodeAt(0) - 65;
            return answerIndex >= 0 && answerIndex < value.length && value[answerIndex];
          });
          if (validAnswers.length !== answers.length) {
            // 有些答案不再有效，更新答案
            newForm.correctAnswer = validAnswers.join(',');
          }
        }
      }
      
      return newForm;
    });
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await questionAPI.deleteQuestion(id);
      setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
    } catch (error) {
      console.error('删除题目失败:', error);
      setError('删除题目失败，请稍后重试');
    }
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single_choice': return '单选题';
      case 'multiple_choice': return '多选题';
      case 'true_false': return '判断题';
      case 'fill_blank': return '填空题';
      case 'short_answer': return '简答题';
      case 'essay': return '论述题';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single_choice': return 'primary';
      case 'multiple_choice': return 'secondary';
      case 'true_false': return 'success';
      case 'fill_blank': return 'warning';
      case 'short_answer': return 'info';
      case 'essay': return 'error';
      default: return 'default';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'success';
      case 'archived': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || question.type === selectedType;
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty;
    const matchesChapter = !selectedChapter || question.knowledgePoint?.chapter?.id === selectedChapter;
    const matchesKnowledgePoint = !selectedKnowledgePoint || question.knowledgePointId === selectedKnowledgePoint;
    return matchesSearch && matchesType && matchesDifficulty && matchesChapter && matchesKnowledgePoint;
  });

  // 修改getQuestionsByType函数，使用useMemo优化
  const getQuestionsByType = useCallback((type: string) => {
    if (type === 'all') {
      return filteredQuestions;
    }
    return filteredQuestions.filter(q => q.type === type);
  }, [filteredQuestions]);
  
  // 同时修改questionTypes的计算方式
  const questionTypes = useMemo(() => [
    { type: 'single_choice', label: '单选题', count: getQuestionsByType('single_choice').length },
    { type: 'multiple_choice', label: '多选题', count: getQuestionsByType('multiple_choice').length },
    { type: 'true_false', label: '判断题', count: getQuestionsByType('true_false').length },
    { type: 'fill_blank', label: '填空题', count: getQuestionsByType('fill_blank').length },
    { type: 'short_answer', label: '简答题', count: getQuestionsByType('short_answer').length },
    { type: 'essay', label: '论述题', count: getQuestionsByType('essay').length },
  ], [getQuestionsByType]);

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
        <Button variant="contained" onClick={fetchQuestions}>
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
          题库管理
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总题数
              </Typography>
              <Typography variant="h4">
                {questions.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                已发布
              </Typography>
              <Typography variant="h4">
                {questions.filter(q => q.status === 'published').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                困难题
              </Typography>
              <Typography variant="h4">
                {questions.filter(q => q.difficulty === 'hard').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总使用次数
              </Typography>
              <Typography variant="h4">
                {questions.reduce((sum, q) => sum + q.usageCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索题目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ flex: 1 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>题型</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            label="题型"
          >
            <MenuItem value="">全部题型</MenuItem>
            <MenuItem value="single_choice">单选题</MenuItem>
            <MenuItem value="multiple_choice">多选题</MenuItem>
            <MenuItem value="true_false">判断题</MenuItem>
            <MenuItem value="fill_blank">填空题</MenuItem>
            <MenuItem value="short_answer">简答题</MenuItem>
            <MenuItem value="essay">论述题</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>难度</InputLabel>
          <Select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            label="难度"
          >
            <MenuItem value="">全部难度</MenuItem>
            <MenuItem value="easy">简单</MenuItem>
            <MenuItem value="medium">中等</MenuItem>
            <MenuItem value="hard">困难</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>章节</InputLabel>
          <Select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            label="章节"
          >
            <MenuItem value="">全部章节</MenuItem>
            <MenuItem value="1">第一章 函数与极限</MenuItem>
            <MenuItem value="2">第二章 导数与微分</MenuItem>
            <MenuItem value="3">第三章 积分学</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          创建题目
        </Button>

      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="题目类型标签页">
          <Tab label={`全部 (${questions.length})`} {...a11yProps(0)} />
          {questionTypes.map((type, index) => (
            <Tab 
              key={type.type} 
              label={`${type.label} (${type.count})`} 
              {...a11yProps(index + 1)} 
            />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>题目标题</TableCell>
                <TableCell>题型</TableCell>
                <TableCell>难度</TableCell>
                <TableCell>所属章节</TableCell>
                <TableCell>关联知识点</TableCell>
                <TableCell>分值</TableCell>
                <TableCell>预估时间</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>使用次数</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>更新时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Typography variant="body2" color="text.secondary">
                      暂无题目数据
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {question.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                          {question.content}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeLabel(question.type)}
                        color={getTypeColor(question.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDifficultyLabel(question.difficulty)}
                        color={getDifficultyColor(question.difficulty) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{question.knowledgePoint?.chapter?.title || '-'}</TableCell>
                    <TableCell>{question.knowledgePoint?.title || '-'}</TableCell>
                    <TableCell>{question.points}</TableCell>
                    <TableCell>{question.estimatedTime}分钟</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(question.status)}
                        color={getStatusColor(question.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{question.usageCount}</TableCell>
                    <TableCell>
                      {new Date(question.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {new Date(question.updatedAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleEdit(question)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(question.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {questionTypes.map((type, index) => (
        <TabPanel key={type.type} value={tabValue} index={index + 1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>题目标题</TableCell>
                  <TableCell>题型</TableCell>
                  <TableCell>难度</TableCell>
                  <TableCell>所属章节</TableCell>
                  <TableCell>关联知识点</TableCell>
                  <TableCell>分值</TableCell>
                  <TableCell>预估时间</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>使用次数</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>更新时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getQuestionsByType(type.type).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      <Typography variant="body2" color="text.secondary">
                        暂无{type.label}数据
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getQuestionsByType(type.type).map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {question.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                            {question.content}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTypeLabel(question.type)}
                          color={getTypeColor(question.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getDifficultyLabel(question.difficulty)}
                          color={getDifficultyColor(question.difficulty) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{question.knowledgePoint?.chapter?.title || '-'}</TableCell>
                      <TableCell>{question.knowledgePoint?.title || '-'}</TableCell>
                      <TableCell>{question.points}</TableCell>
                      <TableCell>{question.estimatedTime}分钟</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(question.status)}
                          color={getStatusColor(question.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{question.usageCount}</TableCell>
                      <TableCell>
                        {new Date(question.createdAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        {new Date(question.updatedAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <IconButton color="primary" size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      ))}



      {/* 创建题目对话框 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCreateDialogClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Add sx={{ fontSize: 24 }} />
          {editingQuestion ? '编辑题目' : '创建新题目'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 1 }}>
            {/* 基础信息区域 */}
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
              基础信息
            </Typography>
            
            <TextField
              fullWidth
              label="题目标题"
              placeholder="请输入题目标题"
              value={createForm.title}
              onChange={(e) => handleCreateFormChange('title', e.target.value)}
              required
              error={!createForm.title}
              helperText={!createForm.title ? '题目标题为必填项' : ''}
              sx={{
                mb: 2,
                '& .MuiInputLabel-asterisk': {
                  color: 'error.main'
                }
              }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="题目内容"
              placeholder="请输入详细的题目内容描述"
              value={createForm.content}
              onChange={(e) => handleCreateFormChange('content', e.target.value)}
              required
              error={!createForm.content}
              helperText={!createForm.content ? '题目内容为必填项' : ''}
              sx={{
                mb: 3,
                '& .MuiInputLabel-asterisk': {
                  color: 'error.main'
                }
              }}
            />

            {/* 题目属性区域 */}
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
              题目属性
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="type-label">题型</InputLabel>
                <Select
                  labelId="type-label"
                  value={createForm.type}
                  onChange={(e) => handleCreateFormChange('type', e.target.value)}
                  label="题型"
                >
                  <MenuItem value="single_choice">单选题</MenuItem>
                  <MenuItem value="multiple_choice">多选题</MenuItem>
                  <MenuItem value="true_false">判断题</MenuItem>
                  <MenuItem value="fill_blank">填空题</MenuItem>
                  <MenuItem value="short_answer">简答题</MenuItem>
                  <MenuItem value="essay">论述题</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="difficulty-label">难度</InputLabel>
                <Select
                  labelId="difficulty-label"
                  value={createForm.difficulty}
                  onChange={(e) => handleCreateFormChange('difficulty', e.target.value)}
                  label="难度"
                >
                  <MenuItem value="easy">简单</MenuItem>
                  <MenuItem value="medium">中等</MenuItem>
                  <MenuItem value="hard">困难</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                sx={{ flex: 1 }}
                type="number"
                label="分值"
                value={createForm.points}
                onChange={(e) => handleCreateFormChange('points', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 100 }}
                helperText="建议分值范围：1-100分"
              />
            </Box>

            {/* 关联信息区域 */}
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
              关联信息
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="chapter-select-label">选择章节</InputLabel>
              <Select
                labelId="chapter-select-label"
                value={createForm.selectedChapterId}
                onChange={(e) => handleCreateFormChange('selectedChapterId', e.target.value)}
                label="选择章节"
              >
                <MenuItem value="">请先选择章节</MenuItem>
                {chapters.map((chapter) => (
                  <MenuItem key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="knowledge-point-label">关联知识点</InputLabel>
              <Select
                labelId="knowledge-point-label"
                value={createForm.knowledgePointId}
                onChange={(e) => handleCreateFormChange('knowledgePointId', e.target.value)}
                label="关联知识点"
                disabled={!createForm.selectedChapterId}
                required
                error={!createForm.knowledgePointId}
              >
                <MenuItem value="">请选择知识点</MenuItem>
                {filteredKnowledgePoints.map((kp) => (
                  <MenuItem key={kp.id} value={kp.id}>
                    {kp.title}
                  </MenuItem>
                ))}
              </Select>
              {!createForm.selectedChapterId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  请先选择章节后再选择知识点
                </Typography>
              )}
              {!createForm.knowledgePointId && createForm.selectedChapterId && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  知识点为必选项
                </Typography>
              )}
            </FormControl>

            {/* 答案设置区域 */}
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
              答案设置
            </Typography>

            {/* 选项设置（只在选择题和多选题时显示） */}
            {(createForm.type === 'single_choice' || createForm.type === 'multiple_choice') && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  选项设置
                </Typography>
                {Array.isArray(createForm.options) && createForm.options.map((option, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    label={`选项 ${String.fromCharCode(65 + index)}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(createForm.options || [])];
                      newOptions[index] = e.target.value;
                      handleCreateFormChange('options', newOptions);
                    }}
                    sx={{ mb: 1.5 }}
                    placeholder={`请输入选项${String.fromCharCode(65 + index)}的内容`}
                  />
                ))}
              </Box>
            )}

            {/* 正确答案输入（根据题型动态显示不同的输入方式） */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                正确答案
              </Typography>
              
              {/* 单选题答案输入 */}
              {createForm.type === 'single_choice' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>请选择正确选项</InputLabel>
                  <Select
                    value={createForm.correctAnswer}
                    onChange={(e) => handleCreateFormChange('correctAnswer', e.target.value)}
                    label="请选择正确选项"
                  >
                    {Array.isArray(createForm.options) && createForm.options.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      return (
                        <MenuItem key={optionLetter} value={optionLetter}>
                          {optionLetter}. {option}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    请选择单选题的正确答案
                  </Typography>
                </FormControl>
              )}
              
              {/* 多选题答案输入 */}
              {createForm.type === 'multiple_choice' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    请选择正确选项（可多选）:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Array.isArray(createForm.options) && createForm.options.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      const isSelected = createForm.correctAnswer.split(',').includes(optionLetter);
                      return (
                        <Chip
                          key={optionLetter}
                          label={`${optionLetter}. ${option}`}
                          onClick={() => {
                            const currentAnswers = createForm.correctAnswer.split(',');
                            if (isSelected) {
                              // 取消选择
                              const newAnswers = currentAnswers.filter(ans => ans !== optionLetter);
                              handleCreateFormChange('correctAnswer', newAnswers.join(','));
                            } else {
                              // 添加选择
                              const newAnswers = [...currentAnswers, optionLetter];
                              handleCreateFormChange('correctAnswer', newAnswers.join(','));
                            }
                          }}
                          color={isSelected ? "primary" : "default"}
                          variant={isSelected ? "filled" : "outlined"}
                          sx={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    点击选项进行多选，正确答案将自动组合（如：A,B,C）
                  </Typography>
                </Box>
              )}
              
              {/* 判断题答案输入 */}
              {createForm.type === 'true_false' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>请选择答案</InputLabel>
                  <Select
                    value={createForm.correctAnswer}
                    onChange={(e) => handleCreateFormChange('correctAnswer', e.target.value)}
                    label="请选择答案"
                  >
                    <MenuItem value="正确">正确</MenuItem>
                    <MenuItem value="错误">错误</MenuItem>
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    请选择判断题的正确答案
                  </Typography>
                </FormControl>
              )}
              
              {/* 填空题、简答题、论述题答案输入 */}
              {(createForm.type === 'fill_blank' || createForm.type === 'short_answer' || createForm.type === 'essay') && (
                <TextField
                  fullWidth
                  multiline={createForm.type !== 'fill_blank'}
                  rows={createForm.type === 'fill_blank' ? 1 : 4}
                  label={createForm.type === 'fill_blank' ? "正确答案" : "参考答案"}
                  placeholder={createForm.type === 'fill_blank' ? "请输入正确答案" : "请输入参考答案"}
                  value={createForm.correctAnswer}
                  onChange={(e) => handleCreateFormChange('correctAnswer', e.target.value)}
                  required
                  error={!createForm.correctAnswer}
                  helperText={!createForm.correctAnswer ? '正确答案为必填项' : ''}
                  sx={{
                    mb: 2,
                    '& .MuiInputLabel-asterisk': {
                      color: 'error.main'
                    }
                  }}
                />
              )}
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="答案解析"
              placeholder="请输入答案解析（可选）"
              value={createForm.explanation}
              onChange={(e) => handleCreateFormChange('explanation', e.target.value)}
              helperText="提供详细的答案解析有助于学生理解"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={handleCreateDialogClose} color="inherit">
            取消
          </Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained" 
            disabled={!createForm.title || !createForm.content || !createForm.correctAnswer || !createForm.knowledgePointId}
            sx={{ minWidth: 120 }}
          >
            {editingQuestion ? '更新题目' : '创建题目'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionBankManagement;