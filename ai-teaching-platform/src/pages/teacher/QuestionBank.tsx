import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
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
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';
import {
  Search,
  ArrowBack,
  ExpandMore,
  ExpandLess,
  Delete,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { questionAPI, chapterAPI, knowledgePointAPI, assignmentAPI } from '../../services/api';

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
  knowledgePointId?: string; // 添加知识点ID属性
  selected?: boolean; // 用于标记是否选中
}

const QuestionBank: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 添加章节和知识点状态
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [filteredKnowledgePoints, setFilteredKnowledgePoints] = useState<KnowledgePoint[]>([]);

  // 添加题目相关的状态
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedKnowledgePointId, setSelectedKnowledgePointId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    fetchChapters();
    fetchQuestions();
  }, []);

  // 当章节改变时，过滤知识点
  useEffect(() => {
    if (selectedChapterId) {
      const filtered = knowledgePoints.filter((kp: KnowledgePoint) => kp.chapterId === selectedChapterId);
      setFilteredKnowledgePoints(filtered);
      // 如果当前选中的知识点不在新的章节中，则清空知识点选择
      if (selectedKnowledgePointId && !filtered.some((kp: KnowledgePoint) => kp.id === selectedKnowledgePointId)) {
        setSelectedKnowledgePointId('');
      }
    } else {
      setFilteredKnowledgePoints([]);
      // 当章节未选择时，也清空知识点选择
      setSelectedKnowledgePointId('');
    }
  }, [selectedChapterId, knowledgePoints, selectedKnowledgePointId]);

  // 获取章节数据
  const fetchChapters = async () => {
    try {
      console.log('Fetching chapters for course:', courseId);
      // 确保正确传递课程ID参数
      const response = await chapterAPI.getChapters(courseId || undefined, 'published');
      console.log('Chapters response:', response);
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      setChapters(chaptersData);
      
      // 同时获取所有知识点
      const kpResponse = await knowledgePointAPI.getKnowledgePoints({ courseId: courseId || undefined });
      console.log('Knowledge points response:', kpResponse);
      const kpData = kpResponse.data || kpResponse;
      const knowledgePointsData = Array.isArray(kpData) ? kpData : kpData.knowledgePoints || [];
      setKnowledgePoints(knowledgePointsData);
    } catch (error: any) {
      console.error('获取章节或知识点失败:', error);
      setError(`获取章节或知识点失败: ${error.response?.data?.error || error.message || '请稍后重试'}`);
    }
  };

  // 添加获取题目列表的函数
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // 调用实际的API获取题目列表，传递课程ID
      const response = await questionAPI.getQuestions({ courseId });
      const data = response.data || response;
      setQuestions(Array.isArray(data) ? data : data.questions || []);
      setError(null);
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
      setError(null);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(id => id !== questionId));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
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

  // 保存选中的题目到作业
  const handleSaveQuestions = async () => {
    try {
      if (selectedQuestions.length === 0) {
        setError('请先选择至少一道题目');
        return;
      }

      // 调用API将选中的题目保存到作业中
      const response = await assignmentAPI.updateAssignment(assignmentId, {
        questionIds: selectedQuestions
      });

      if (response.success) {
        alert(`成功保存 ${selectedQuestions.length} 道题目到作业中`);
        navigate(-1); // 返回上一页
      } else {
        throw new Error(response.error || '保存失败');
      }
    } catch (error: any) {
      console.error('保存题目失败:', error);
      setError(`保存题目失败: ${error.response?.data?.error || error.message || '请稍后重试'}`);
    }
  };

  // 过滤题目
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
                        question.content.toLowerCase().includes(questionSearchTerm.toLowerCase());
    const matchesChapter = !selectedChapterId || (question.knowledgePointId && knowledgePoints.find(kp => kp.id === question.knowledgePointId)?.chapterId === selectedChapterId);
    const matchesKnowledgePoint = !selectedKnowledgePointId || (question.knowledgePointId && question.knowledgePointId === selectedKnowledgePointId);
    const matchesType = !selectedType || question.type === selectedType;
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesChapter && matchesKnowledgePoint && matchesType && matchesDifficulty;
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
          onClick={() => navigate(-1)} 
          sx={{ mr: 2 }}
          title="返回"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          作业组题管理
        </Typography>
      </Box>

      {/* 双面板布局 */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        flexWrap: 'nowrap',
        flexDirection: 'row',
        height: 'auto',
        minHeight: '600px'
      }}>
        {/* 左侧面板：作业成品预览 */}
        <Box sx={{ 
          width: '50%',
          minWidth: '50%',
          flex: '1 1 auto',
          pr: 1.5
        }}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardHeader 
              title="作业成品预览" 
              subheader={`已选择 ${selectedQuestions.length} 道题目`}
            />
            <Divider />
            <CardContent sx={{ 
              flex: 1,
              overflowY: 'auto'
            }}>
              {selectedQuestions.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {questions
                    .filter(q => selectedQuestions.includes(q.id))
                    .map((question, index) => (
                      <Card 
                        key={question.id} 
                        variant="outlined"
                        sx={{ 
                          transition: 'box-shadow 0.2s',
                          '&:hover': { boxShadow: 3 }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {index + 1}. {question.title}
                                </Typography>
                                <Chip label={`${question.points}分`} size="small" color="primary" />
                              </Box>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {question.content}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={getTypeLabel(question.type)} 
                                  size="small" 
                                  color={
                                    question.type === 'single_choice' ? 'primary' :
                                    question.type === 'multiple_choice' ? 'secondary' :
                                    question.type === 'short_answer' ? 'success' : 'default'
                                  }
                                />
                                <Chip 
                                  label={getDifficultyLabel(question.difficulty)} 
                                  size="small" 
                                  color={getDifficultyColor(question.difficulty) as any}
                                />
                              </Box>
                            </Box>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveQuestion(question.id)}
                              sx={{ ml: 2 }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '300px',
                  flexDirection: 'column'
                }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    尚未选择任何题目
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    请从右侧题库中选择题目添加到作业中
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* 右侧面板：题库找题 */}
        <Box sx={{ 
          width: '50%',
          minWidth: '50%',
          flex: '1 1 auto',
          pl: 1.5
        }}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardHeader 
              title="题库找题" 
              subheader={`共 ${questions.length} 道题目`}
            />
            <Divider />
            <CardContent sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* 筛选条件 */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="搜索题目..."
                  value={questionSearchTerm}
                  onChange={(e) => setQuestionSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search />,
                  }}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>章节</InputLabel>
                  <Select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    label="章节"
                  >
                    <MenuItem value="">全部章节</MenuItem>
                    {chapters.map((chapter) => (
                      <MenuItem key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 120 }} disabled={!selectedChapterId}>
                  <InputLabel>知识点</InputLabel>
                  <Select
                    value={selectedKnowledgePointId}
                    onChange={(e) => setSelectedKnowledgePointId(e.target.value)}
                    label="知识点"
                  >
                    <MenuItem value="">全部知识点</MenuItem>
                    {filteredKnowledgePoints.map((kp) => (
                      <MenuItem key={kp.id} value={kp.id}>
                        {kp.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>类型</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    label="类型"
                  >
                    <MenuItem value="">全部类型</MenuItem>
                    <MenuItem value="single_choice">单选题</MenuItem>
                    <MenuItem value="multiple_choice">多选题</MenuItem>
                    <MenuItem value="short_answer">简答题</MenuItem>
                    <MenuItem value="programming">编程题</MenuItem>
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
              <TableContainer component={Paper} sx={{ flex: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <IconButton 
                          size="small" 
                          onClick={handleSelectAllQuestions}
                        >
                          {selectedQuestions.length === questions.length && questions.length > 0 ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>题目</TableCell>
                      <TableCell>类型</TableCell>
                      <TableCell>难度</TableCell>
                      <TableCell>分值</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            暂无题目数据
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((question) => (
                        <TableRow 
                          key={question.id} 
                          selected={selectedQuestions.includes(question.id)}
                          onClick={() => handleQuestionSelect(question.id)}
                          sx={{ 
                            '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' },
                            '&.Mui-selected': { backgroundColor: 'primary.light' }
                          }}
                        >
                          <TableCell padding="checkbox">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuestionSelect(question.id);
                              }}
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
                              color={getDifficultyColor(question.difficulty) as any}
                            />
                          </TableCell>
                          <TableCell>{question.points}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 操作按钮 */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(-1)}
                >
                  取消
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSaveQuestions}
                  disabled={selectedQuestions.length === 0}
                >
                  保存题目 ({selectedQuestions.length})
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default QuestionBank;