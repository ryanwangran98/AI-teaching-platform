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
  MobileStepper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 背景轮播图片
  const bannerImages = [
    {
      url: '/images/banner1.jpg',
      title: '智慧校园',
      description: '打造现代化教育环境',
    },
    {
      url: '/images/banner2.jpg',
      title: 'AI辅助教学',
      description: '让教学更智能高效',
    },
    {
      url: '/images/banner3.jpg',
      title: '个性化学习',
      description: '因材施教，精准提升',
    },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prevActiveStep) => (prevActiveStep + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % bannerImages.length);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + bannerImages.length) % bannerImages.length);
  };

  const features = [
    {
      title: '智能课件生成',
      description: '基于AI技术快速生成高质量教学课件',
      image: '/images/ai-courseware.svg',
    },
    {
      title: '个性化学习路径',
      description: '为每个学生定制专属学习方案',
      image: '/images/personalized-learning.svg',
    },
    {
      title: '智能作业批改',
      description: 'AI自动批改作业，提供详细反馈',
      image: '/images/ai-grading.svg',
    },
    {
      title: '实时学习分析',
      description: '实时跟踪学习进度，精准分析学习效果',
      image: '/images/analytics.svg',
    },
  ];

  const handleRoleNavigation = (role: string) => {
    if (user) {
      // 已登录用户直接跳转到相应角色页面
      if (user.role === role) {
        navigate(`/${role}`);
      } else {
        // 角色不匹配，跳转到登录页面重新登录
        navigate('/login');
      }
    } else {
      // 未登录用户跳转到登录页面
      navigate('/login');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI融合教学平台
          </Typography>
          <Button color="inherit" onClick={() => navigate('/courses')}>
            浏览课程
          </Button>
          {user ? (
            <Button color="inherit" onClick={() => navigate(`/${user.role}`)}>
              {user.role === 'teacher' ? '教师端' : 
               user.role === 'student' ? '学生端' : '管理员端'}
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                注册
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section - 背景轮播 */}
      <Box sx={{ position: 'relative', height: '600px', overflow: 'hidden' }}>
        {bannerImages.map((image, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${image.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === activeStep ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                py: 8,
                px: 4,
                textAlign: 'center',
                borderRadius: 2,
                maxWidth: '600px',
              }}
            >
              <Typography variant="h2" component="h1" gutterBottom>
                {image.title}
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                {image.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                基于人工智能技术，为教师和学生提供个性化教学解决方案
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{ mr: 2, bgcolor: 'white', color: 'primary.main' }}
                onClick={() => navigate('/register')}
              >
                立即开始
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ borderColor: 'white', color: 'white' }}
                onClick={() => navigate('/login')}
              >
                登录账号
              </Button>
            </Box>
          </Box>
        ))}
        
        {/* 轮播控制按钮 */}
        <IconButton
          sx={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          onClick={handleBack}
        >
          <KeyboardArrowLeft />
        </IconButton>
        <IconButton
          sx={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          onClick={handleNext}
        >
          <KeyboardArrowRight />
        </IconButton>

        {/* 轮播指示器 */}
        <MobileStepper
          steps={bannerImages.length}
          position="static"
          activeStep={activeStep}
          sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', bgcolor: 'transparent' }}
          nextButton={null}
          backButton={null}
        />
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          核心功能
        </Typography>
        <Typography variant="h6" component="p" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          利用AI技术全面提升教学体验
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={feature.image}
                  alt={feature.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">了解更多</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* User Roles Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            用户角色
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    教师端
                  </Typography>
                  <Typography variant="body1" paragraph>
                    智能课件生成、作业批改、学情分析、个性化教学
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => handleRoleNavigation('teacher')}
                  >
                    {user?.role === 'teacher' ? '进入教师端' : '登录教师端'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    学生端
                  </Typography>
                  <Typography variant="body1" paragraph>
                    个性化学习路径、智能推荐、学习进度跟踪、互动学习
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => handleRoleNavigation('student')}
                  >
                    {user?.role === 'student' ? '进入学生端' : '登录学生端'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    管理员端
                  </Typography>
                  <Typography variant="body1" paragraph>
                    用户管理、课程管理、系统配置、数据分析
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => handleRoleNavigation('admin')}
                  >
                    {user?.role === 'admin' ? '进入管理员端' : '登录管理员端'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          © 2024 AI融合教学平台. 让教育更智能，让学习更高效
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;