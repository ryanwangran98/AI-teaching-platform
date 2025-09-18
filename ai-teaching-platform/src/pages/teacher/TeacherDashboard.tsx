import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import School from '@mui/icons-material/School';
import People from '@mui/icons-material/People';
import Assignment from '@mui/icons-material/Assignment';
import TrendingUp from '@mui/icons-material/TrendingUp';
import ListAlt from '@mui/icons-material/ListAlt';
import AddCircle from '@mui/icons-material/AddCircle';
import ExitToApp from '@mui/icons-material/ExitToApp';
import Description from '@mui/icons-material/Description';
import MenuBook from '@mui/icons-material/MenuBook';
import Notifications from '@mui/icons-material/Notifications';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { useAuth } from '../../contexts/AuthContext';
import { courseAPI, assignmentAPI, studentStatsAPI } from '../../services/api';

const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    weeklyActiveStudents: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取教师的课程
      const coursesResponse = await courseAPI.getMyCourses();
      let courses = [];
      
      // 适配不同的响应格式
      if (Array.isArray(coursesResponse)) {
        courses = coursesResponse;
      } else if (coursesResponse && typeof coursesResponse === 'object') {
        if (Array.isArray(coursesResponse.data)) {
          courses = coursesResponse.data;
        } else if (coursesResponse.courses && Array.isArray(coursesResponse.courses)) {
          courses = coursesResponse.courses;
        } else if (coursesResponse.data && coursesResponse.data.courses) {
          courses = coursesResponse.data.courses;
        }
      }
      
      // 获取教师专属作业
      // 获取教师的作业
      const assignmentsResponse = await assignmentAPI.getMyAssignments();
      let assignments = [];
      
      if (Array.isArray(assignmentsResponse)) {
        assignments = assignmentsResponse;
      } else if (assignmentsResponse && typeof assignmentsResponse === 'object') {
        if (Array.isArray(assignmentsResponse.data)) {
          assignments = assignmentsResponse.data;
        } else if (assignmentsResponse.assignments && Array.isArray(assignmentsResponse.assignments)) {
          assignments = assignmentsResponse.assignments;
        } else if (assignmentsResponse.data && assignmentsResponse.data.assignments) {
          assignments = assignmentsResponse.data.assignments;
        }
      }

      // 获取教师最近活动（至少10条记录）
      const activitiesResponse = await courseAPI.getTeacherRecentActivities(10);
      let activities = [];
      
      if (activitiesResponse && typeof activitiesResponse === 'object') {
        if (Array.isArray(activitiesResponse.data)) {
          activities = activitiesResponse.data;
        } else if (activitiesResponse.activities && Array.isArray(activitiesResponse.activities)) {
          activities = activitiesResponse.activities;
        } else {
          activities = activitiesResponse.data || [];
        }
      }

      // 计算统计数据
      const totalCourses = courses.length;
      const totalStudents = courses.reduce((sum: number, course: any) => {
        // 适配不同的学生数量字段
        const studentCount = course._count?.enrollments || 
                           course.enrollments?.length || 
                           course.studentCount || 
                           0;
        return sum + studentCount;
      }, 0);
      
      const pendingAssignments = assignments.filter((a: any) => 
        a.status === 'PENDING' || 
        a.gradingStatus === 'PENDING'
      ).length;
      
      // 获取本周活跃学生数
      const weeklyActiveStudentsResponse = await studentStatsAPI.getWeeklyActiveStudents();
      console.log('本周活跃学生数API响应:', weeklyActiveStudentsResponse);
      const weeklyActiveStudents = weeklyActiveStudentsResponse?.data?.totalActiveStudents || 0;
      
      setStats({
        totalCourses,
        totalStudents,
        pendingAssignments,
        weeklyActiveStudents,
      });

      // 处理最近课程数据
      const processedCourses = courses.slice(0, 3).map((course: any) => {
        const studentCount = course._count?.enrollments || 
                           course.enrollments?.length || 
                           course.studentCount || 
                           0;
        
        return {
          id: course.id,
          name: course.title || course.name || '未命名课程',
          code: course.code || '',
          progress: course.progress || 0,
          students: studentCount,
          nextClass: course.nextClass || '待定',
          status: course.status || '进行中',
          coverImage: course.coverImage,
          teacher: course.teacher?.name || course.teacher?.email || '未知教师',
        };
      });
      setRecentCourses(processedCourses);

      // 处理最近活动数据
      setRecentActivities(activities);

    } catch (error) {
      console.error('获取教师仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总课程数',
      value: stats.totalCourses.toString(),
      icon: <School />,
      color: 'primary',
    },
    {
      title: '总学生数',
      value: stats.totalStudents.toString(),
      icon: <People />,
      color: 'success',
    },
    {
      title: '待批改作业',
      value: stats.pendingAssignments.toString(),
      icon: <Assignment />,
      color: 'warning',
    },
    {
      title: '本周活跃学生数',
      value: `${stats.weeklyActiveStudents}人`,
      icon: <TrendingUp />,
      color: 'info',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Notifications color="primary" />;
      case 'courseware':
        return <MenuBook color="warning" />;
      case 'material':
        return <Description color="success" />;
      case 'course':
        return <School color="info" />;
      case 'submission':
        return <Assignment color="primary" />;
      case 'question':
        return <School color="warning" />;
      case 'join':
        return <People color="success" />;
      default:
        return <School />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'notification':
        return 'primary';
      case 'courseware':
        return 'warning';
      case 'material':
        return 'success';
      case 'course':
        return 'info';
      case 'submission':
        return 'primary';
      case 'question':
        return 'warning';
      case 'join':
        return 'success';
      default:
        return 'default';
    }
  };

  const getActivityActionText = (activity: any) => {
    switch (activity.type) {
      case 'notification':
        return '发布了通知';
      case 'courseware':
        return '上传了课件';
      case 'material':
        return '上传了资料';
      case 'course':
        return activity.action; // 已在后端处理
      default:
        return activity.action || '执行了操作';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          欢迎，{(user?.firstName && user?.lastName) ? `${user.firstName}${user.lastName}` : user?.username || '教师'}!
        </Typography>
        <Button
          onClick={handleLogout}
          color="error"
          size="large"
          startIcon={<ExitToApp />}
          sx={{ ml: 2 }}
        >
          退出登录
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" component="h2">
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box sx={{ color: `${stat.color}.main`, fontSize: 40 }}>
                        {stat.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

      <Grid container spacing={3}>
        {/* Recent Courses */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  最近课程
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  component={Link}
                  to="/teacher/courses"
                >
                  查看全部
                </Button>
              </Box>
              <Box sx={{ mt: 2 }}>
                {recentCourses.map((course) => (
                  <Box 
                    key={course.id} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {course.name}
                      </Typography>
                      <Chip 
                        label={course.status} 
                        color={course.status === '进行中' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      课程代码: {course.code} | 学生数: {course.students}人
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        课程进度: {isNaN(Number(course.progress)) ? '0.0' : Math.max(0, Math.min(100, course.progress || 0)).toFixed(1)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={course.progress} 
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      下次课程: {course.nextClass}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近活动
              </Typography>
              <List>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${getActivityActionText(activity)}: ${activity.title}`}
                          secondary={`${activity.course} • ${new Date(activity.time).toLocaleString('zh-CN', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="暂无活动记录"
                      secondary="您最近没有发布通知、上传资源或编辑课程"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )}
    </Box>
  );
};

export default TeacherDashboard;