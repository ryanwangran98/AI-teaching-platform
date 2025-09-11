import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
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
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import School from '@mui/icons-material/School';
import Star from '@mui/icons-material/Star';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AccessTime from '@mui/icons-material/AccessTime';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Schedule from '@mui/icons-material/Schedule';
import ListAlt from '@mui/icons-material/ListAlt';
import AddCircle from '@mui/icons-material/AddCircle';
import ExitToApp from '@mui/icons-material/ExitToApp';
import Assignment from '@mui/icons-material/Assignment';
import Explore from '@mui/icons-material/Explore';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import AccountTree from '@mui/icons-material/AccountTree';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Info from '@mui/icons-material/Info';
import Warning from '@mui/icons-material/Warning';
import Error from '@mui/icons-material/Error';
import { courseAPI, learningRecordAPI, notificationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// 定义活动类型
interface Activity {
  id: string | number;
  type: string;
  content: string;
  time: string;
  icon: React.ReactNode;
  relatedCourse?: {
    id: string;
    title: string;
  };
}

// 定义通知类型
interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
  relatedCourse?: {
    id: string;
    title: string;
  };
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    earnedCredits: 0,
    learningProgress: 0,
    weeklyHours: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取学生课程数据以计算统计信息
      const coursesResponse = await courseAPI.getStudentCourses();
      // 修复数据处理逻辑，正确提取课程数据
      const courses = coursesResponse.data || coursesResponse || [];
      
      // 获取学习记录数据
      const params: any = {};
      if (user?.id) {
        params.studentId = user.id;
      }
      
      const recordsResponse = await learningRecordAPI.getLearningRecords(params);
      const records = recordsResponse.data || recordsResponse || [];
      
      // 计算统计数据
      const enrolledCount = Array.isArray(courses) ? courses.length : 0;
      const totalCredits = Array.isArray(courses) 
        ? courses.reduce((sum: number, course: any) => sum + (course.credits || 0), 0) 
        : 0;
      const avgProgress = Array.isArray(courses) && courses.length > 0 
        ? Math.round(courses.reduce((sum: number, course: any) => sum + (course.progress || 0), 0) / courses.length)
        : 0;
      const weeklyHours = Math.round(records.length * 2); // 简单估算
      
      setStats({
        enrolledCourses: enrolledCount,
        earnedCredits: totalCredits,
        learningProgress: avgProgress,
        weeklyHours: weeklyHours,
      });

      // 获取真实的用户通知数据
      const notificationsResponse = await notificationAPI.getNotifications({ limit: 5 });
      const notificationsData = notificationsResponse.data?.notifications || [];
      
      // 处理活动数据 - 使用真实的用户通知
      const activities: Activity[] = [];
      
      // 添加通知
      notificationsData.slice(0, 5).forEach((notification: any) => {
        activities.push({
          id: `notification-${notification.id}`,
          type: '通知',
          content: notification.title,
          time: formatDate(notification.createdAt),
          icon: getTypeIcon(notification.type),
          relatedCourse: notification.relatedCourse,
        });
      });
      
      // 如果没有通知数据，使用模拟数据
      if (activities.length === 0) {
        activities.push(
          {
            id: 1,
            type: '通知',
            content: '暂无新通知',
            time: '刚刚',
            icon: <NotificationsIcon color="info" />,
          }
        );
      }
      
      setRecentActivities(activities);

    } catch (error) {
      console.error('获取学生仪表板数据失败:', error);
      // 出错时使用模拟数据
      setStats({
        enrolledCourses: 0,
        earnedCredits: 0,
        learningProgress: 0,
        weeklyHours: 0,
      });
      setRecentActivities([
        {
          id: 1,
          type: '通知',
          content: '暂无新通知',
          time: '刚刚',
          icon: <NotificationsIcon color="info" />,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 获取通知类型对应的图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <NotificationsIcon color="action" />;
    }
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const statCards = [
    {
      title: '在学课程',
      value: stats.enrolledCourses.toString(),
      icon: <School />,
      color: 'primary',
    },
    {
      title: '获得学分',
      value: stats.earnedCredits.toString(),
      icon: <Star />,
      color: 'success',
    },
    {
      title: '学习进度',
      value: `${stats.learningProgress}%`,
      icon: <TrendingUp />,
      color: 'info',
    },
    {
      title: '本周学时',
      value: `${stats.weeklyHours}h`,
      icon: <AccessTime />,
      color: 'warning',
    },
  ];

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
          欢迎，{(user?.firstName && user?.lastName) ? `${user.firstName}${user.lastName}` : user?.username || '学生'}!
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
                      <Box sx={{ color: `${stat.color}.main` }}>
                        {stat.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* 快捷功能 */}
            {/* 已移除快捷功能模块 */}

            {/* 学习统计 */}
            <Grid size={{ xs: 12, md: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    学习统计
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" color="primary">
                      {stats.learningProgress}%
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      平均学习进度
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      本周学习时长: {stats.weeklyHours}小时
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      获得学分: {stats.earnedCredits}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        <Grid container spacing={3}>
          {/* Recent Activities - 占据全宽 */}
          <Grid size={{ xs: 12, md: 12 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    最近活动
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    component={Link}
                    to="/student/notifications"
                  >
                    查看全部
                  </Button>
                </Box>
                <Box sx={{ mt: 2 }}>
                  {recentActivities.map((activity) => (
                    <Box key={activity.id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ mr: 2, mt: 0.5 }}>
                        {activity.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {activity.type}
                          </Typography>
                          {activity.relatedCourse && (
                            <Chip 
                              label={activity.relatedCourse.title} 
                              size="small" 
                              variant="outlined" 
                              sx={{ height: 18 }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {activity.content}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    )}
    </Box>
  );
};

export default StudentDashboard;