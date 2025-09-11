import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search,
  Download,
  Visibility,
  PictureAsPdf,
  VideoLibrary,
  Description,
  AudioFile,
  Archive,
  Link as LinkIcon,
  Close,
  School,
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { materialAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Material {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'DOC' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'OTHER';
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
  course?: {
    id: string;
    title: string;
  };
}

interface MaterialsProps {
  courseId?: string; // 可选的课程ID参数
}

const Materials: React.FC<MaterialsProps> = ({ courseId: propCourseId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);

  // 确定使用的课程ID
  const effectiveCourseId = propCourseId || routeCourseId || '';

  // 从URL参数获取课程ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseId = params.get('courseId');
    if (courseId && !propCourseId && !routeCourseId) {
      setSelectedCourse(courseId);
    } else if (effectiveCourseId) {
      setSelectedCourse(effectiveCourseId);
    }
  }, [location, propCourseId, routeCourseId, effectiveCourseId]);

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, selectedType, selectedCourse, showAllCourses]);

  const fetchCourses = async () => {
    try {
      // 调用API获取学生已加入的课程
      const response = await courseAPI.getStudentCourses();
      const coursesData = response.data || response || [];
      
      // 转换课程数据格式
      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => ({
            id: course.id,
            title: course.title || course.name || '未命名课程'
          }))
        : [];
      
      setCourses(convertedCourses);
      
      // 如果没有选中课程且有课程数据，默认选择第一个
      if (!selectedCourse && convertedCourses.length > 0 && !effectiveCourseId) {
        setSelectedCourse(convertedCourses[0].id);
      }
    } catch (error) {
      console.error('获取课程列表失败:', error);
      setError('获取课程列表失败，请稍后重试');
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      // 调用API获取资料，根据选中的课程过滤
      const params: any = {};
      
      if (selectedCourse && !showAllCourses) {
        params.courseId = selectedCourse;
      }
      
      const response = await materialAPI.getMaterials(params);
      const data = response.data || response;
      setMaterials(Array.isArray(data) ? data : data.materials || []);
      setError(null);
    } catch (error) {
      console.error('获取资料失败:', error);
      setError('获取资料失败，请稍后重试');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let result = materials;
    
    if (searchTerm) {
      result = result.filter(material => 
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType) {
      result = result.filter(material => material.type === selectedType);
    }
    
    // 如果选择了特定课程且不显示所有课程，则过滤
    if (selectedCourse && !showAllCourses) {
      result = result.filter(material => 
        material.course?.id === selectedCourse || 
        material.chapter?.course?.id === selectedCourse
      );
    }
    
    setFilteredMaterials(result);
  };

  const handlePreview = (material: Material) => {
    setSelectedMaterial(material);
    setPreviewOpen(true);
  };

  const handleDownload = (material: Material) => {
    if (!material.fileUrl) {
      setError('文件路径无效，无法下载');
      return;
    }
    
    // 构建完整的文件URL
    const fileUrl = material.fileUrl.startsWith('http') 
      ? material.fileUrl 
      : `http://localhost:3001${material.fileUrl}`;
    
    // 创建一个临时链接进行下载
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = material.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 构建完整的文件URL用于预览
  const getFullFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    return fileUrl.startsWith('http') ? fileUrl : `http://localhost:3001${fileUrl}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <VideoLibrary color="primary" />;
      case 'PDF': return <PictureAsPdf color="error" />;
      case 'DOC': return <Description color="primary" />;
      case 'IMAGE': return <PictureAsPdf color="success" />;
      case 'AUDIO': return <AudioFile color="info" />;
      case 'ZIP': return <Archive color="warning" />;
      default: return <Description color="action" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO': return '视频';
      case 'PDF': return 'PDF';
      case 'DOC': return '文档';
      case 'IMAGE': return '图片';
      case 'AUDIO': return '音频';
      case 'ZIP': return '压缩包';
      case 'OTHER': return '其他';
      default: return type;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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
        <Button variant="contained" onClick={fetchMaterials}>
          重新加载
        </Button>
      </Box>
    );
  }

  // 获取当前课程的名称
  const currentCourse = courses.find(course => course.id === effectiveCourseId);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">学习资料</Typography>
        {effectiveCourseId && currentCourse && (
          <Chip
            label={currentCourse.title}
            color="primary"
            variant="filled"
          />
        )}
      </Box>

      {/* 课程选择和搜索筛选 - 当在特定课程页面时隐藏课程选择 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {!effectiveCourseId && (
          <>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>选择课程</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="选择课程"
              >
                {courses.map(course => (
                  <MenuItem key={course.id} value={course.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <School sx={{ mr: 1, fontSize: 16 }} />
                      <span>{course.title}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showAllCourses}
                  onChange={(e) => setShowAllCourses(e.target.checked)}
                />
              }
              label="显示所有课程资料"
            />
          </>
        )}
        
        <TextField
          placeholder="搜索资料..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>类型</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            label="类型"
          >
            <MenuItem value="">全部类型</MenuItem>
            <MenuItem value="VIDEO">视频</MenuItem>
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="DOC">文档</MenuItem>
            <MenuItem value="IMAGE">图片</MenuItem>
            <MenuItem value="AUDIO">音频</MenuItem>
            <MenuItem value="ZIP">压缩包</MenuItem>
            <MenuItem value="OTHER">其他</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 资料列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      ) : filteredMaterials.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            {selectedCourse && !showAllCourses 
              ? "该课程暂无资料" 
              : "暂无资料"}
          </Typography>
          {courses.length === 0 && !effectiveCourseId && (
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
              您尚未加入任何课程，请先到"我的课程"页面加入课程
            </Typography>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>资料名称</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>大小</TableCell>
                <TableCell>描述</TableCell>
                {/* 在特定课程页面隐藏关联课程列 */}
                {!effectiveCourseId && <TableCell>关联课程</TableCell>}
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTypeIcon(material.type)}
                      <Typography variant="body1" sx={{ ml: 1, fontWeight: 'bold' }}>
                        {material.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(material.type)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {material.description || '暂无描述'}
                    </Typography>
                  </TableCell>
                  {/* 在特定课程页面隐藏关联课程列 */}
                  {!effectiveCourseId && (
                    <TableCell>
                      {material.course ? (
                        <Chip
                          label={material.course.title}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : material.chapter?.course ? (
                        <Chip
                          label={material.chapter.course.title}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          未关联
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{formatDate(material.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => handlePreview(material)}
                      title="预览资料"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => handleDownload(material)}
                      title="下载资料"
                    >
                      <Download />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          资料预览
          <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedMaterial && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedMaterial.title}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>类型:</strong> {getTypeLabel(selectedMaterial.type)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>大小:</strong> {formatFileSize(selectedMaterial.fileSize)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>创建时间:</strong> {formatDate(selectedMaterial.createdAt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>更新时间:</strong> {formatDate(selectedMaterial.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="body1" gutterBottom>
                <strong>描述:</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {selectedMaterial.description || '暂无描述'}
              </Typography>
              \n              \n              <Box sx={{ mt: 2, textAlign: 'center' }}>
                {selectedMaterial.type === 'PDF' && (
                  <Box sx={{ 
                    height: 400, 
                    border: '1px solid #ccc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    position: 'relative'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <Box sx={{ textAlign: 'center', padding: 2, width: '100%' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          PDF文档预览
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          点击下方按钮在新标签页中查看PDF文件
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Visibility />}
                          onClick={() => {
                            const fullUrl = getFullFileUrl(selectedMaterial.fileUrl);
                            window.open(fullUrl, '_blank');
                          }}
                        >
                          在新标签页查看PDF
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        PDF文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
                
                {selectedMaterial.type === 'VIDEO' && (
                  <Box sx={{ 
                    height: 400, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#000',
                    position: 'relative'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <video
                        controls
                        width="100%"
                        height="100%"
                        style={{ maxHeight: '400px' }}
                      >
                        <source src={getFullFileUrl(selectedMaterial.fileUrl)} type="video/mp4" />
                        <source src={getFullFileUrl(selectedMaterial.fileUrl)} type="video/webm" />
                        <source src={getFullFileUrl(selectedMaterial.fileUrl)} type="video/ogg" />
                        您的浏览器不支持视频播放
                      </video>
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        视频文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
                
                {selectedMaterial.type === 'IMAGE' && (
                  <Box sx={{ 
                    height: 400, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    overflow: 'hidden'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <img
                        src={getFullFileUrl(selectedMaterial.fileUrl)}
                        alt={selectedMaterial.title}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        图片文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
                
                {(selectedMaterial.type === 'DOC' || selectedMaterial.type === 'OTHER') && (
                  <Box sx={{ 
                    height: 400, 
                    border: '1px solid #ccc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <Box sx={{ textAlign: 'center', padding: 2 }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {getTypeLabel(selectedMaterial.type)}文档预览
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          该文件类型可能需要下载后查看
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => handleDownload(selectedMaterial)}
                        >
                          下载文件
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>关闭</Button>
          {selectedMaterial && (
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={() => handleDownload(selectedMaterial)}
            >
              下载
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Materials;