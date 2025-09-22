import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  IconButton,
  Alert
} from '@mui/material';
import { ArrowBack, SmartToy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CourseAssistant: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 返回按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/student')}
          sx={{ textTransform: 'none' }}
          color="inherit"
        >
          返回学生主页
        </Button>
      </Box>

      {/* 页面标题 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SmartToy sx={{ mr: 1, verticalAlign: 'middle' }} />
          课程答疑助手
        </Typography>
        <Typography variant="body1" color="text.secondary">
          智能AI助手为您提供24小时在线答疑服务，随时解答您的学习问题
        </Typography>
      </Box>

      {/* 智能体对话区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            点击下方按钮启动AI答疑助手，开始您的智能学习之旅！
          </Alert>
          
          <Box sx={{ 
            width: '100%', 
            height: '700px', 
            minHeight: '700px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <iframe
              src="http://localhost:3000/chatbot/RkKEUDRs2ZJHrStZ"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              frameBorder="0"
              allow="microphone"
              title="课程答疑助手"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            使用说明
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • 您可以通过语音或文字与AI助手进行交流
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • AI助手可以帮助您解答课程内容相关问题
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • 支持多种学科领域的知识问答
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 如有技术问题，请联系技术支持
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CourseAssistant;