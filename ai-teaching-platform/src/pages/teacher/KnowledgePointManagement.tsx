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
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgePointAPI, chapterAPI } from '../../services/api';


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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterId: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    importance: 'medium' as 'low' | 'medium' | 'high',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  useEffect(() => {
    fetchKnowledgePoints();
    fetchChapters();
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
        materialsCount: kp.materialsCount || kp._count?.materials || 0,
        coursewareCount: kp.coursewareCount || kp._count?.courseware || 0,
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
    } catch (error) {
      console.error('保存知识点失败:', error);
      alert('保存知识点失败，请稍后重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个知识点吗？')) {
      try {
        await knowledgePointAPI.deleteKnowledgePoint(id);
        await fetchKnowledgePoints();
      } catch (error) {
        console.error('删除知识点失败:', error);
        alert('删除知识点失败，请稍后重试');
      }
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
    switch (difficulty) {
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
    switch (difficulty) {
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
    switch (importance) {
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
    switch (importance) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      case '0': return '低';
      case '1': return '中';
      case '2': return '高';
      default: return importance;
    }
  };

  const filteredKnowledgePoints = knowledgePoints.filter(kp => {
    const matchesSearch = kp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           kp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChapter = !selectedChapter || kp.chapterId === selectedChapter;
    const matchesDifficulty = !selectedDifficulty || kp.difficulty === selectedDifficulty;
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/teacher/courses')} 
          sx={{ mr: 2 }}
          title="返回我的课程"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          知识点管理
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                总知识点数
              </Typography>
              <Typography variant="h4">
                {knowledgePoints.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                已发布
              </Typography>
              <Typography variant="h4">
                {knowledgePoints.filter(kp => kp.status === 'published').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                困难知识点
              </Typography>
              <Typography variant="h4">
                {knowledgePoints.filter(kp => kp.difficulty === 'hard').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                高重要性
              </Typography>
              <Typography variant="h4">
                {knowledgePoints.filter(kp => kp.importance === 'high').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索知识点..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ flex: 1 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>章节</InputLabel>
          <Select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          创建知识点
        </Button>

      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>知识点名称</TableCell>
              <TableCell>所属章节</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>难度</TableCell>
              <TableCell>重要性</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>资料</TableCell>
              <TableCell>课件</TableCell>
              <TableCell>作业</TableCell>
              <TableCell>题目</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>更新时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredKnowledgePoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  <Typography variant="body2" color="text.secondary">
                    暂无知识点数据
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredKnowledgePoints.map((kp) => (
                <TableRow key={kp.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {kp.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{kp.chapterName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                      {kp.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getDifficultyLabel(kp.difficulty)}
                      color={getDifficultyColor(kp.difficulty) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getImportanceLabel(kp.importance)}
                      color={getImportanceColor(kp.importance) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(kp.status)}
                      color={getStatusColor(kp.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kp.materialsCount}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kp.coursewareCount}
                      color="secondary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kp.assignmentsCount}
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kp.questionsCount}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(kp.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    {new Date(kp.updatedAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => handleEdit(kp)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(kp.id)}
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



      {/* 编辑对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingKnowledgePoint ? '编辑知识点' : '创建知识点'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="知识点名称"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
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
            <FormControl fullWidth margin="normal">
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
            <FormControl fullWidth margin="normal">
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
            <FormControl fullWidth margin="normal">
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            {editingKnowledgePoint ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KnowledgePointManagement;