import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  CssBaseline,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Avatar,
  Chip,
  Paper,
  alpha,
} from '@mui/material';
import {
  MenuBook,      // 课件图标
  Description,   // 资料图标
  ViewModule,    // 章节图标
  Psychology,    // 知识点图标
  Quiz,         // 题库图标
  Assignment,   // 作业图标
  ArrowBack,
  Menu as MenuIcon,
  Book,
  School,
  People,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
import { courseAPI } from '../../services/api';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  department: string;
  credits: number;
  status: 'active' | 'inactive' | 'draft';
  studentCount?: number;
  totalHours?: number;
}

const drawerWidth = 240;

const ResourceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (courseId) {
      fetchCourseInfo();
    }
  }, [courseId]);

  const fetchCourseInfo = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourse(courseId!);
      const courseData = response.data || response;
      
      setCourse({
        id: courseData.id,
        name: courseData.name || courseData.title || '未命名课程',
        code: courseData.code || '',
        description: courseData.description || '暂无描述',
        department: courseData.department || courseData.college || '其他',
        credits: Number(courseData.credits) || 3,
        status: courseData.status || 'draft',
        studentCount: courseData.studentCount || 0,
        totalHours: courseData.totalHours || (Number(courseData.credits) || 3) * 16
      });
    } catch (error) {
      console.error('获取课程信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const navigationItems = [
    { text: '课件管理', icon: <MenuBook />, path: `/teacher/courses/${courseId}/courseware` },
    { text: '资料管理', icon: <Description />, path: `/teacher/courses/${courseId}/materials` },
    { text: '章节管理', icon: <ViewModule />, path: `/teacher/courses/${courseId}/chapters` },
    { text: '知识点管理', icon: <Psychology />, path: `/teacher/courses/${courseId}/knowledge-points` },
    { text: '题库管理', icon: <Quiz />, path: `/teacher/courses/${courseId}/questions` },
    { text: '作业管理', icon: <Assignment />, path: `/teacher/courses/${courseId}/assignments` },
  ];

  const drawer = (
    <div>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Avatar sx={{ 
          width: 64, 
          height: 64, 
          mb: 1,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}>
          <School fontSize="large" />
        </Avatar>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          资源管理
        </Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {course?.name || '课程资源管理'}
        </Typography>
      </Box>
      <Divider />
    <List sx={{ py: 1 }}>
        {navigationItems.map((item) => (
          <ListItemButton 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 'bold',
                },
              },
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                minWidth: 40
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal'
              }}
            />
          </ListItemButton>
        ))}
      </List>
      <Button
      startIcon={<ArrowBack />}
      onClick={() => navigate('/teacher/courses')}
      sx={{ 
        m: 1,
        width: 'calc(100% - 16px)',
        justifyContent: 'flex-start',
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
        }
      }}
    >
      返回课程列表
    </Button>
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* 左侧导航栏 */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="resource management"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={!isMobile || mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ResourceManagement;