import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Notifications,
  Psychology,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

const menuItems = [
  { 
    text: '教师仪表板', 
    icon: <Dashboard />, 
    path: '/teacher',
    color: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  },
  { 
    text: '我的课程', 
    icon: <School />, 
    path: '/teacher/courses',
    color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  { 
    text: '通知管理', 
    icon: <Notifications />, 
    path: '/teacher/notifications',
    color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  },
  { 
    text: 'AI助手', 
    icon: <Psychology />, 
    path: '/ai/courseware-assistant',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
];

const TeacherLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 2,
        background: 'transparent',
      }}>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            color: 'text.primary',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          教师菜单
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mx: 1,
                py: 1.5,
                backgroundColor: location.pathname === item.path ? 'primary.main' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: location.pathname === item.path ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 'medium' : 'regular',
                  color: location.pathname === item.path ? 'white' : 'text.primary',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          color: 'text.primary',
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
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI融合教学平台 - 教师端
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default TeacherLayout;
