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
  AppBar,
  Toolbar,
  useTheme,
  Container
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
import VideoLibrary from '@mui/icons-material/VideoLibrary';
import Book from '@mui/icons-material/Book';
import Quiz from '@mui/icons-material/Quiz';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { courseAPI, learningRecordAPI, notificationAPI, submissionAPI, videoSegmentAPI, chapterProgressAPI } from '../../services/api';
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
  const [videoLearningData, setVideoLearningData] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.log('fetchDashboardData function called...');
    setLoading(true);
    try {
      
      // 获取学生课程数据以计算统计信息
      const coursesResponse = await courseAPI.getStudentCourses();
      // 修复数据处理逻辑，正确提取课程数据
      const courses = coursesResponse.data || coursesResponse || [];
      
      // 计算统计数据
      const enrolledCount = Array.isArray(courses) ? courses.length : 0;
      const totalCredits = Array.isArray(courses) 
        ? courses.reduce((sum: number, course: any) => sum + (course.credits || 0), 0) 
        : 0;
      const avgProgress = Array.isArray(courses) && courses.length > 0 
        ? Math.round(courses.reduce((sum: number, course: any) => sum + (course.progress || 0), 0) / courses.length)
        : 0;
      
      // 获取章节学习进度数据
      console.log('Fetching chapter progress data...');
      const chapterProgressResponse = await chapterProgressAPI.getChapterProgress();
      console.log('ChapterProgress API Response:', chapterProgressResponse);
      const chapterProgressData = chapterProgressResponse.data || [];
      console.log('ChapterProgress Data:', chapterProgressData);
      console.log('ChapterProgress Data length:', chapterProgressData.length);
      
      // 计算本周学习时长（基于章节学习进度）
      let weeklyHours = 0;
      let totalVideoTime = 0;
      
      // 处理章节学习进度数据，累计视频学习时长
      chapterProgressData.forEach((progress: any) => {
        if (progress.watchedTime) {
          totalVideoTime += progress.watchedTime;
        }
      });
      
      // 将秒转换为小时
      weeklyHours = Math.round(totalVideoTime / 3600 * 10) / 10;
      
      // 计算学习进度 - 基于章节进度
      let totalProgress = 0;
      let completedChapters = 0;
      let totalChapters = 0;
      
      if (chapterProgressData.length > 0) {
        // 获取所有课程ID
        const courseIds = [...new Set(chapterProgressData.map((p: any) => p.courseId))];
        
        // 计算每个课程的进度
        for (const courseId of courseIds) {
          const courseProgress = chapterProgressData.filter((p: any) => p.courseId === courseId);
          const courseChapters = courseProgress.length;
          
          if (courseChapters > 0) {
            const courseTotalProgress = courseProgress.reduce((sum: number, p: any) => sum + p.progress, 0);
            const courseAverageProgress = courseTotalProgress / courseChapters;
            const courseCompletedChapters = courseProgress.filter((p: any) => p.isCompleted).length;
            
            totalProgress += courseAverageProgress;
            completedChapters += courseCompletedChapters;
            totalChapters += courseChapters;
          }
        }
      }
      
      const averageProgress = totalChapters > 0 ? totalProgress / totalChapters : 0;
      
      setStats({
        enrolledCourses: enrolledCount,
        earnedCredits: totalCredits,
        learningProgress: Math.round(averageProgress * 10) / 10,
        weeklyHours: weeklyHours,
      });

      // 获取作业提交记录
      const submissionsResponse = await submissionAPI.getSubmissions({ studentId: user?.id });
      const submissions = Array.isArray(submissionsResponse.data?.records) 
        ? submissionsResponse.data.records 
        : Array.isArray(submissionsResponse.data) 
          ? submissionsResponse.data 
          : [];

      // 生成真实的学习数据图表数据（基于当前月份）
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // 获取当前月份的天数
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // 初始化当前月份的学习数据（使用学习时间作为数值，单位改为分钟）
      const videoLearningChartData: any[] = [];
      const assignmentChartData: any[] = [];
      
      // 生成当前月份的日期数组
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        
        videoLearningChartData.push({
          name: dateStr,
          学习时间: 0, // 单位：分钟
          fullDate: date.toISOString().split('T')[0] // 存储完整日期用于比较
        });
        
        assignmentChartData.push({
          name: dateStr,
          学习时间: 0, // 单位：分钟
          fullDate: date.toISOString().split('T')[0] // 存储完整日期用于比较
        });
      }
      
      
      
      // 处理章节学习进度数据，按天分类并计算学习时间
      console.log('Processing chapter progress data for chart...');
      chapterProgressData.forEach((progress: any) => {
        console.log('Processing progress item:', progress);
        if (progress.watchedTime > 0 && progress.lastWatchedAt) {
          const studyDate = new Date(progress.lastWatchedAt);
          console.log('Study date:', studyDate);
          const studyDateStr = studyDate.toISOString().split('T')[0];
          
          // 查找对应日期的索引
          const dayIndex = videoLearningChartData.findIndex(item => item.fullDate === studyDateStr);
          
          console.log('Study date string:', studyDateStr, 'Day index:', dayIndex);
          
          if (dayIndex >= 0) {
            // 将学习时长从秒转换为分钟
            const studyMinutes = Math.round(progress.watchedTime / 60);
            console.log(`Adding ${studyMinutes} minutes to day ${dayIndex}`);
            videoLearningChartData[dayIndex].学习时间 += studyMinutes;
          }
        }
      });
      
      console.log('Final video learning chart data:', videoLearningChartData);
      
      // 处理作业提交数据，按天分类并估算学习时间（假设每次作业平均花费60分钟）
      submissions.forEach((submission: any) => {
        if (submission.createdAt) {
          const submitDate = new Date(submission.createdAt);
          const submitDateStr = submitDate.toISOString().split('T')[0];
          
          // 查找对应日期的索引
          const dayIndex = assignmentChartData.findIndex(item => item.fullDate === submitDateStr);
          
          if (dayIndex >= 0) {
            // 假设每次作业平均花费60分钟
            assignmentChartData[dayIndex].学习时间 += 60;
          }
        }
      });
      
      
      
      // 保留整数
      videoLearningChartData.forEach(item => {
        item.学习时间 = Math.round(item.学习时间);
      });
      
      assignmentChartData.forEach(item => {
        item.学习时间 = Math.round(item.学习时间);
      });
      
      
      
      setVideoLearningData(videoLearningChartData);
      setAssignmentData(assignmentChartData);

      // 获取真实的用户通知数据
      const notificationsResponse = await notificationAPI.getNotifications({ limit: 5 });
      const notificationsData = notificationsResponse.data?.notifications || [];
      
      // 处理活动数据 - 使用章节学习进度和通知
      const activities: Activity[] = [];
      
      // 添加最近的学习进度记录
      const recentProgress = [...chapterProgressData]
        .sort((a: any, b: any) => new Date(b.lastWatchedAt || 0).getTime() - new Date(a.lastWatchedAt || 0).getTime())
        .slice(0, 3);
      
      recentProgress.forEach((progress: any) => {
        if (progress.lastWatchedAt) {
          activities.push({
            id: `progress-${progress.id}`,
            type: '视频学习',
            content: `学习章节: ${progress.chapter?.title || '未知章节'}`,
            time: formatDate(progress.lastWatchedAt),
            icon: <VideoLibrary color="primary" />,
            relatedCourse: progress.course ? { id: progress.course.id, title: progress.course.name } : undefined,
          });
        }
      });
      
      // 添加最近的作业提交记录
      const recentSubmissions = [...submissions]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      recentSubmissions.forEach((submission: any) => {
        activities.push({
          id: `submission-${submission.id}`,
          type: '作业提交',
          content: `提交作业: ${submission.assignment?.title || '未知作业'}`,
          time: formatDate(submission.createdAt),
          icon: <Assignment color="success" />,
          relatedCourse: submission.assignment?.knowledgePoint?.chapter?.course ? 
            { id: submission.assignment.knowledgePoint.chapter.course.id, title: submission.assignment.knowledgePoint.chapter.course.name } : 
            undefined,
        });
      });
      
      // 添加通知
      notificationsData.slice(0, 5).forEach((notification: any) => {
        activities.push({
          id: `notification-${notification.id}`,
          type: getTypeLabel(notification.type),
          content: notification.title,
          time: formatDate(notification.createdAt),
          icon: getTypeIcon(notification.type),
          relatedCourse: notification.relatedCourse,
        });
      });
      
      // 如果没有活动数据，使用模拟数据
      if (activities.length === 0) {
        activities.push(
          {
            id: 1,
            type: '通知',
            content: '暂无新活动',
            time: '刚刚',
            icon: <NotificationsIcon color="info" />,
          }
        );
      }
      
      // 按时间排序并只保留最近的5条
      setRecentActivities(
        activities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5)
      );

    } catch (error) {
      console.error('获取学生仪表板数据失败:', error);
      // 出错时使用模拟数据
      setStats({
        enrolledCourses: 0,
        earnedCredits: 0,
        learningProgress: 0,
        weeklyHours: 0,
      });
      
      // 出错时使用模拟图表数据
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // 获取当前月份的天数
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const videoLearningChartData: any[] = [];
      const assignmentChartData: any[] = [];
      
      // 生成当前月份的日期数组
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        
        videoLearningChartData.push({
          name: dateStr,
          学习时间: day === 15 ? 5 : 0, // 月中某一天有5分钟学习时间
          fullDate: date.toISOString().split('T')[0]
        });
        
        assignmentChartData.push({
          name: dateStr,
          学习时间: day === 10 ? 60 : 0, // 月中某一天有60分钟作业时间
          fullDate: date.toISOString().split('T')[0]
        });
      }
      
      
      
      setVideoLearningData(videoLearningChartData);
      setAssignmentData(assignmentChartData);
      
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

  // 获取通知类型对应的中文标签
  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info': return '信息';
      case 'warning': return '警告';
      case 'error': return '错误';
      case 'success': return '成功';
      case 'course': return '课程';
      case 'assignment': return '作业';
      case 'exam': return '考试';
      case 'general': return '通用';
      default: return type;
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
        color: theme.palette.primary.main,
      },
      {
        title: '获得学分',
        value: stats.earnedCredits.toString(),
        icon: <Star />,
        color: theme.palette.secondary.main,
      },
      {
        title: '学习进度',
        value: `${isNaN(Number(stats.learningProgress)) ? '0.0' : Math.max(0, Math.min(100, stats.learningProgress || 0)).toFixed(1)}%`,
        icon: <TrendingUp />,
        color: theme.palette.success.main,
      },
      {
        title: '本周学时',
        value: `${stats.weeklyHours}h`,
        icon: <AccessTime />,
        color: theme.palette.warning.main,
      },
    ];
  
  // 图表颜色配置
  const COLORS = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)', 
      minHeight: '100vh',
      p: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4,
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 8, 
            height: 40, 
            backgroundColor: '#4f46e5', 
            borderRadius: 4, 
            mr: 2 
          }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            欢迎，{(user?.firstName && user?.lastName) ? `${user.firstName}${user.lastName}` : user?.username || '学生'}!
          </Typography>
        </Box>
        <Button
          onClick={handleLogout}
          color="error"
          size="large"
          startIcon={<ExitToApp />}
          sx={{ 
            ml: 2,
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(239, 68, 68, 0.25)',
            }
          }}
        >
          退出登录
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column'
        }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 2, color: '#4f46e5' }} />
          <Typography variant="h6" color="text.secondary">
            正在加载数据...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                    },
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '5px',
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color}dd)`
                  }} />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        backgroundColor: stat.color + '15',
                        color: stat.color,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28
                      }}>
                        {stat.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* 统计图表区域 */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={3}>
                {/* 视频学习折线图 */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    height: '100%'
                  }}>
                    <Box sx={{ 
                      p: 3, 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: `${theme.palette.primary.main}08`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: theme.palette.primary.main,
                      }
                    }}>
                      <Typography variant="h6" fontWeight="bold">
                        视频学习时间
                      </Typography>
                    </Box>
                    <CardContent sx={{ pt: 2 }}>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={videoLearningData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end"
                              height={60}
                              interval={Math.floor(videoLearningData.length / 15)} // 显示约15个刻度
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              label={{ value: '学习时间(分钟)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                              domain={[0, Math.max(10, 'dataMax + 2')]} 
                              tick={{ fontSize: 12 }}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                borderRadius: 8, 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="学习时间" 
                              stroke={theme.palette.primary.main} 
                              strokeWidth={2}
                              dot={{ r: 4, fill: theme.palette.primary.main }}
                              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Box>
                </Grid>

                {/* 作业完成折线图 */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    height: '100%'
                  }}>
                    <Box sx={{ 
                      p: 3, 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: `${theme.palette.secondary.main}08`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: theme.palette.secondary.main,
                      }
                    }}>
                      <Typography variant="h6" fontWeight="bold">
                        作业完成时间
                      </Typography>
                    </Box>
                    <CardContent sx={{ pt: 2 }}>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={assignmentData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end"
                              height={60}
                              interval={Math.floor(assignmentData.length / 15)} // 显示约15个刻度
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              label={{ value: '学习时间(分钟)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                              domain={[0, Math.max(10, 'dataMax + 2')]} 
                              tick={{ fontSize: 12 }}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                borderRadius: 8, 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="学习时间" 
                              stroke={theme.palette.secondary.main} 
                              strokeWidth={2}
                              dot={{ r: 4, fill: theme.palette.secondary.main }}
                              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Recent Activities */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ 
                  p: 3,
                  background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    最近活动
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    component={Link}
                    to="/student/notifications"
                    sx={{
                      borderRadius: 20,
                      px: 3,
                      fontWeight: 'bold',
                      color: 'white',
                      borderColor: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    查看全部
                  </Button>
                </Box>
                <CardContent sx={{ p: 0, flexGrow: 1, overflow: 'auto' }}>
                  <List sx={{ py: 0 }}>
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <React.Fragment key={activity.id}>
                          <ListItem sx={{ 
                            py: 2,
                            px: 3,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(79, 70, 229, 0.05)'
                            }
                          }}>
                            <ListItemIcon>
                              <Box sx={{ 
                                backgroundColor: '#4f46e515',
                                color: '#4f46e5',
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {activity.icon}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={activity.content}
                              secondary={activity.time}
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                fontWeight: 500,
                                color: '#1e293b'
                              }}
                              secondaryTypographyProps={{ 
                                variant: 'caption',
                                color: '#64748b'
                              }}
                            />
                          </ListItem>
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem sx={{ 
                        py: 4,
                        px: 3,
                        textAlign: 'center',
                        flexDirection: 'column'
                      }}>
                        <Box sx={{ 
                          backgroundColor: '#f1f5f9',
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2
                        }}>
                          <NotificationsIcon sx={{ color: '#94a3b8', fontSize: 30 }} />
                        </Box>
                        <ListItemText
                          primary="暂无活动记录"
                          secondary="您最近没有学习活动或通知"
                          primaryTypographyProps={{ 
                            variant: 'body1',
                            fontWeight: 500,
                            color: '#1e293b',
                            textAlign: 'center'
                          }}
                          secondaryTypographyProps={{ 
                            variant: 'body2',
                            color: '#64748b',
                            textAlign: 'center'
                          }}
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

export default StudentDashboard;