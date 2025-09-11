import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import { 
  useNavigate 
} from 'react-router-dom';
import { 
  courseAPI 
} from '../../services/api';
import { 
  ArrowBack 
} from '@mui/icons-material';

interface CourseFormData {
  name: string;
  code: string;
  description: string;
  department: string;
  category: string;
  credits: number;
  level: string;
  tags: string[];
}

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    code: '',
    description: '',
    department: '计算机学院',
    category: '计算机',
    credits: 3,
    level: '本科',
    tags: []
  });

  const departments = [
    '计算机学院',
    '数学学院',
    '物理学院',
    '化学学院',
    '生物学院',
    '经济学院',
    '管理学院',
    '外国语学院'
  ];

  const categories = [
    '计算机',
    '数学',
    '物理',
    '化学',
    '生物',
    '经济',
    '管理',
    '语言'
  ];

  const levels = ['本科', '硕士', '博士'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 构造符合后端API期望的数据结构
      const courseData = {
        title: formData.name,
        code: formData.code,
        description: formData.description,
        college: formData.department,
        category: formData.category,
        credits: formData.credits,
        level: formData.level,
        tags: formData.tags
      };
      
      console.log('发送课程创建请求:', courseData);
      
      await courseAPI.createCourse(courseData);
      navigate('/teacher/courses');
    } catch (err: any) {
      console.error('创建课程失败:', err);
      setError(err.response?.data?.message || err.response?.data?.error || '创建课程失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 添加返回按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => navigate('/teacher/courses')} 
          sx={{ mr: 2 }}
          title="返回我的课程"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
          创建新课程
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="课程名称"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="课程代码"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                helperText="例如：CS101, MATH201"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="课程描述"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>学院</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleSelectChange}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>课程分类</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="学分"
                name="credits"
                type="number"
                value={formData.credits}
                onChange={handleChange}
                inputProps={{ min: 1, max: 10 }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>课程级别</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  onChange={handleSelectChange}
                >
                  {levels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="课程标签 (用逗号分隔)"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setFormData(prev => ({ ...prev, tags }));
                }}
                helperText="例如：编程, 基础, 必修"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/teacher/courses')}
                  startIcon={<ArrowBack />}
                >
                  返回
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? '创建中...' : '创建课程'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateCourse;