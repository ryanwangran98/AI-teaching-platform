import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// 创建自定义主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.1),0px 1px 1px 0px rgba(0,0,0,0.07),0px 1px 3px 0px rgba(0,0,0,0.06)',
    '0px 3px 3px -2px rgba(0,0,0,0.1),0px 3px 4px 0px rgba(0,0,0,0.07),0px 1px 8px 0px rgba(0,0,0,0.06)',
    '0px 4px 5px -2px rgba(0,0,0,0.1),0px 4px 6px 0px rgba(0,0,0,0.07),0px 1px 10px 0px rgba(0,0,0,0.06)',
    '0px 5px 8px -3px rgba(0,0,0,0.1),0px 5px 10px 0px rgba(0,0,0,0.07),0px 2px 14px 0px rgba(0,0,0,0.06)',
    '0px 6px 10px -3px rgba(0,0,0,0.1),0px 6px 12px 0px rgba(0,0,0,0.07),0px 2px 16px 0px rgba(0,0,0,0.06)',
    '0px 7px 12px -3px rgba(0,0,0,0.1),0px 7px 14px 0px rgba(0,0,0,0.07),0px 3px 18px 0px rgba(0,0,0,0.06)',
    '0px 8px 14px -3px rgba(0,0,0,0.1),0px 8px 16px 0px rgba(0,0,0,0.07),0px 3px 20px 0px rgba(0,0,0,0.06)',
    '0px 10px 18px -3px rgba(0,0,0,0.1),0px 10px 20px 0px rgba(0,0,0,0.07),0px 4px 24px 0px rgba(0,0,0,0.06)',
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'unset',
        },
      },
    },
  },
});

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user: authUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      const role = authUser.role?.toLowerCase();
      if (role === 'teacher') {
        navigate('/teacher');
      } else if (role === 'student') {
        navigate('/student');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [authUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // 登录成功后立即跳转，使用AuthContext中的用户数据
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Container component="main" maxWidth="sm">
          <Grid container spacing={2} justifyContent="center">
            <Grid size={{ xs: 12 }}>
              <Paper
                elevation={8}
                sx={{
                  padding: { xs: 3, md: 5 },
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: 'linear-gradient(90deg, #1976d2, #dc004e)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Avatar
                    sx={{
                      m: 1,
                      bgcolor: 'transparent',
                      width: 80,
                      height: 80,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      border: '2px solid #f0f0f0',
                    }}
                  >
                    <Box
                      component="img"
                      src="/amite.jpg"
                      alt="Logo"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                      }}
                    />
                  </Avatar>
                  <Typography
                    component="h1"
                    variant="h4"
                    align="center"
                    gutterBottom
                    sx={{
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #1976d2, #dc004e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    AI融合教学平台
                  </Typography>
                  <Typography
                    component="h2"
                    variant="h5"
                    align="center"
                    color="text.secondary"
                    gutterBottom
                  >
                    用户登录
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="邮箱地址"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="密码"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 4,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #1976d2, #dc004e)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                        background: 'linear-gradient(45deg, #1565c0, #9a0036)',
                      },
                    }}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlined />}
                  >
                    {loading ? '登录中...' : '登录'}
                  </Button>
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      onClick={() => navigate('/register')}
                      variant="text"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 'medium',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        },
                      }}
                    >
                      没有账号？立即注册
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;