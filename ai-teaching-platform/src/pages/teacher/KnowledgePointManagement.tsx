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
  CardHeader,
  CardActions,
  alpha,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Link,
  ArrowBack,
  Publish,
  Cancel,
  Close,
  Lightbulb,
} from '@mui/icons-material';
import { Snackbar } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgePointAPI, chapterAPI, courseAPI } from '../../services/api';


interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  content?: string; // API返回的描述字段
  chapterId: string;
  chapterName?: string;
  chapter?: {
    id: string;
    title: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';
  materialsCount: number;
  coursewareCount: number;
  assignmentsCount: number;
  questionsCount: number;
  _count?: {
    materials?: number;
    courseware?: number;
    assignments?: number;
    questions?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const KnowledgePointManagement: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { courseId } = useParams<{ courseId: string }>();
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const [open, setOpen] = useState(false);
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<KnowledgePoint | null>(null);
  const [chapters, setChapters] = useState<Array<{id: string, title: string}>>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [knowledgePointToDelete, setKnowledgePointToDelete] = useState<KnowledgePoint | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterId: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    importance: 'medium' as 'low' | 'medium' | 'high',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  const [currentCourse, setCurrentCourse] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchKnowledgePoints();
    fetchChapters();
    if (courseId) {
      fetchCurrentCourse();
    }
  }, [courseId]);

  const fetchKnowledgePoints = async () => {
    try {
      setLoading(true);
      const response = await knowledgePointAPI.getKnowledgePoints(courseId ? { courseId } : undefined);
      const data = response.data || response;
      const knowledgePointsData = Array.isArray(data) ? data : data.knowledgePoints || [];
      
      // 映射数据字段
      const mappedKnowledgePoints = knowledgePointsData.map((kp: any) => ({
        ...kp,
        description: kp.description || kp.content || '',
        chapterName: kp.chapterName || (kp.chapter?.title) || '未知章节',
        chapterId: kp.chapterId || (kp.chapter?.id) || '',
        materialsCount: kp.materialsCount || 0,
        coursewareCount: kp.coursewareCount || 0,
        assignmentsCount: kp.assignmentsCount || kp._count?.assignments || 0,
        questionsCount: kp.questionsCount || kp._count?.questions || 0,
        difficulty: kp.difficulty || 'medium',
        importance: kp.importance || 'medium',
        status: kp.status || 'draft',
      }));
      
      setKnowledgePoints(mappedKnowledgePoints);
      setError(null);
    } catch (error) {
      console.error('获取知识点失败:', error);
      setError('获取知识点失败，请稍后重试');
      setKnowledgePoints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const response = await chapterAPI.getChapters(courseId, 'all');
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      
      // 映射章节数据
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

  const fetchCurrentCourse = async () => {
    if (!courseId) return;
    
    try {
      const response = await courseAPI.getCourse(courseId);
      const data = response.data || response;
      
      if (data && data.id) {
        setCurrentCourse({
          id: data.id,
          name: data.name || data.title || '未知课程'
        });
      } else {
        setCurrentCourse({
          id: courseId,
          name: '未知课程'
        });
      }
    } catch (error) {
      console.error('获取课程信息失败:', error);
      setCurrentCourse({
        id: courseId,
        name: '未知课程'
      });
    }
  };

  const handleCreate = () => {
    setEditingKnowledgePoint(null);
    setFormData({
      title: '',
      description: '',
      chapterId: '',
      difficulty: 'medium',
      importance: 'medium',
      status: 'draft',
    });
    setOpen(true);
  };

  const handleEdit = (knowledgePoint: KnowledgePoint) => {
    setEditingKnowledgePoint(knowledgePoint);
    setFormData({
      title: knowledgePoint.title || '',
      description: knowledgePoint.description || '',
      chapterId: knowledgePoint.chapterId || '',
      difficulty: knowledgePoint.difficulty || 'medium',
      importance: knowledgePoint.importance || 'medium',
      status: knowledgePoint.status || 'draft',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingKnowledgePoint(null);
  };

  const handleSave = async () => {
    try {
      if (editingKnowledgePoint) {
        // 更新知识点
        await knowledgePointAPI.updateKnowledgePoint(editingKnowledgePoint.id, formData);
      } else {
        // 创建知识点
        await knowledgePointAPI.createKnowledgePoint(formData);
      }
      
      // 重新获取数据
      await fetchKnowledgePoints();
      handleClose();
      setSnackbar({ 
        open: true, 
        message: editingKnowledgePoint ? '知识点更新成功' : '知识点创建成功', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('保存知识点失败:', error);
      setSnackbar({ open: true, message: '保存知识点失败，请稍后重试', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const knowledgePoint = knowledgePoints.find(kp => kp.id === id);
    if (knowledgePoint) {
      setKnowledgePointToDelete(knowledgePoint);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (knowledgePointToDelete) {
      try {
        await knowledgePointAPI.deleteKnowledgePoint(knowledgePointToDelete.id);
        await fetchKnowledgePoints();
        setDeleteDialogOpen(false);
        setKnowledgePointToDelete(null);
        setSnackbar({ open: true, message: '知识点删除成功', severity: 'success' });
      } catch (error) {
        console.error('删除知识点失败:', error);
        setSnackbar({ open: true, message: '删除知识点失败，请稍后重试', severity: 'error' });
      }
    }
  };

  const handlePublish = async (knowledgePoint: KnowledgePoint) => {
    try {
      await knowledgePointAPI.updateKnowledgePoint(knowledgePoint.id, {
        ...knowledgePoint,
        status: 'published'
      });
      
      setKnowledgePoints(knowledgePoints.map(kp => 
        kp.id === knowledgePoint.id ? { ...kp, status: 'published' } : kp
      ));
      
      setSnackbar({ open: true, message: '知识点已发布', severity: 'success' });
    } catch (error) {
      console.error('发布知识点失败:', error);
      setSnackbar({ open: true, message: '发布知识点失败，请稍后重试', severity: 'error' });
    }
  };

  const handleUnpublish = async (knowledgePoint: KnowledgePoint) => {
    try {
      await knowledgePointAPI.updateKnowledgePoint(knowledgePoint.id, {
        ...knowledgePoint,
        status: 'draft'
      });
      
      setKnowledgePoints(knowledgePoints.map(kp => 
        kp.id === knowledgePoint.id ? { ...kp, status: 'draft' } : kp
      ));
      
      setSnackbar({ open: true, message: '知识点已取消发布', severity: 'info' });
    } catch (error) {
      console.error('取消发布知识点失败:', error);
      setSnackbar({ open: true, message: '取消发布知识点失败，请稍后重试', severity: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'success';
      case 'archived': return 'warning';
      case '0': return 'default';
      case '1': return 'success';
      case '2': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'archived': return '已归档';
      case '0': return '草稿';
      case '1': return '已发布';
      case '2': return '已归档';
      default: return status;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const lowerDifficulty = difficulty.toLowerCase();
    switch (lowerDifficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      case '0': return 'success';
      case '1': return 'warning';
      case '2': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const lowerDifficulty = difficulty.toLowerCase();
    switch (lowerDifficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      case '0': return '简单';
      case '1': return '中等';
      case '2': return '困难';
      default: return difficulty;
    }
  };

  const getImportanceColor = (importance: string) => {
    const lowerImportance = importance.toLowerCase();
    switch (lowerImportance) {
      case 'low': return 'default';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case '0': return 'default';
      case '1': return 'warning';
      case '2': return 'error';
      default: return 'default';
    }
  };

  const getImportanceLabel = (importance: string) => {
    const lowerImportance = importance.toLowerCase();
    switch (lowerImportance) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      case '0': return '低';
      case '1': return '中';
      case '2': return '高';
      default: return importance;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredKnowledgePoints = knowledgePoints.filter(kp => {
    const matchesSearch = kp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           kp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChapter = !selectedChapter || kp.chapterId === selectedChapter;
    const matchesDifficulty = !selectedDifficulty || kp.difficulty.toLowerCase() === selectedDifficulty;
    return matchesSearch && matchesChapter && matchesDifficulty;
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
        <Button variant="contained" onClick={fetchKnowledgePoints}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和返回按钮 */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/teacher/courses')}
            sx={{ 
              mr: 2,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            返回课程列表
          </Button>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }}
          >
            <Lightbulb />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              知识点管理
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {currentCourse?.name || '未知课程'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 操作按钮和搜索筛选 */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                fullWidth
                sx={{ 
                  py: 1.2,
                  borderRadius: 1.5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  }
                }}
              >
                创建知识点
              </Button>
            </Grid>
            
            {/* 搜索和筛选 */}
            <Grid item xs={12} sm={8} md={7}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  placeholder="搜索知识点"
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>章节</InputLabel>
                  <Select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    label="章节"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <MenuItem value="">全部章节</MenuItem>
                    {chapters.map((chapter) => (
                      <MenuItem key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <Chip 
                label={`${filteredKnowledgePoints.length} 个知识点`}
                color="primary"
                variant="outlined"
                sx={{ height: 36, width: '100%' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filteredKnowledgePoints.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                暂无知识点数据
              </Typography>
            </Card>
          </Grid>
        ) : (
          filteredKnowledgePoints.map((kp) => (
            <Grid item xs={12} sm={6} md={4} key={kp.id}>
              <Card 
                sx={{ 
                  borderRadius: 2, 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                {/* 卡片头部 - 带渐变背景 */}
                <CardHeader 
                  sx={{ 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
                    color: 'white',
                    pb: 2
                  }}
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb sx={{ fontSize: 20 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {kp.title}
                      </Typography>
                    </Box>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={getDifficultyLabel(kp.difficulty)}
                        color={getDifficultyColor(kp.difficulty) as any}
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: 1,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <Chip 
                        label={getImportanceLabel(kp.importance)}
                        color={getImportanceColor(kp.importance) as any}
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: 1,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <Chip 
                        label={getStatusLabel(kp.status)}
                        color={getStatusColor(kp.status) as any}
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: 1,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Box>
                  }
                />
                
                <CardContent sx={{ pt: 2, pb: 1 }}>
                  {/* 描述信息区 */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.8, fontWeight: 500 }}>
                      描述
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.5, color: 'text.primary' }}>
                      {kp.description || '暂无描述'}
                    </Typography>
                  </Box>
                  
                  {/* 所属章节区 */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.8, fontWeight: 500 }}>
                      所属章节
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {kp.chapterName}
                    </Typography>
                  </Box>
                  
                  {/* 统计信息区 */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                      资源统计
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          textAlign: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.08)'
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.3 }}>
                            {kp.materialsCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            资料
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          textAlign: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.08)'
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 0.3 }}>
                            {kp.coursewareCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            课件
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          textAlign: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.08)'
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main', mb: 0.3 }}>
                            {kp.assignmentsCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            作业
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.warning.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          textAlign: 'center',
                          border: '1px solid rgba(0, 0, 0, 0.08)'
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 0.3 }}>
                            {kp.questionsCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            题目
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* 时间信息区 */}
                  <Box sx={{ 
                    pt: 1.5, 
                    borderTop: '1px dashed rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      创建: {new Date(kp.createdAt).toLocaleDateString('zh-CN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      更新: {new Date(kp.updatedAt).toLocaleDateString('zh-CN')}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ px: 2, pb: 2, pt: 1.5, flexDirection: 'column', gap: 1.5 }}>
                  {/* 主要操作按钮 */}
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Visibility />}
                      sx={{ 
                        flex: 1,
                        py: 0.8,
                        borderRadius: 1.5,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { 
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      查看
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleEdit(kp)}
                      startIcon={<Edit />}
                      sx={{ 
                        flex: 1,
                        py: 0.8,
                        borderRadius: 1.5,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': { 
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      编辑
                    </Button>
                  </Box>
                  
                  {/* 次要操作按钮 */}
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    {kp.status === 'draft' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handlePublish(kp)}
                        startIcon={<Publish />}
                        sx={{ 
                          flex: 1,
                          py: 0.8,
                          borderRadius: 1.5,
                          borderColor: 'success.main',
                          color: 'success.main',
                          '&:hover': { 
                            borderColor: 'success.dark',
                            bgcolor: 'rgba(76, 175, 80, 0.04)',
                          }
                        }}
                      >
                        发布
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUnpublish(kp)}
                        startIcon={<Cancel />}
                        sx={{ 
                          flex: 1,
                          py: 0.8,
                          borderRadius: 1.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        取消发布
                      </Button>
                    )}
                    
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDelete(kp.id)}
                      startIcon={<Delete />}
                      color="error"
                      sx={{ 
                        flex: 1,
                        py: 0.8,
                        borderRadius: 1.5,
                        borderColor: 'error.main',
                        '&:hover': { 
                          borderColor: 'error.dark',
                          bgcolor: 'rgba(211, 47, 47, 0.04)',
                        }
                      }}
                    >
                      删除
                    </Button>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>



      {/* 编辑对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            {editingKnowledgePoint ? '编辑知识点' : '创建知识点'}
          </Typography>
          <IconButton 
            onClick={handleClose} 
            sx={{ 
              color: 'white',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.1)' 
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="知识点名称"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined" sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}>
                <InputLabel>所属章节</InputLabel>
                <Select
                  value={formData.chapterId}
                  onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                  label="所属章节"
                >
                  {chapters.map((chapter) => (
                    <MenuItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined" sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}>
                <InputLabel>难度</InputLabel>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                  label="难度"
                >
                  <MenuItem value="easy">简单</MenuItem>
                  <MenuItem value="medium">中等</MenuItem>
                  <MenuItem value="hard">困难</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined" sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}>
                <InputLabel>重要性</InputLabel>
                <Select
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: e.target.value as 'low' | 'medium' | 'high' })}
                  label="重要性"
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined" sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}>
                <InputLabel>状态</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
                  label="状态"
                >
                  <MenuItem value="draft">草稿</MenuItem>
                  <MenuItem value="published">已发布</MenuItem>
                  <MenuItem value="archived">已归档</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            {editingKnowledgePoint ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ 
          bgcolor: 'error.main', 
          color: 'white',
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            确认删除
          </Typography>
          <IconButton 
            onClick={() => setDeleteDialogOpen(false)} 
            sx={{ 
              color: 'white',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.1)' 
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            此操作不可撤销！
          </Alert>
          <Typography>
            您确定要删除知识点 "{knowledgePointToDelete?.title}" 吗？删除后无法恢复。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(211, 47, 47, 0.3)',
              }
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            '& .MuiAlert-icon': {
              fontSize: 24
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KnowledgePointManagement;