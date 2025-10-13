import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { School } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Box
            component="img"
            src="/amite.jpg"
            alt="AMITE Logo"
            sx={{
              height: 40,
              mr: 2,
              borderRadius: 1,
            }}
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI融合教学平台
          </Typography>
          
          {user ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body1">
                欢迎, {user.username}
              </Typography>
              <Button color="inherit" onClick={logout}>
                退出登录
              </Button>
              <Button
                color="inherit"
                component={Link}
                to={`/${user.role}`}
              >
                进入系统
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button color="inherit" component={Link} to="/login">
                登录
              </Button>
              <Button color="inherit" component={Link} to="/register">
                注册
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout;