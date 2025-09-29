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
  CardHeader,
  CardActions,
  Stack,
  Snackbar,
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
  Book,
  Publish,
  Drafts,
  FiberNew,
  Upload,
  VideoFile,
  Cancel,
  Close,
  Psychology,
  Folder,
  Slideshow,
  Assignment,
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
  videoUrl?: string; // 章节学习视频URL
}

interface ChapterFormData {
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
}

const ChapterManagement: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<{id: string, name: string} | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // 视频上传相关状态
  const [videoUploadOpen, setVideoUploadOpen] = useState(false);
  const [uploadingChapter, setUploadingChapter] = useState<Chapter | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  
  // Snackbar状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

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
        status: chapter.status || 'draft',
        knowledgePointsCount: chapter._count?.knowledgePoints || 0,
        materialsCount: chapter.materialsCount || chapter._count?.materials || 0,
        coursewareCount: chapter.coursewareCount || chapter._count?.courseware || 0,
        assignmentsCount: chapter.assignmentsCount || 0,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        content: chapter.content,
        course: chapter.course,
        _count: chapter._count,
        knowledgePoints: chapter.knowledgePoints,
        videoUrl: chapter.videoUrl // 添加视频URL字段
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
      status: 'draft',
    });
    setOpen(true);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      title: chapter.title,
      description: chapter.description || chapter.content || '',
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
        });
        const newChapter = response.data || response;
        
        // 映射新创建的数据
        const mappedNewChapter = {
          ...newChapter,
          description: newChapter.description || newChapter.content || '', // 保持description字段用于前端显示
          courseName: newChapter.course?.name || currentCourse?.name || '未知课程',
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

  // 视频上传相关函数
  const handleVideoUploadOpen = (chapter: Chapter) => {
    setUploadingChapter(chapter);
    setVideoUploadOpen(true);
  };

  const handleVideoUploadClose = () => {
    setVideoUploadOpen(false);
    setUploadingChapter(null);
    setVideoFile(null);
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleVideoUpload = async () => {
    if (!uploadingChapter || !videoFile) return;

    setVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('chapterId', uploadingChapter.id);

      const response = await chapterAPI.uploadChapterVideo(uploadingChapter.id, formData);

      if (response.success) {
        setSnackbar({
          open: true,
          message: '视频上传成功',
          severity: 'success',
        });
        handleVideoUploadClose();
        fetchChapters();
      } else {
        throw new Error(response.message || '视频上传失败');
      }
    } catch (error) {
      console.error('视频上传失败:', error);
      setSnackbar({
        open: true,
        message: '视频上传失败',
        severity: 'error',
      });
    } finally {
      setVideoUploading(false);
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

  const handlePublish = async (chapter: Chapter) => {
    try {
      const updatedChapter = await chapterAPI.updateChapter(chapter.id, {
        ...chapter,
        status: 'published'
      });
      
      setChapters(chapters.map(c => 
        c.id === chapter.id ? { ...c, status: 'published' } : c
      ));
      
      setSnackbar({
        open: true,
        message: '章节已发布',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('发布章节失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '发布章节失败',
        severity: 'error',
      });
    }
  };

  const handleUnpublish = async (chapter: Chapter) => {
    try {
      const updatedChapter = await chapterAPI.updateChapter(chapter.id, {
        ...chapter,
        status: 'draft'
      });
      
      setChapters(chapters.map(c => 
        c.id === chapter.id ? { ...c, status: 'draft' } : c
      ));
      
      setSnackbar({
        open: true,
        message: '章节已取消发布',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('取消发布章节失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '取消发布章节失败',
        severity: 'error',
      });
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

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
      {/* 页面标题 */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }}
          >
            <Book />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              章节管理
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
                创建章节
              </Button>
            </Grid>
            
            {/* 搜索和筛选 */}
            <Grid item xs={12} sm={8} md={7}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  placeholder="搜索章节"
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
                  <InputLabel>状态</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="状态"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <MenuItem value="">全部状态</MenuItem>
                    <MenuItem value="draft">草稿</MenuItem>
                    <MenuItem value="published">已发布</MenuItem>
                    <MenuItem value="archived">已归档</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <Chip 
                label={`${filteredChapters.length} 个章节`}
                color="primary"
                variant="outlined"
                sx={{ height: 36, width: '100%' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 章节卡片视图 */}
      <Grid container spacing={3}>
        {filteredChapters.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                暂无章节数据
              </Typography>
            </Card>
          </Grid>
        ) : (
          filteredChapters.map((chapter) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={chapter.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* 卡片头部 */}
                <CardHeader
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
                    color: 'white',
                    pb: 2,
                    '& .MuiCardHeader-title': {
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }
                  }}
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Book />
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {chapter.title}
                      </Typography>
                    </Box>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip
                        label={getStatusLabel(chapter.status)}
                        color={getStatusColor(chapter.status) as any}
                        size="small"
                        sx={{ 
                          borderRadius: 1,
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          '& .MuiChip-label': {
                            fontWeight: 'bold'
                          }
                        }}
                      />
                    </Box>
                  }
                />
                
                {/* 卡片内容 */}
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* 描述信息 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1, lineHeight: 1.5 }}>
                      {chapter.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      所属课程: {chapter.courseName}
                    </Typography>
                  </Box>
                  
                  {/* 统计信息 - 调整为与知识点管理卡片一致的布局 */}
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.3 }}>
                              {chapter.knowledgePointsCount}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              知识点
                            </Typography>
                          </Box>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            width: 32,
                            height: 32
                          }}>
                            <Psychology fontSize="small" />
                          </Avatar>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 0.3 }}>
                              {chapter.materialsCount}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              资料
                            </Typography>
                          </Box>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            width: 32,
                            height: 32
                          }}>
                            <Folder fontSize="small" />
                          </Avatar>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main', mb: 0.3 }}>
                              {chapter.coursewareCount}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              课件
                            </Typography>
                          </Box>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            width: 32,
                            height: 32
                          }}>
                            <Slideshow fontSize="small" />
                          </Avatar>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.warning.main, 0.08),
                          borderRadius: 1.5,
                          p: 1.2,
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 0.3 }}>
                              {chapter.assignmentsCount}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              作业
                            </Typography>
                          </Box>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            width: 32,
                            height: 32
                          }}>
                            <Assignment fontSize="small" />
                          </Avatar>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* 视频状态和时间信息 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideoFile sx={{ fontSize: 18, color: chapter.videoUrl ? 'success.main' : 'text.disabled' }} />
                      <Typography variant="caption" color={chapter.videoUrl ? 'success.main' : 'text.disabled'}>
                        {chapter.videoUrl ? '视频已上传' : '视频未上传'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        创建: {new Date(chapter.createdAt).toLocaleDateString('zh-CN')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        更新: {new Date(chapter.updatedAt).toLocaleDateString('zh-CN')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                
                {/* 卡片操作区域 */}
                <CardActions sx={{ p: 2, pt: 0, flexDirection: 'column', gap: 1.5 }}>
                  {/* 操作按钮 */}
                  <Box sx={{ display: 'flex', gap: 0.3, width: '100%', flexWrap: 'nowrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(chapter)}
                      sx={{
                        flex: 1,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        px: 1,
                        py: 0.5,
                        minWidth: 'auto',
                        fontSize: '0.75rem',
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      编辑
                    </Button>
                    
                    {chapter.status === 'draft' ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePublish(chapter)}
                        startIcon={<Publish />}
                        color="primary"
                        sx={{
                          flex: 1,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500,
                          px: 1,
                          py: 0.5,
                          minWidth: 'auto',
                          fontSize: '0.75rem',
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        发布
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleUnpublish(chapter)}
                        startIcon={<Cancel />}
                        color="primary"
                        sx={{
                          flex: 1,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 500,
                          px: 1,
                          py: 0.5,
                          minWidth: 'auto',
                          fontSize: '0.75rem',
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        取消发布
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleVideoUploadOpen(chapter)}
                      startIcon={chapter.videoUrl ? <VideoFile /> : <Upload />}
                      color="primary"
                      sx={{
                        flex: 1,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        px: 1,
                        py: 0.5,
                        minWidth: 'auto',
                        fontSize: '0.75rem',
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      {chapter.videoUrl ? '管理视频' : '上传视频'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDeleteClick(chapter)}
                      startIcon={<Delete />}
                      color="error"
                      sx={{
                        flex: 1,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        px: 1,
                        py: 0.5,
                        minWidth: 'auto',
                        fontSize: '0.75rem',
                        borderColor: alpha(theme.palette.error.main, 0.5),
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          borderColor: theme.palette.error.main,
                          bgcolor: alpha(theme.palette.error.main, 0.04)
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



      {/* 创建/编辑章节对话框 */}
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
            {editingChapter ? '编辑章节' : '创建章节'}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="章节名称 *"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
              required
              helperText="请输入章节的完整标题，如：第一章 导论"
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
            <FormControl fullWidth required variant="outlined" sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}>
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
            disabled={submitting || !formData.title.trim() || !formData.description.trim()}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
              }
            }}
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
            确认删除章节
          </Typography>
          <IconButton 
            onClick={handleDeleteCancel} 
            sx={{ 
              color: 'white',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.1)' 
              }
            }}
          >
            <Cancel />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确定要删除章节「{chapterToDelete?.title}」吗？
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
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
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleting}
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
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(211, 47, 47, 0.3)',
              }
            }}
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

      {/* 视频上传对话框 */}
      <Dialog
        open={videoUploadOpen}
        onClose={handleVideoUploadClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'info.main', 
          color: 'white',
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            上传章节学习视频 - {uploadingChapter?.title}
          </Typography>
          <IconButton 
            onClick={handleVideoUploadClose} 
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body1">
              请选择一个视频文件作为本章节的学习视频
            </Typography>
            
            {uploadingChapter?.videoUrl && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                当前已存在学习视频，上传新视频将替换现有视频。
              </Alert>
            )}
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'info.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'rgba(33, 150, 243, 0.05)',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'info.dark',
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                }
              }}
              onClick={() => document.getElementById('video-upload-input')?.click()}
            >
              <input
                id="video-upload-input"
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                style={{ display: 'none' }}
              />
              <VideoFile sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" color="info.main" sx={{ mb: 1 }}>
                点击选择视频文件
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支持格式：MP4, WebM, AVI, MOV
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最大文件大小：500MB
              </Typography>
            </Box>
            
            {videoFile && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  已选择文件：
                </Typography>
                <Typography variant="body2">
                  {videoFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  文件大小：{(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={handleVideoUploadClose} 
            disabled={videoUploading}
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
            onClick={handleVideoUpload} 
            variant="contained"
            color="info"
            disabled={!videoFile || videoUploading}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(33, 150, 243, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(33, 150, 243, 0.3)',
              }
            }}
          >
            {videoUploading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                上传中...
              </>
            ) : (
              '上传视频'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '& .MuiAlert-icon': {
              fontSize: 24,
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChapterManagement;