import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Search,
  School,
  Group,
  AccessTime,
  Assessment
} from '@mui/icons-material';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
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
}

// interface Chapter {
//   id: string;
//   title: string;
//   duration: number;
//   order: number;
//   completed: boolean;
// }

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      code: 'MATH101',
      name: '高等数学',
      description: '本课程涵盖微积分的基本概念和应用，包括极限、导数、积分等内容。',
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
    },
    {
      id: '2',
      code: 'CS101',
      name: '程序设计基础',
      description: '介绍程序设计的基本概念和方法，使用Python语言进行实践。',
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
    },
    {
      id: '3',
      code: 'ENG101',
      name: '大学英语',
      description: '培养学生的英语听说读写能力，提高综合语言运用水平。',
      teacher: '张教授',
      credits: 2,
      semester: '2023-2024学年第一学期',
      status: 'active',
      studentCount: 234,
      completedHours: 16,
      totalHours: 32,
      startDate: '2024-02-26',
      endDate: '2024-06-30',
      category: '英语',
      prerequisites: [],
      tags: ['基础课程', '语言', '必修'],
    },
    {
      id: '4',
      code: 'PHYS101',
      name: '大学物理',
      description: '介绍物理学基本概念和原理，包括力学、热学、电磁学等内容。',
      teacher: '赵教授',
      credits: 3,
      semester: '2023-2024学年第一学期',
      status: 'draft',
      studentCount: 0,
      totalHours: 48,
      completedHours: 0,
      startDate: '2024-03-01',
      endDate: '2024-07-01',
      category: '物理',
      prerequisites: ['高中物理', '高等数学'],
      tags: ['基础课程', '理科', '实验'],
    },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleCreate = () => {
    setSelectedCourse(null);
    setOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCourse(null);
  };

  const handleDelete = (id: string) => {
    setCourses(courses.filter(course => course.id !== id));
  };

//  const handleStatusChange = (id: string, status: Course['status']) => {
//    setCourses(courses.map(course => 
//      course.id === id ? { ...course, status } : course
//    ));
//  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '开课中';
      case 'inactive': return '已结课';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">课程管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          新建课程
        </Button>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>总课程数</Typography>
              </Box>
              <Typography variant="h4">{courses.length}</Typography>
              <Typography variant="body2" color="textSecondary">
                开课中: {courses.filter(c => c.status === 'active').length} |
                草稿: {courses.filter(c => c.status === 'draft').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Group color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>总学生数</Typography>
              </Box>
              <Typography variant="h4">
                {courses.reduce((sum, course) => sum + course.studentCount, 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                平均每门 {Math.round(courses.reduce((sum, course) => sum + course.studentCount, 0) / courses.length)} 人
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>总学时</Typography>
              </Box>
              <Typography variant="h4">
                {courses.reduce((sum, course) => sum + course.totalHours, 0)}小时
              </Typography>
              <Typography variant="body2" color="textSecondary">
                已完成 {Math.round(courses.reduce((sum, course) => sum + course.completedHours, 0))}小时
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color="warning" />
                <Typography variant="h6" sx={{ ml: 1 }}>总学分</Typography>
              </Box>
              <Typography variant="h4">
                {courses.reduce((sum, course) => sum + course.credits, 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                平均学分 {Math.round(courses.reduce((sum, course) => sum + course.credits, 0) / courses.length)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 搜索和筛选 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索课程名称、代码或教师"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>状态</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="状态"
          >
            <MenuItem value="all">全部状态</MenuItem>
            <MenuItem value="active">开课中</MenuItem>
            <MenuItem value="inactive">已结课</MenuItem>
            <MenuItem value="draft">草稿</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 课程列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>课程信息</TableCell>
              <TableCell>教师</TableCell>
              <TableCell>学分</TableCell>
              <TableCell>学生数</TableCell>
              <TableCell>进度</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {course.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {course.code}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {course.description.substring(0, 50)}...
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{course.teacher}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{course.credits}学分</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{course.studentCount}人</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(course.completedHours / course.totalHours) * 100}
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round((course.completedHours / course.totalHours) * 100)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(course.status)}
                    color={getStatusColor(course.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 创建/编辑课程对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCourse ? '编辑课程' : '新建课程'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="课程代码"
                  variant="outlined"
                  defaultValue={selectedCourse?.code || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="课程名称"
                  variant="outlined"
                  defaultValue={selectedCourse?.name || ''}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="课程描述"
                  variant="outlined"
                  defaultValue={selectedCourse?.description || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="授课教师"
                  variant="outlined"
                  defaultValue={selectedCourse?.teacher || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="学分"
                  variant="outlined"
                  type="number"
                  defaultValue={selectedCourse?.credits || 0}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="总学时"
                  variant="outlined"
                  type="number"
                  defaultValue={selectedCourse?.totalHours || 0}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="开始日期"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={selectedCourse?.startDate || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="结束日期"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={selectedCourse?.endDate || ''}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="标签 (用逗号分隔)"
                  variant="outlined"
                  defaultValue={selectedCourse?.tags.join(', ') || ''}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button variant="contained">
            {selectedCourse ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;