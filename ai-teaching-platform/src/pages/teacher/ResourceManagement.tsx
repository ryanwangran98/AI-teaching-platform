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
} from '@mui/icons-material';
import { useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import CourseInfoPage from './CourseInfoPage';

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
    { text: '课程信息', icon: <Book />, path: `/teacher/courses/${courseId}` },
    { text: '课件管理', icon: <MenuBook />, path: `/teacher/courses/${courseId}/courseware` },
    { text: '资料管理', icon: <Description />, path: `/teacher/courses/${courseId}/materials` },
    { text: '章节管理', icon: <ViewModule />, path: `/teacher/courses/${courseId}/chapters` },
    { text: '知识点管理', icon: <Psychology />, path: `/teacher/courses/${courseId}/knowledge-points` },
    { text: '题库管理', icon: <Quiz />, path: `/teacher/courses/${courseId}/questions` },
    { text: '作业管理', icon: <Assignment />, path: `/teacher/courses/${courseId}/assignments` },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          资源管理
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItemButton 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
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
      
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => navigate('/teacher/courses')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {course?.name || '课程资源管理'}
          </Typography>
        </Toolbar>
      </AppBar>
      
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
          mt: 8,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* 如果当前路径是资源管理根路径，显示课程信息 */}
        {location.pathname === `/teacher/courses/${courseId}` && course ? (
          <CourseInfoPage course={course} />
        ) : (
          <Box sx={{ p: 3 }}>
            <Outlet />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResourceManagement;