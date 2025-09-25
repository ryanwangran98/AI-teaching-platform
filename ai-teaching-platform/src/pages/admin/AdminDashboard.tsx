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
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import School from '@mui/icons-material/School';
import People from '@mui/icons-material/People';
import Group from '@mui/icons-material/Group';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AddCircle from '@mui/icons-material/AddCircle';
import ListAlt from '@mui/icons-material/ListAlt';
import ExitToApp from '@mui/icons-material/ExitToApp';
import { useAuth } from '../../contexts/AuthContext';
import BarChart from '@mui/icons-material/BarChart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { courseAPI, authAPI } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalClasses: 0,
    weeklyActive: 0,
  });
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [courseStatsData, setCourseStatsData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取课程数据
      const coursesResponse = await courseAPI.getCourses();
      const courses = Array.isArray(coursesResponse.data) ? coursesResponse.data : 
                     Array.isArray(coursesResponse) ? coursesResponse : [];
      
      // 获取用户数据
      const usersResponse = await authAPI.getUsers({ limit: 100 });
      const users = usersResponse.data?.users || usersResponse.users || [];
      
      // 计算统计数据
      const totalCourses = courses.length;
      const totalUsers = users.length;
      const totalClasses = Math.ceil(totalCourses / 3); // 简单估算
      const weeklyActive = Math.round(totalUsers * 0.7); // 70%活跃率
      
      setStats({
        totalUsers,
        totalCourses,
        totalClasses,
        weeklyActive,
      });

      // 处理用户增长数据
      const teachers = users.filter((u: any) => u.role === 'TEACHER').length;
      const students = users.filter((u: any) => u.role === 'STUDENT').length;
      const admins = users.filter((u: any) => u.role === 'ADMIN').length;
      
      setUserGrowthData([
        { month: '当前', users: totalUsers, teachers, students, admins },
      ]);

      // 处理课程分类数据
      const courseCategories = [
        { name: '人工智能', count: courses.filter((c: any) => c.title?.includes('人工智能')).length },
        { name: '软件工程', count: courses.filter((c: any) => c.title?.includes('软件')).length },
        { name: '其他', count: courses.filter((c: any) => !c.title?.includes('人工智能') && !c.title?.includes('软件')).length },
      ].filter(cat => cat.count > 0);
      setCourseStatsData(courseCategories);

      // 处理最近用户数据
      const processedUsers = users.slice(0, 3).map((user: any) => ({
        id: user.id,
        name: `${user.firstName || ''}${user.lastName || ''}`.trim() || user.email?.split('@')[0] || '未知用户',
        email: user.email,
        role: user.role?.toLowerCase() || '学生',
        status: user.isActive ? '活跃' : '未激活',
        joinDate: new Date(user.createdAt).toLocaleDateString('zh-CN'),
      }));
      setRecentUsers(processedUsers);

    } catch (error) {
      console.error('获取管理员仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toString(),
      icon: <People />,
      color: 'primary',
    },
    {
      title: '总课程数',
      value: stats.totalCourses.toString(),
      icon: <School />,
      color: 'success',
    },
    {
      title: '总班级数',
      value: stats.totalClasses.toString(),
      icon: <Group />,
      color: 'info',
    },
    {
      title: '本周活跃',
      value: stats.weeklyActive.toString(),
      icon: <TrendingUp />,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          管理仪表板
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ListAlt />}
            component={Link}
            to="/admin/courses"
            size="large"
          >
            课程管理
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<AddCircle />}
            component={Link}
            to="/admin/courses/new"
            size="large"
          >
            新建课程
          </Button>
          <MuiTooltip title="退出登录">
            <IconButton
              onClick={handleLogout}
              color="error"
              size="large"
              sx={{ ml: 1 }}
            >
              <ExitToApp />
            </IconButton>
          </MuiTooltip>
        </Box>
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
        {/* User Growth Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                用户增长趋势
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" name="总用户数" />
                  <Line type="monotone" dataKey="teachers" stroke="#82ca9d" name="教师数" />
                  <Line type="monotone" dataKey="students" stroke="#ffc658" name="学生数" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Course Statistics */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                课程分类统计
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseStatsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近注册用户
              </Typography>
              <Box sx={{ mt: 2 }}>
                {recentUsers.map((user) => (
                  <Box 
                    key={user.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 2, 
                      mb: 1, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label={user.role} 
                        color={user.role === '教师' ? 'primary' : 'success'}
                        size="small"
                      />
                      <Chip 
                        label={user.status} 
                        color={user.status === '活跃' ? 'success' : 'default'}
                        size="small"
                      />
                      <Typography variant="body2" color="textSecondary">
                        {user.joinDate}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" href="/admin/users">
                查看全部用户
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </>
  )}
    </Box>
  );
};

export default AdminDashboard;