import React, { useState, useEffect, useRef, useId } from 'react';
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
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
  alpha,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Upload,
  Edit,
  Delete,
  Visibility,
  Download,
  Search,
  Add,
  Link,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  Publish,
  Cancel,
  Slideshow,
  PictureAsPdf,
  VideoLibrary,
  Apps,
  Folder,
  Info,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { coursewareAPI, chapterAPI, courseAPI } from '../../services/api';
import api from '../../services/api';


// 修改课件类型定义以匹配数据库
interface Courseware {
  id: string;
  title: string;
  type: 'SLIDES' | 'DOCUMENT' | 'VIDEO' | 'INTERACTIVE';
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  downloads: number;
  description: string;
  chapter?: {
    id: string;
    title: string;
    course?: {
      id: string;
      title: string;
    };
  };
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CoursewareFormData {
  title: string;
  description: string;
  type: 'SLIDES' | 'DOCUMENT' | 'VIDEO' | 'INTERACTIVE';
  chapterId?: string;
  file?: File;
}

const CoursewareManagement: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>(); // 从路径参数获取当前课程ID
  const theme = useTheme();
  const [coursewares, setCoursewares] = useState<Courseware[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingCourseware, setEditingCourseware] = useState<Courseware | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CoursewareFormData>({
    title: '',
    description: '',
    type: 'SLIDES',
    chapterId: '',
  });
  
