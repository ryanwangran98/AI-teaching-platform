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
  VideoLibrary,
  PictureAsPdf,
  Description,
  Image,
  MusicNote,
  Folder,
  FolderOpen,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { materialAPI, chapterAPI, courseAPI } from '../../services/api';
import api from '../../services/api';


interface Material {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'DOC' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'OTHER';
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

interface MaterialFormData {
  title: string;
  description: string;
  type: 'VIDEO' | 'PDF' | 'DOC' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'OTHER';
  chapterId?: string;
  file?: File;
}

const MaterialManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>(); // 从路径参数获取当前课程ID
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // 新增的状态变量
  const [formData, setFormData] = useState<MaterialFormData>({
    title: '',
    description: '',
    type: 'PDF',
    chapterId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentCourse, setCurrentCourse] = useState<{id: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId(); // 生成唯一ID

  useEffect(() => {
    console.log('MaterialManagement useEffect triggered, courseId:', courseId);
    if (courseId) {
      fetchMaterials();
      fetchChapters();
      fetchCurrentCourse();
    } else {
      console.log('No courseId provided');
      setError('未指定课程ID，请从课程管理页面进入');
      setLoading(false);
    }
  }, [courseId]); // 添加 courseId 作为依赖项

  const fetchMaterials = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching materials for courseId:', courseId);
      setLoading(true);
      const response = await materialAPI.getMaterials({ courseId });
      console.log('Materials response:', response);
      const data = response.data || response;
      setMaterials(Array.isArray(data) ? data : data.materials || []);
      setError(null);
    } catch (error: any) {
      console.error('获取资料失败:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('获取资料失败，请稍后重试');
      setMaterials([]); // 确保是数组
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching chapters for courseId:', courseId);
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
      setChapters([]);
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
    setEditingMaterial(null);
    setFormData({
      title: '',
      description: '',
      type: 'PDF',
      chapterId: '',
    });
    setOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      chapterId: material.chapter?.id || '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMaterial(null);
    setFormData({
      title: '',
      description: '',
      type: 'PDF',
      chapterId: '',
    });
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!editingMaterial && !formData.file) {
        setError('请选择要上传的文件');
        setSubmitting(false);
        return;
      }

      if (editingMaterial) {
        // 编辑现有资料 - 只更新元数据，不上传文件
        const materialData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          chapterId: formData.chapterId && formData.chapterId.trim() ? formData.chapterId : undefined,
        };
        
        await materialAPI.updateMaterial(editingMaterial.id, materialData);
      } else {
        // 创建新资料 - 上传文件和元数据
        if (!formData.file) {
          setError('请选择要上传的文件');
          setSubmitting(false);
          return;
        }
        
        const materialData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          chapterId: formData.chapterId && formData.chapterId.trim() ? formData.chapterId : undefined,
          file: formData.file,
        };
        
        await materialAPI.createMaterial(materialData);
      }
      
