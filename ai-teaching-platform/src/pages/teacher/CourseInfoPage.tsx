import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import { Book, School, AccessTime, Group } from '@mui/icons-material';

interface CourseInfoPageProps {
  course: {
    id: string;
    name: string;
    code: string;
    description: string;
    department: string;
    credits: number;
    status: 'active' | 'inactive' | 'draft';
    studentCount?: number;
    totalHours?: number;
  };
}

const CourseInfoPage: React.FC<CourseInfoPageProps> = ({ course }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '开课中';
      case 'inactive': return '已结课';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        课程信息
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={course.name}
              subheader={`课程代码: ${course.code}`}
              action={
                <Chip 
                  label={getStatusText(course.status)} 
                  color={getStatusColor(course.status) as any}
                  size="small"
                />
              }
            />
            <Divider />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                课程描述
              </Typography>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School color="primary" />
                    <Typography variant="body2">
                      <strong>学院:</strong> {course.department}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Book color="primary" />
                    <Typography variant="body2">
                      <strong>学分:</strong> {course.credits}学分
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group color="primary" />
                    <Typography variant="body2">
                      <strong>学生数:</strong> {course.studentCount || 0}人
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime color="primary" />
                    <Typography variant="body2">
                      <strong>总学时:</strong> {course.totalHours || (course.credits * 16)}小时
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="使用说明" />
            <Divider />
            <CardContent>
              <Typography variant="body2" paragraph>
                欢迎使用课程资源管理系统！您可以通过左侧导航栏管理课程的各种资源：
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li><strong>课件管理</strong> - 上传和管理课程课件</li>
                  <li><strong>资料管理</strong> - 上传和管理学习资料</li>
                  <li><strong>章节管理</strong> - 组织课程章节结构</li>
                  <li><strong>知识点管理</strong> - 管理课程知识点</li>
                  <li><strong>题库管理</strong> - 创建和管理题目</li>
                  <li><strong>作业管理</strong> - 布置和批改作业</li>
                </ul>
              </Typography>
              <Typography variant="body2" paragraph>
                请选择左侧菜单中的任意一项开始管理您的课程资源。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseInfoPage;