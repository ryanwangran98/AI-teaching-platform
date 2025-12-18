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
import { courseAPI, assignmentAPI, studentStatsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StudentStatsCharts from '../../components/teacher/StudentStatsCharts';

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
    <Box sx={{ 
      minHeight: '100vh',
      p: 1
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4,
        p: 3,
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(10px)',
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
            欢迎，{(user?.firstName && user?.lastName) ? `${user.firstName}${user.lastName}` : user?.username || '教师'}!
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
                    background: `linear-gradient(90deg, ${stat.color}.main, ${stat.color}.light)`
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
                        backgroundColor: `${stat.color}.main` + '15',
                        color: `${stat.color}.main`,
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
        {/* Student Stats Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <StudentStatsCharts />
          </Box>
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
              color: 'white'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                最近活动
              </Typography>
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
                            backgroundColor: getActivityColor(activity.type) + '15',
                            color: getActivityColor(activity.type) + '.main',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getActivityIcon(activity.type)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={`${getActivityActionText(activity)}: ${activity.title}`}
                          secondary={`${activity.course} • ${new Date(activity.time).toLocaleString('zh-CN', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}`}
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
                      <Notifications sx={{ color: '#94a3b8', fontSize: 30 }} />
                    </Box>
                    <ListItemText
                      primary="暂无活动记录"
                      secondary="您最近没有发布通知、上传资源或编辑课程"
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

export default TeacherDashboard;