      // 重新获取资料列表
      await fetchMaterials();
      handleClose();
    } catch (error: any) {
      console.error('保存资料失败:', error);
      setError(`保存资料失败: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (window.confirm('确定要删除这个资料吗？')) {
      try {
        await materialAPI.deleteMaterial(materialId);
        await fetchMaterials(); // 重新获取资料列表
      } catch (error: any) {
        console.error('删除资料失败:', error);
        alert(`删除资料失败: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handlePublish = async (materialId: string) => {
    try {
      await materialAPI.updateMaterial(materialId, { status: 'published' });
      await fetchMaterials(); // 重新获取资料列表
    } catch (error: any) {
      console.error('发布资料失败:', error);
      alert(`发布资料失败: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUnpublish = async (materialId: string) => {
    try {
      await materialAPI.updateMaterial(materialId, { status: 'draft' });
      await fetchMaterials(); // 重新获取资料列表
    } catch (error: any) {
      console.error('取消发布资料失败:', error);
      alert(`取消发布资料失败: ${error.response?.data?.error || error.message}`);
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

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || material.type === selectedType;
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
      'VIDEO': 'primary',
      'PDF': 'error',
      'DOC': 'info',
      'IMAGE': 'success',
      'AUDIO': 'warning',
      'ZIP': 'secondary',
      'OTHER': 'default'
    };
    return colorMap[type] || 'default';
  };

  const getTypeText = (type: string) => {
    const textMap: Record<string, string> = {
      'VIDEO': '视频',
      'PDF': 'PDF文档',
      'DOC': '文档',
      'IMAGE': '图片',
      'AUDIO': '音频',
      'ZIP': '压缩包',
      'OTHER': '其他'
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
            资料管理
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => { fetchMaterials(); fetchChapters(); }}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和返回按钮 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/teacher/courses')}
            sx={{ 
              mr: 2, 
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            返回课程列表
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
              <FolderOpen />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                资料管理
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {currentCourse?.name || '未知课程'}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${filteredMaterials.length} 个资料`} 
            color="primary" 
            variant="outlined"
            size="small"
          />
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                sx={{ borderRadius: 1, boxShadow: 'none' }}
              >
                上传资料
              </Button>
            </Grid>
            
            {/* 搜索和筛选 */}
            <Grid item xs={12} sm={6} md={4} sx={{ ml: 'auto' }}>
              <TextField
                placeholder="搜索资料"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                  <MenuItem value="VIDEO">视频</MenuItem>
                  <MenuItem value="PDF">PDF文档</MenuItem>
                  <MenuItem value="DOC">文档</MenuItem>
                  <MenuItem value="IMAGE">图片</MenuItem>
                  <MenuItem value="AUDIO">音频</MenuItem>
                  <MenuItem value="ZIP">压缩包</MenuItem>
                  <MenuItem value="OTHER">其他</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 资料列表 */}
      <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>资料信息</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>类型</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>大小</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>上传时间</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>下载次数</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.map((material) => (
                <React.Fragment key={material.id}>
                  <TableRow 
                    hover
                    sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            mr: 2, 
                            bgcolor: getTypeColor(material.type) === 'primary' ? theme.palette.primary.main : 
                                      getTypeColor(material.type) === 'error' ? theme.palette.error.main :
                                      getTypeColor(material.type) === 'success' ? theme.palette.success.main :
                                      getTypeColor(material.type) === 'warning' ? theme.palette.warning.main :
                                      getTypeColor(material.type) === 'info' ? theme.palette.info.main :
                                      theme.palette.secondary.main
                          }}
                        >
                          {material.type === 'VIDEO' && <VideoLibrary />}
                          {material.type === 'PDF' && <PictureAsPdf />}
                          {material.type === 'DOC' && <Description />}
                          {material.type === 'IMAGE' && <Image />}
                          {material.type === 'AUDIO' && <MusicNote />}
                          {material.type === 'ZIP' && <Folder />}
                          {material.type === 'OTHER' && <Folder />}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {material.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {material.description}
                          </Typography>
                          {material.chapter && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Folder sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="textSecondary">
                                章节: {material.chapter.title}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getTypeText(material.type)} 
                        color={getTypeColor(material.type)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(material.status)} 
                        color={getStatusColor(material.status)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(material.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {material.downloads}
                      </Typography>
                    </TableCell>
                    <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.5 }}>
                      <Button 
                        size="small" 
                        onClick={() => handlePreview(material.fileUrl)}
                        variant="outlined"
                        startIcon={<Visibility />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        预览
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleDownload(material.fileUrl, material.title)}
                        variant="outlined"
                        startIcon={<Download />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        下载
                      </Button>
                      {material.status === 'draft' ? (
                        <Button 
                          size="small" 
                          onClick={() => handlePublish(material.id)}
                          variant="outlined"
                          startIcon={<Publish />}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            '&:hover': { 
                              bgcolor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                          }}
                        >
                          发布
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          onClick={() => handleUnpublish(material.id)}
                          variant="outlined"
                          startIcon={<Cancel />}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            '&:hover': { 
                              bgcolor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                          }}
                        >
                          取消发布
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        onClick={() => handleEdit(material)}
                        variant="outlined"
                        startIcon={<Edit />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        编辑
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleDelete(material.id)}
                        variant="outlined"
                        startIcon={<Delete />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
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
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
            {editingMaterial ? <Edit /> : <Upload />}
          </Avatar>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {editingMaterial ? '编辑资料' : '上传资料'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            id={fileInputId}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={!!editingMaterial} // 编辑时禁用文件选择
          />
          
          {!editingMaterial && (
            <Box 
              sx={{ 
                mb: 3, 
                p: 2, 
                border: `2px dashed ${theme.palette.primary.main}`,
                borderRadius: 1,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              <Button
                variant="text"
                component="label"
                htmlFor={fileInputId}
                startIcon={<Upload />}
                disabled={uploading}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: theme.palette.primary.main
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
            label="资料标题"
            variant="outlined"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="资料描述"
            variant="outlined"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>资料类型</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              label="资料类型"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="VIDEO">视频</MenuItem>
              <MenuItem value="PDF">PDF文档</MenuItem>
              <MenuItem value="DOC">文档</MenuItem>
              <MenuItem value="IMAGE">图片</MenuItem>
              <MenuItem value="AUDIO">音频</MenuItem>
              <MenuItem value="ZIP">压缩包</MenuItem>
              <MenuItem value="OTHER">其他</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>关联章节</InputLabel>
            <Select
              value={formData.chapterId || ''}
              onChange={(e) => handleFormChange('chapterId', e.target.value)}
              label="关联章节"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="">无关联章节</MenuItem>
              {chapters.map(chapter => (
                <MenuItem key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            color="primary"
            disabled={submitting || (!editingMaterial && !formData.file)}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialManagement;