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
  status: 'active' | 'inactive';
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

  const handlePreview = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
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
      'VIDEO': 'secondary',
      'INTERACTIVE': 'warning'
    };
    return colorMap[type] || 'default';
  };

  const getTypeText = (type: string) => {
    const textMap: Record<string, string> = {
      'SLIDES': '幻灯片',
      'DOCUMENT': '文档',
      'VIDEO': '视频',
      'INTERACTIVE': '互动课件'
    };
    return textMap[type] || type;
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teacher/courses')}
          sx={{ mr: 2 }}
        >
          返回课程列表
        </Button>
        <Typography variant="h4" component="h1">
          课件管理 - {currentCourse?.name || '未知课程'}
        </Typography>
      </Box>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            上传课件
          </Button>
        </Box>
        
        {/* 搜索和筛选 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="搜索课件"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ width: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>类型</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="类型"
            >
              <MenuItem value="">全部类型</MenuItem>
              <MenuItem value="SLIDES">幻灯片</MenuItem>
              <MenuItem value="DOCUMENT">文档</MenuItem>
              <MenuItem value="VIDEO">视频</MenuItem>
              <MenuItem value="INTERACTIVE">互动课件</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 课件列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>课件信息</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>大小</TableCell>
              <TableCell>上传时间</TableCell>
              <TableCell>下载次数</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCoursewares.map((courseware) => (
              <React.Fragment key={courseware.id}>
                <TableRow>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {courseware.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {courseware.description}
                      </Typography>
                      {courseware.chapter && (
                        <Typography variant="body2" color="textSecondary">
                          章节: {courseware.chapter.title}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeText(courseware.type)} 
                      color={getTypeColor(courseware.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatFileSize(courseware.fileSize)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(courseware.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {courseware.downloads}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handlePreview(courseware.fileUrl)}
                        title="预览"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDownload(courseware.fileUrl, courseware.title)}
                        title="下载"
                      >
                        <Download />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(courseware)}
                        title="编辑"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(courseware.id)}
                        title="删除"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 上传/编辑对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCourseware ? '编辑课件' : '上传课件'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              id={fileInputId}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={!!editingCourseware} // 编辑时禁用文件选择
            />
            
            {!editingCourseware && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor={fileInputId}
                  startIcon={<Upload />}
                  disabled={uploading}
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
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="课件描述"
              variant="outlined"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>课件类型</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                label="课件类型"
              >
                <MenuItem value="SLIDES">幻灯片</MenuItem>
                <MenuItem value="DOCUMENT">文档</MenuItem>
                <MenuItem value="VIDEO">视频</MenuItem>
                <MenuItem value="INTERACTIVE">互动课件</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>关联章节</InputLabel>
              <Select
                value={formData.chapterId || ''}
                onChange={(e) => handleFormChange('chapterId', e.target.value)}
                label="关联章节"
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
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={submitting || (!editingCourseware && !formData.file)}
          >
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursewareManagement;