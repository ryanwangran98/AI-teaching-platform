import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  AppBar,
  Toolbar,
  IconButton,
  MobileStepper,
  Paper,
  Avatar,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { KeyboardArrowLeft, KeyboardArrowRight, School, AutoAwesome, Person, Psychology, Analytics } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // 轮播文字内容
  const bannerContent = [
    {
      title: '智慧校园',
      description: '打造现代化教育环境',
    },
    {
      title: 'AI辅助教学',
      description: '让教学更智能高效',
    },
    {
      title: '个性化学习',
      description: '因材施教，精准提升',
    },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prevActiveStep) => (prevActiveStep + 1) % bannerContent.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerContent.length]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % bannerContent.length);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + bannerContent.length) % bannerContent.length);
  };

  const features = [
    {
      title: '智能课件生成',
      description: '基于AI技术快速生成高质量教学课件',
      image: '/images/ai-courseware.svg',
      icon: <AutoAwesome fontSize="large" />,
      color: theme.palette.primary.main,
    },
    {
      title: '个性化学习路径',
      description: '为每个学生定制专属学习方案',
      image: '/images/personalized-learning.svg',
      icon: <Person fontSize="large" />,
      color: theme.palette.secondary.main,
    },
    {
      title: '智能作业批改',
      description: 'AI自动批改作业，提供详细反馈',
      image: '/images/ai-grading.svg',
      icon: <Psychology fontSize="large" />,
      color: theme.palette.success.main,
    },
    {
      title: 'AI教师分身',
      description: '24小时为学生提供课程内容的答疑功能',
      image: '/images/ai-teacher.svg',
      icon: <Psychology fontSize="large" />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: 'background.paper', 
          color: 'text.primary',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          py: 1
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ 
              mr: 2, 
              color: theme.palette.primary.main,
              fontSize: 32
            }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI融合教学平台
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {user ? (
            <Button 
              variant="contained" 
              onClick={() => navigate(`/${user.role}`)}
              sx={{
                borderRadius: 20,
                px: 3,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }
              }}
            >
              {user.role === 'teacher' ? '教师端' : 
               user.role === 'student' ? '学生端' : '管理员端'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 20,
                px: 3,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }
              }}
            >
              登录
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section - 文字轮播 */}
      <Box sx={{ position: 'relative', height: '70vh', overflow: 'hidden', bgcolor: 'white' }}>
        <Container maxWidth="md" sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            sx={{
              color: 'black',
              textAlign: 'center',
              py: 8,
              animation: 'fadeIn 1s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              fontWeight="bold"
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}
            >
              {bannerContent[activeStep].title}
            </Typography>
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              sx={{ 
                mb: 4,
                fontWeight: 500,
                color: theme.palette.text.primary
              }}
            >
              {bannerContent[activeStep].description}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6, 
                maxWidth: '600px', 
                mx: 'auto', 
                color: 'text.secondary',
                lineHeight: 1.6
              }}
            >
              基于人工智能技术，为教师和学生提供个性化教学解决方案
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                sx={{ 
                  px: 5, 
                  py: 1.8,
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                  borderRadius: 30,
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => navigate('/login')}
              >
                立即体验
              </Button>
            </Box>
          </Box>
        </Container>
        
        {/* 轮播控制按钮 */}
        <IconButton
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: 16, 
            transform: 'translateY(-50%)', 
            color: 'black', 
            bgcolor: 'rgba(255,255,255,0.8)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.3s ease',
            width: 48,
            height: 48,
            borderRadius: '50%'
          }}
          onClick={handleBack}
        >
          <KeyboardArrowLeft />
        </IconButton>
        <IconButton
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            right: 16, 
            transform: 'translateY(-50%)', 
            color: 'black', 
            bgcolor: 'rgba(255,255,255,0.8)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.3s ease',
            width: 48,
            height: 48,
            borderRadius: '50%'
          }}
          onClick={handleNext}
        >
          <KeyboardArrowRight />
        </IconButton>

        {/* 轮播指示器 */}
        <MobileStepper
          steps={bannerContent.length}
          position="static"
          activeStep={activeStep}
          sx={{ 
            position: 'absolute', 
            bottom: 30, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            bgcolor: 'transparent',
            '& .MuiMobileStepper-dot': {
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              mx: 0.5,
            },
            '& .MuiMobileStepper-dotActive': {
              width: 24,
              borderRadius: 4,
              bgcolor: theme.palette.primary.main,
            }
          }}
          nextButton={null}
          backButton={null}
        />
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 12, px: { xs: 3, md: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom 
            fontWeight="bold"
            sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 2,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 4,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }
            }}
          >
            核心功能
          </Typography>
          <Typography 
            variant="h6" 
            component="p" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              maxWidth: '700px', 
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            利用AI技术全面提升教学体验，为教师和学生提供智能化、个性化的教育解决方案
          </Typography>
        </Box>
        
        <Grid container spacing={4} justifyContent="center">
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                  },
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.06)',
                  position: 'relative'
                }}
              >
                <Box sx={{ 
                  p: 4, 
                  display: 'flex', 
                  justifyContent: 'center',
                  bgcolor: `${feature.color}08`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: feature.color,
                  }
                }}>
                  <Avatar sx={{ 
                    width: 70, 
                    height: 70, 
                    bgcolor: feature.color,
                    color: 'white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    {feature.icon}
                  </Avatar>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h2" 
                    fontWeight="bold"
                    sx={{ mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
                  <Button 
                    size="small" 
                    sx={{ 
                      color: feature.color,
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: `${feature.color}08`,
                      }
                    }}
                  >
                    了解更多
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Paper 
        square 
        sx={{ 
          py: 6, 
          textAlign: 'center',
          bgcolor: theme.palette.primary.main,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            zIndex: -1,
          }
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h5" 
            gutterBottom 
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            AI融合教学平台
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 3, 
              maxWidth: '500px', 
              mx: 'auto',
              opacity: 0.9
            }}
          >
            让教育更智能，让学习更高效
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 3, 
            mb: 4 
          }}>
            <Button 
              variant="text" 
              sx={{ 
                color: 'white', 
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1
                }
              }}
            >
              关于我们
            </Button>
            <Button 
              variant="text" 
              sx={{ 
                color: 'white', 
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1
                }
              }}
            >
              联系方式
            </Button>
            <Button 
              variant="text" 
              sx={{ 
                color: 'white', 
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1
                }
              }}
            >
              隐私政策
            </Button>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              opacity: 0.7,
              mt: 2
            }}
          >
            © 2024 AI融合教学平台. 保留所有权利
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
};

export default Home;