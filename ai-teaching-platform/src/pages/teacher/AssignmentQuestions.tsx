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
  Grid,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Link,
  ArrowBack,
  Check,
  Close,
  PlaylistAdd,
  PlaylistRemove,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { questionAPI, assignmentAPI } from '../../services/api';

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

const AssignmentQuestions: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // 所有题目用于添加到作业
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]); // 用于批量添加题目
  
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    fetchAssignment();
    fetchAssignmentQuestions();
    fetchAllQuestions();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      const response = await assignmentAPI.getAssignment(assignmentId);
      setAssignment(response.data);
    } catch (error) {
      console.error('获取作业信息失败:', error);
      setError('获取作业信息失败，请稍后重试');
    }
  };

  const fetchAssignmentQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getQuestions({ assignmentId });
      const data = response.data || response;
      setQuestions(Array.isArray(data) ? data : data.questions || []);
      setError(null);
    } catch (error) {
      console.error('获取作业题目失败:', error);
      setError('获取作业题目失败，请稍后重试');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    try {
      const response = await questionAPI.getQuestions({ courseId });
      const data = response.data || response;
      setAllQuestions(Array.isArray(data) ? data : data.questions || []);
    } catch (error) {
      console.error('获取所有题目失败:', error);
    }
  };

  const handleAddQuestions = async () => {
    try {
      if (selectedQuestions.length === 0) {
        setError('请选择至少一个题目');
        return;
      }
      
      // 获取当前作业的题目ID列表
      const currentQuestionIds = questions.map(q => q.id);
      const newQuestionIds = [...currentQuestionIds, ...selectedQuestions];
      
      // 更新作业的题目关联
      await assignmentAPI.updateAssignment(assignmentId, {
        questionIds: newQuestionIds
      });
      
      setAddDialogOpen(false);
      setSelectedQuestions([]);
      fetchAssignmentQuestions(); // 重新获取作业题目
    } catch (error) {
      console.error('添加题目失败:', error);
      setError('添加题目失败，请稍后重试');
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    try {
      // 从当前题目列表中移除指定题目
      const newQuestionIds = questions
        .filter(q => q.id !== questionId)
        .map(q => q.id);
      
      // 更新作业的题目关联
      await assignmentAPI.updateAssignment(assignmentId, {
        questionIds: newQuestionIds
      });
      
      fetchAssignmentQuestions(); // 重新获取作业题目
    } catch (error) {
      console.error('移除题目失败:', error);
      setError('移除题目失败，请稍后重试');
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
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
    switch (type.toLowerCase()) {
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

  const filteredAllQuestions = allQuestions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || question.type === selectedType;
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty;
    const matchesChapter = !selectedChapter || question.knowledgePoint?.chapter?.id === selectedChapter;
    // 排除已经添加到作业中的题目
    const notInAssignment = !questions.some(q => q.id === question.id);
    return matchesSearch && matchesType && matchesDifficulty && matchesChapter && notInAssignment;
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
        <Button variant="contained" onClick={fetchAssignmentQuestions}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ mr: 2 }}
          title="返回上一页"
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            作业组卷
          </Typography>
          {assignment && (
            <Typography variant="h6" color="textSecondary">
              {assignment.title}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          已选题目 ({questions.length}题)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          添加题目
        </Button>
      </Box>

      {/* 已选题目表格 */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>题目标题</TableCell>
              <TableCell>题型</TableCell>
              <TableCell>难度</TableCell>
              <TableCell>所属章节</TableCell>
              <TableCell>关联知识点</TableCell>
              <TableCell>分值</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    暂无题目，请点击"添加题目"按钮添加题目
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
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
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => {
                        // 可以添加查看题目详情的功能
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveQuestion(question.id)}
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

      {/* 添加题目对话框 */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          添加题目到作业
        </DialogTitle>
        <DialogContent>
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
          </Box>

          {/* 题目列表 */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < filteredAllQuestions.length}
                      checked={filteredAllQuestions.length > 0 && selectedQuestions.length === filteredAllQuestions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions(filteredAllQuestions.map(q => q.id));
                        } else {
                          setSelectedQuestions([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>题目标题</TableCell>
                  <TableCell>题型</TableCell>
                  <TableCell>难度</TableCell>
                  <TableCell>所属章节</TableCell>
                  <TableCell>关联知识点</TableCell>
                  <TableCell>分值</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAllQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        暂无符合条件的题目
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllQuestions.map((question) => (
                    <TableRow 
                      key={question.id} 
                      selected={selectedQuestions.includes(question.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedQuestions.includes(question.id)}
                          onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                        />
                      </TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            取消
          </Button>
          <Button 
            onClick={handleAddQuestions} 
            variant="contained" 
            disabled={selectedQuestions.length === 0}
          >
            添加题目 ({selectedQuestions.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentQuestions;