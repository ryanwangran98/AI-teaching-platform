import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Container,
  Pagination,
  InputAdornment,
  Rating
} from '@mui/material';
import { Search, School, Person, Schedule, Star, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  teacher: string;
  credits: number;
  semester: string;
  status: 'active' | 'inactive' | 'draft';
  studentCount: number;
  totalHours: number;
  completedHours: number;
  startDate: string;
  endDate: string;
  category: string;
  prerequisites: string[];
  tags: string[];
  rating: number;
  imageUrl?: string;
}

const CourseBrowser: React.FC = () => {
  const navigate = useNavigate();

  // 模拟课程数据
  const [courses] = useState<Course[]>([
    {
      id: '1',
      code: 'MATH101',
      name: '高等数学',
      description: '本课程涵盖微积分的基本概念和应用，包括极限、导数、积分等内容。适合理工科学生系统学习高等数学知识。',
      department: '数学学院',
      teacher: '李教授',
      credits: 4,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 156,
      totalHours: 64,
      completedHours: 32,
      startDate: '2024-02-26',
      endDate: '2024-06-30',
      category: '数学',
      prerequisites: ['高中数学'],
      tags: ['基础课程', '必修', '理论'],
      rating: 4.8,
      imageUrl: '/images/math-course.jpg',
    },
    {
      id: '2',
      code: 'CS101',
      name: '程序设计基础',
      description: '介绍程序设计的基本概念和方法，使用Python语言进行实践。适合零基础学生入门编程。',
      department: '计算机学院',
      teacher: '王教授',
      credits: 3,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 89,
      totalHours: 48,
      completedHours: 24,
      startDate: '2024-02-26',
      endDate: '2024-06-30',
      category: '计算机',
      prerequisites: [],
      tags: ['基础课程', '编程', '实践'],
      rating: 4.6,
      imageUrl: '/images/cs-course.jpg',
    },
    {
      id: '3',
      code: 'ENG101',
      name: '大学英语',
      description: '培养学生的英语听说读写能力，提高综合语言运用水平。采用互动式教学方法。',
      department: '外国语学院',
      teacher: '张教授',
      credits: 2,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 234,
      totalHours: 32,
      completedHours: 16,
      startDate: '2024-02-26',
      endDate: '2024-06-30',
      category: '英语',
      prerequisites: [],
      tags: ['基础课程', '语言', '必修'],
      rating: 4.5,
      imageUrl: '/images/english-course.jpg',
    },
    {
      id: '4',
      code: 'PHYS101',
      name: '大学物理',
      description: '介绍物理学基本概念和原理，包括力学、热学、电磁学等内容。配合实验教学。',
      department: '物理学院',
      teacher: '赵教授',
      credits: 3,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 78,
      totalHours: 48,
      completedHours: 0,
      startDate: '2024-03-01',
      endDate: '2024-07-01',
      category: '物理',
      prerequisites: ['高中物理', '高等数学'],
      tags: ['基础课程', '理科', '实验'],
      rating: 4.7,
      imageUrl: '/images/physics-course.jpg',
    },
    {
      id: '5',
      code: 'CHEM101',
      name: '大学化学',
      description: '系统学习化学基本原理和实验技能，为后续专业课程打下基础。',
      department: '化学学院',
      teacher: '陈教授',
      credits: 3,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 65,
      totalHours: 48,
      completedHours: 20,
      startDate: '2024-02-26',
      endDate: '2024-06-30',
      category: '化学',
      prerequisites: ['高中化学'],
      tags: ['基础课程', '实验', '理科'],
      rating: 4.4,
      imageUrl: '/images/chemistry-course.jpg',
    },
    {
      id: '6',
      code: 'BIO101',
      name: '生命科学导论',
      description: '探索生命科学的奥秘，了解生物学基本知识和前沿发展。',
      department: '生命科学学院',
      teacher: '刘教授',
      credits: 2,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 45,
      totalHours: 32,
      completedHours: 12,
      startDate: '2024-03-01',
      endDate: '2024-06-30',
      category: '生物',
      prerequisites: [],
      tags: ['导论', '生命科学', '科普'],
      rating: 4.3,
      imageUrl: '/images/biology-course.jpg',
    },
  ]);

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // 获取唯一的学院和分类
  const departments = [...new Set(courses.map(course => course.department))];
  const categories = [...new Set(courses.map(course => course.category))];

  // 筛选和排序逻辑
  const filteredCourses = useMemo(() => {
    let filtered = courses.filter(course => course.status === 'active');

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 学院过滤
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(course => course.department === departmentFilter);
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'students':
          return b.studentCount - a.studentCount;
        case 'credits':
          return b.credits - a.credits;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, departmentFilter, categoryFilter, sortBy]);

  // 分页
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleEnroll = (courseId: string) => {
    // 这里可以添加选课逻辑
    console.log('Enrolling in course:', courseId);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        课程浏览
      </Typography>
      <Typography variant="h6" component="h2" textAlign="center" color="text.secondary" gutterBottom>
        探索丰富的课程资源，开启您的学习之旅
      </Typography>

      {/* 搜索和筛选区域 */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="搜索课程名称、教师或描述..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>学院</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="学院"
              >
                <MenuItem value="all">全部学院</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>分类</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="分类"
              >
                <MenuItem value="all">全部分类</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>排序</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="排序"
              >
                <MenuItem value="name">名称</MenuItem>
                <MenuItem value="rating">评分</MenuItem>
                <MenuItem value="students">学生数</MenuItem>
                <MenuItem value="credits">学分</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* 课程统计 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FilterList />
        <Typography variant="body2" color="text.secondary">
          共找到 {filteredCourses.length} 门课程
        </Typography>
      </Box>

      {/* 课程网格 */}
      <Grid container spacing={3}>
        {paginatedCourses.map((course) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={course.imageUrl || '/images/default-course.jpg'}
                alt={course.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography gutterBottom variant="h6" component="h3">
                    {course.name}
                  </Typography>
                  <Chip 
                    label={`${course.credits}学分`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {course.description.substring(0, 100)}...
                </Typography>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <School fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {course.department}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <Person fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {course.teacher}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={course.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({course.rating})
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {course.tags.slice(0, 3).map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  查看详情
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => handleEnroll(course.id)}
                >
                  立即选课
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 无结果提示 */}
      {paginatedCourses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            暂无符合条件的课程
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请尝试调整搜索条件或筛选选项
          </Typography>
        </Box>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
};

export default CourseBrowser;