  // 新增的状态变量
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chapters, setChapters] = useState<Array<{id: string, title: string}>>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [currentCourse, setCurrentCourse] = useState<{id: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId(); // 生成唯一ID

  useEffect(() => {
    console.log('CoursewareManagement useEffect triggered, courseId:', courseId);
    if (courseId) {
      fetchCoursewares();
      fetchChapters();
      fetchCurrentCourse();
    } else {
      console.log('No courseId provided');
      setError('未指定课程ID，请从课程管理页面进入');
      setLoading(false);
    }
  }, [courseId]); // 添加 courseId 作为依赖项

  const fetchCoursewares = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching coursewares for courseId:', courseId);
      setLoading(true);
      const response = await coursewareAPI.getCoursewares({ courseId });
      console.log('Coursewares response:', response);
      const data = response.data || response;
      setCoursewares(Array.isArray(data) ? data : data.coursewares || []);
      setError(null);
    } catch (error: any) {
      console.error('获取课件失败:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('获取课件失败，请稍后重试');
      setCoursewares([]); // 确保是数组
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching chapters for courseId:', courseId);
      // 获取所有状态的章节，包括草稿和已发布的
      const response = await chapterAPI.getChapters(courseId, 'all');
      console.log('Chapters response:', response);
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      
      const mappedChapters = chaptersData.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title || chapter.name || '未知章节'
      }));
      
      setChapters(mappedChapters);
    } catch (error: any) {
      console.error('获取章节失败:', error);
      console.error('Error details:', error.response?.data || error.message);
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
      console.log('Fetching course info for courseId:', courseId);
      const response = await courseAPI.getCourse(courseId);
      console.log('Course info response:', response);
      const courseData = response.data || response;
      
      setCurrentCourse({
        id: courseData.id,
        name: courseData.name || courseData.title || '未命名课程'
      });
    } catch (error: any) {
      console.error('获取课程信息失败:', error);
      console.error('Error details:', error.response?.data || error.message);
      setCurrentCourse({
        id: courseId,
        name: '未知课程'
      });
    }
  };

  const handleCreate = () => {
    setEditingCourseware(null);
    setFormData({
      title: '',
      description: '',
      type: 'SLIDES',
      chapterId: '',
    });
    setOpen(true);
  };

  const handleEdit = (courseware: Courseware) => {
    setEditingCourseware(courseware);
    setFormData({
      title: courseware.title,
      description: courseware.description,
      type: courseware.type,
      chapterId: courseware.chapter?.id || '',
    });
    if (courseware.chapter?.id) {
      setSelectedChapter(courseware.chapter.id);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCourseware(null);
    setFormData({
      title: '',
      description: '',
      type: 'SLIDES',
      chapterId: '',
    });
    setSelectedChapter('');
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!editingCourseware && !formData.file) {
        setError('请选择要上传的文件');
        setSubmitting(false);
        return;
      }

      if (editingCourseware) {
        // 编辑现有课件 - 只更新元数据，不上传文件
        const coursewareData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          chapterId: formData.chapterId && formData.chapterId.trim() ? formData.chapterId : undefined,
        };
        
        await coursewareAPI.updateCourseware(editingCourseware.id, coursewareData);
      } else {
        // 创建新课件 - 上传文件和元数据
        if (!formData.file) {
          setError('请选择要上传的文件');
          setSubmitting(false);
          return;
        }
        
        const coursewareData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          chapterId: formData.chapterId && formData.chapterId.trim() ? formData.chapterId : undefined,
          file: formData.file,
        };
        
        await coursewareAPI.createCourseware(coursewareData);
      }
      
      // 重新获取课件列表
      await fetchCoursewares();
      handleClose();
    } catch (error: any) {
      console.error('保存课件失败:', error);
      setError(`保存课件失败: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coursewareId: string) => {
    if (window.confirm('确定要删除这个课件吗？')) {
      try {
        await coursewareAPI.deleteCourseware(coursewareId);
        await fetchCoursewares(); // 重新获取课件列表
      } catch (error: any) {
        console.error('删除课件失败:', error);
        alert(`删除课件失败: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handlePublish = async (coursewareId: string) => {
    try {
      await coursewareAPI.updateCourseware(coursewareId, { status: 'published' });
      await fetchCoursewares(); // 重新获取课件列表
    } catch (error: any) {
      console.error('发布课件失败:', error);
      alert(`发布课件失败: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUnpublish = async (coursewareId: string) => {
    try {
      await coursewareAPI.updateCourseware(coursewareId, { status: 'draft' });
      await fetchCoursewares(); // 重新获取课件列表
    } catch (error: any) {
      console.error('取消发布课件失败:', error);
      alert(`取消发布课件失败: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.split('.')[0]
      }));
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 构建完整的文件URL用于预览
  const getFullFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    return fileUrl.startsWith('http') ? fileUrl : `http://localhost:3001${fileUrl}`;
  };

  const handlePreview = (fileUrl: string) => {
    const fullUrl = getFullFileUrl(fileUrl);
    window.open(fullUrl, '_blank');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const fullUrl = getFullFileUrl(fileUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCoursewares = coursewares.filter(courseware => {
    const matchesSearch = courseware.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseware.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || courseware.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
      'SLIDES': 'primary',
      'DOCUMENT': 'info',
      'VIDEO': 'warning',
      'INTERACTIVE': 'success'
    };
    return colorMap[type] || 'default';
  };

  const getTypeText = (type: string) => {
    const textMap: Record<string, string> = {
      'SLIDES': '幻灯片',
      'DOCUMENT': '文档',
      'VIDEO': '视频',
      'INTERACTIVE': '互动内容'
    };
    return textMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'published': '已发布',
      'archived': '已归档'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      'draft': 'warning',
      'published': 'success',
      'archived': 'default'
    };
    return colorMap[status] || 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            返回
          </Button>
          <Typography variant="h4" component="h1">
            课件管理
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => { fetchCoursewares(); fetchChapters(); }}>
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
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
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
            <Slideshow />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              课件管理
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
                上传课件
              </Button>
            </Grid>
            
            {/* 搜索和筛选 */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                placeholder="搜索课件"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={5}>
              <FormControl size="small" fullWidth>
                <InputLabel>类型</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="类型"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    },
                    minWidth: 120,
                  }}
                >
                  <MenuItem value="">全部类型</MenuItem>
                  <MenuItem value="SLIDES">幻灯片</MenuItem>
                  <MenuItem value="DOCUMENT">文档</MenuItem>
                  <MenuItem value="VIDEO">视频</MenuItem>
                  <MenuItem value="INTERACTIVE">互动内容</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip 
                label={`${filteredCoursewares.length} 个课件`}
                color="primary"
                variant="outlined"
                sx={{ height: 36, width: '100%' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 课件列表 */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>课件信息</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>类型</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>大小</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>上传时间</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>下载次数</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCoursewares.map((courseware) => (
                <React.Fragment key={courseware.id}>
                  <TableRow 
                    hover
                    sx={{ 
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: courseware.type === 'SLIDES' ? 
                              theme.palette.primary.main : 
                              courseware.type === 'DOCUMENT' ?
                              theme.palette.info.main :
                              courseware.type === 'VIDEO' ?
                              theme.palette.warning.main :
                              theme.palette.success.main
                          }}
                        >
                          {courseware.type === 'SLIDES' ? <Slideshow /> : 
                           courseware.type === 'DOCUMENT' ? <PictureAsPdf /> :
                           courseware.type === 'VIDEO' ? <VideoLibrary /> :
                           <Apps />}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {courseware.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {courseware.description}
                          </Typography>
                          {courseware.chapter && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Folder fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="textSecondary">
                                {courseware.chapter.title}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getTypeText(courseware.type)} 
                        color={getTypeColor(courseware.type)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(courseware.status)} 
                        color={getStatusColor(courseware.status)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatFileSize(courseware.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(courseware.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {courseware.downloads}
                      </Typography>
                    </TableCell>
                    <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.5 }}>
                      <Button 
                        size="small" 
                        onClick={() => handlePreview(courseware.fileUrl)}
                        variant="outlined"
                        startIcon={<Visibility />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        预览
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleDownload(courseware.fileUrl, courseware.title)}
                        variant="outlined"
                        startIcon={<Download />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        下载
                      </Button>
                      {courseware.status === 'draft' ? (
                        <Button 
                          size="small" 
                          onClick={() => handlePublish(courseware.id)}
                          variant="outlined"
                          startIcon={<Publish />}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)',
                            }
                          }}
                        >
                          发布
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          onClick={() => handleUnpublish(courseware.id)}
                          variant="outlined"
                          startIcon={<Cancel />}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
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
                        onClick={() => handleEdit(courseware)}
                        variant="outlined"
                        startIcon={<Edit />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        编辑
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleDelete(courseware.id)}
                        variant="outlined"
                        startIcon={<Delete />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        删除
                      </Button>
                    </Box>
                  </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 上传/编辑对话框 */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                mr: 2,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText
              }}
            >
              {editingCourseware ? <Edit /> : <Upload />}
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {editingCourseware ? '编辑课件' : '上传课件'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ pt: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              id={fileInputId}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={!!editingCourseware} // 编辑时禁用文件选择
            />
            
            {!editingCourseware && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor={fileInputId}
                  startIcon={<Upload />}
                  disabled={uploading}
                  sx={{ 
                    py: 1.5,
                    px: 3,
                    borderRadius: 1.5,
                    border: `2px dashed ${theme.palette.primary.main}`,
                    '&:hover': {
                      border: `2px dashed ${theme.palette.primary.main}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }
                  }}
                >
                  {uploading ? '上传中...' : (formData.file ? formData.file.name : '选择文件')}
                </Button>
                {uploading && (
                  <CircularProgress size={20} sx={{ ml: 2 }} />
                )}
              </Box>
            )}
            
            <TextField
              fullWidth
              label="课件标题"
              variant="outlined"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="课件描述"
              variant="outlined"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>课件类型</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                label="课件类型"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="SLIDES">幻灯片</MenuItem>
                <MenuItem value="DOCUMENT">文档</MenuItem>
                <MenuItem value="VIDEO">视频</MenuItem>
                <MenuItem value="INTERACTIVE">互动内容</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>关联章节</InputLabel>
              <Select
                value={formData.chapterId || ''}
                onChange={(e) => handleFormChange('chapterId', e.target.value)}
                label="关联章节"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="">无关联章节</MenuItem>
                {chapters.map(chapter => (
                  <MenuItem key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              borderRadius: 1.5,
              px: 3
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            color="primary"
            disabled={submitting || (!editingCourseware && !formData.file)}
            sx={{ 
              borderRadius: 1.5,
              px: 3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }
            }}
          >
            {editingCourseware ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursewareManagement;