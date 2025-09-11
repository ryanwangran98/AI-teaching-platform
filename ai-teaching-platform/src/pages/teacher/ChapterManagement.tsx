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
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Link,
  ArrowBack,
  Book,
  Publish,
  Drafts,
  FiberNew,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom'; // 修改这里，使用useParams而不是useSearchParams
import { chapterAPI, courseAPI } from '../../services/api';


interface Chapter {
  id: string;
  title: string;
  description: string;
  content?: string; // API返回的描述字段
  courseId: string;
  courseName: string;
  order: number; // API返回的排序字段
  orderIndex: number; // 兼容字段
  status: 'draft' | 'published' | 'archived';
  knowledgePointsCount: number;
  materialsCount: number;
  coursewareCount: number;
  assignmentsCount: number;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    name: string;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  _count?: {
    knowledgePoints: number;
  };
  knowledgePoints?: Array<any>;
}

interface ChapterFormData {
  title: string;
  description: string;
  orderIndex: number;
  status: 'draft' | 'published' | 'archived';
}

const ChapterManagement: React.FC = () => {
  const navigate = useNavigate();
  const { courseId: currentCourseId } = useParams<{courseId: string}>(); // 修改这里，使用useParams获取路由参数
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  
  // 新增的状态变量
  const [open, setOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    description: '',
    orderIndex: 0,
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<{id: string, name: string} | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentCourseId) {
      fetchChapters();
      fetchCurrentCourse();
    } else {
      setError('未指定课程ID，请从课程管理页面进入');
      setLoading(false);
    }
  }, [currentCourseId]);

  const fetchChapters = async () => {
    if (!currentCourseId) return;
    
    try {
      setLoading(true);
      // 获取当前课程的章节
      const response = await chapterAPI.getChapters(currentCourseId, 'all');
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      
      // 映射API数据到前端需要的格式
      const mappedChapters = chaptersData.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || chapter.content || '',
        courseId: chapter.courseId,
        courseName: chapter.course?.name || '未知课程',
        orderIndex: chapter.order || 0,
        order: chapter.order || 0,
        status: chapter.status || 'draft',
        knowledgePointsCount: chapter._count?.knowledgePoints || 0,
        materialsCount: chapter.materialsCount || 0,
        coursewareCount: chapter.coursewareCount || 0,
        assignmentsCount: chapter.assignmentsCount || 0,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        content: chapter.content,
        course: chapter.course,
        _count: chapter._count,
        knowledgePoints: chapter.knowledgePoints
      }));
      
      setChapters(mappedChapters);
      setError(null);
    } catch (error) {
      console.error('获取章节失败:', error);
      setError('获取章节失败，请稍后重试');
      setChapters([]); // 确保是数组
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCourse = async () => {
    if (!currentCourseId) return;
    
    try {
      const response = await courseAPI.getCourse(currentCourseId);
      const courseData = response.data || response;
      
      setCurrentCourse({
        id: courseData.id,
        name: courseData.name || courseData.title || '未命名课程'
      });
    } catch (error) {
      console.error('获取课程信息失败:', error);
      setCurrentCourse({
        id: currentCourseId,
        name: '未知课程'
      });
    }
  };

  const handleCreate = () => {
    setEditingChapter(null);
    setFormData({
      title: '',
      description: '',
      orderIndex: chapters.length + 1,
      status: 'draft',
    });
    setOpen(true);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      title: chapter.title,
      description: chapter.description || chapter.content || '',
      orderIndex: chapter.orderIndex || chapter.order || 0,
      status: chapter.status || 'draft',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingChapter(null);
    setFormData({
      title: '',
      description: '',
      orderIndex: 0,
      status: 'draft',
    });
  };

  const handleSave = async () => {
    // 验证输入
    if (!formData.title.trim()) {
      setError('请输入章节标题');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('请输入章节描述');
      return;
    }
    
    if (!currentCourseId) {
      setError('课程ID不存在，无法保存章节');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const chapterData = {
        title: formData.title.trim(),
        content: formData.description.trim(), // 修改这里，使用content而不是description
        courseId: currentCourseId, // 使用当前课程ID
        order: Number(formData.orderIndex), // 转换为数字类型，后端使用order字段
        status: formData.status,
      };

      if (editingChapter) {
        // 编辑现有章节
        const response = await chapterAPI.updateChapter(editingChapter.id, chapterData);
        const updatedChapter = response.data || response;
        
        // 映射更新后的数据
        const mappedUpdatedChapter = {
          ...updatedChapter,
          description: updatedChapter.description || updatedChapter.content || '', // 保持description字段用于前端显示
          courseName: updatedChapter.course?.name || currentCourse?.name || '未知课程',
          orderIndex: updatedChapter.order || 0,
          knowledgePointsCount: updatedChapter._count?.knowledgePoints || 0
        };
        
        setChapters(chapters.map(c => 
          c.id === editingChapter.id ? { ...c, ...mappedUpdatedChapter } : c
        ));
      } else {
        // 创建新章节
        const response = await chapterAPI.createChapter(currentCourseId, {
          title: formData.title.trim(),
          content: formData.description.trim(), // 修改这里，使用content而不是description
          order: Number(formData.orderIndex), // 转换为数字类型
        });
        const newChapter = response.data || response;
        
        // 映射新创建的数据
        const mappedNewChapter = {
          ...newChapter,
          description: newChapter.description || newChapter.content || '', // 保持description字段用于前端显示
          courseName: newChapter.course?.name || currentCourse?.name || '未知课程',
          orderIndex: newChapter.order || 0,
          knowledgePointsCount: newChapter._count?.knowledgePoints || 0
        };
        
        setChapters([...chapters, mappedNewChapter]);
      }
      
      handleClose();
    } catch (error: any) {
      console.error('保存章节失败:', error);
      setError(error.response?.data?.message || error.message || '保存章节失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (chapter: Chapter) => {
    setChapterToDelete(chapter);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chapterToDelete) return;
    
    try {
      setDeleting(true);
      await chapterAPI.deleteChapter(chapterToDelete.id);
      setChapters(chapters.filter(c => c.id !== chapterToDelete.id));
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    } catch (error: any) {
      console.error('删除章节失败:', error);
      const errorMessage = error.response?.data?.message || '删除章节失败，请稍后重试'; // 修改这里，使用message而不是error
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChapterToDelete(null);
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

  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           chapter.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || chapter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!currentCourseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          未指定课程ID，请从课程管理页面进入章节管理。
        </Alert>
        <Button variant="contained" onClick={() => navigate('/teacher/courses')}>
          返回课程管理
        </Button>
      </Box>
    );
  }

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
        <Button variant="contained" onClick={fetchChapters}>
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
          章节管理 {currentCourse && `- ${currentCourse.name}`}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    总章节数
                  </Typography>
                  <Typography variant="h4">
                    {chapters.length}
                  </Typography>
                </div>
                <Book sx={{ color: 'primary.main', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    已发布
                  </Typography>
                  <Typography variant="h4">
                    {chapters.filter(c => c.status === 'published').length}
                  </Typography>
                </div>
                <Publish sx={{ color: 'success.main', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    草稿
                  </Typography>
                  <Typography variant="h4">
                    {chapters.filter(c => c.status === 'draft').length}
                  </Typography>
                </div>
                <Drafts sx={{ color: 'warning.main', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    本周新增
                  </Typography>
                  <Typography variant="h4">
                    {chapters.filter(c => {
                      const createdAt = new Date(c.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return createdAt >= weekAgo;
                    }).length}
                  </Typography>
                </div>
                <FiberNew sx={{ color: 'info.main', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索章节..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          创建章节
        </Button>

      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>章节名称</TableCell>
              <TableCell>所属课程</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>排序</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>知识点</TableCell>
              <TableCell>资料</TableCell>
              <TableCell>课件</TableCell>
              <TableCell>作业</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>更新时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredChapters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography variant="body2" color="text.secondary">
                    暂无章节数据
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredChapters.map((chapter) => (
                <TableRow key={chapter.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {chapter.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{chapter.courseName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                      {chapter.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{chapter.order}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(chapter.status)}
                      color={getStatusColor(chapter.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={chapter.knowledgePointsCount}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={chapter.materialsCount}
                      color="secondary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={chapter.coursewareCount}
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={chapter.assignmentsCount}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(chapter.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    {new Date(chapter.updatedAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton color="primary" size="small" onClick={() => handleEdit(chapter)}>
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(chapter)}
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



      {/* 创建/编辑章节对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingChapter ? '编辑章节' : '创建章节'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="章节名称 *"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
              required
              helperText="请输入章节的完整标题，如：第一章 导论"
            />
            <TextField
              label="章节描述 *"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
              required
              helperText="请输入章节的详细描述，包括学习目标和主要内容"
            />
            <TextField
              label="排序"
              name="orderIndex"
              type="number"
              value={formData.orderIndex}
              onChange={handleInputChange}
              fullWidth
              required
              helperText="数字越小排序越靠前"
            />
            <FormControl fullWidth required>
              <InputLabel>状态</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                label="状态"
              >
                <MenuItem value="draft">草稿</MenuItem>
                <MenuItem value="published">已发布</MenuItem>
                <MenuItem value="archived">已归档</MenuItem>
              </Select>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                草稿状态仅自己可见，已发布状态对学生可见
              </Typography>
            </FormControl>
            {currentCourse && (
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  所属课程：<strong>{currentCourse.name}</strong>
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={submitting || !formData.title.trim() || !formData.description.trim()}
          >
            {submitting ? <CircularProgress size={24} /> : (editingChapter ? '更新' : '创建')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>确认删除章节</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确定要删除章节「{chapterToDelete?.title}」吗？
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            删除章节将同时删除以下相关数据：
            <ul>
              <li>章节下的所有知识点</li>
              <li>章节下的所有资料</li>
              <li>章节下的所有课件</li>
              <li>相关的所有作业和题目</li>
            </ul>
            此操作不可撤销，请谨慎操作。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            取消
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChapterManagement;