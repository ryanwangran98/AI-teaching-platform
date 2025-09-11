import React, { useState } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  // 测试登录功能
  const testLogin = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // 使用mock数据中的教师账号登录
      await login('teacher1@example.com', 'password123');
      setTestResult({
        success: true,
        message: '登录测试成功！已使用教师账号登录' 
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `登录测试失败: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // 测试学生登录
  const testStudentLogin = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // 使用mock数据中的学生账号登录
      await login('student1@example.com', 'password123');
      setTestResult({
        success: true,
        message: '学生登录测试成功！已使用学生账号登录' 
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `学生登录测试失败: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // 测试登出功能
  const testLogout = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      await logout();
      setTestResult({
        success: true,
        message: '登出测试成功！'
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `登出测试失败: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // 前往教师页面
  const goToTeacherPage = () => {
    navigate('/teacher');
  };

  // 前往学生页面
  const goToStudentPage = () => {
    navigate('/student');
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Mock服务测试页面</Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>当前用户状态</Typography>
          {user ? (
            <div>
              <Typography>用户名: {user.username}</Typography>
              <Typography>邮箱: {user.email}</Typography>
              <Typography>角色: {user.role}</Typography>
              <Typography>真实姓名: {user.firstName} {user.lastName}</Typography>
            </div>
          ) : (
            <Typography>未登录</Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Button 
          variant="contained" 
          onClick={testLogin} 
          disabled={loading || (user?.role === 'teacher')}
        >
          {loading ? <CircularProgress size={20} /> : '测试教师登录'}
        </Button>
        
        <Button 
          variant="contained" 
          onClick={testStudentLogin} 
          disabled={loading || (user?.role === 'student')}
        >
          {loading ? <CircularProgress size={20} /> : '测试学生登录'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={testLogout} 
          disabled={loading || !user}
        >
          {loading ? <CircularProgress size={20} /> : '测试登出'}
        </Button>
        
        {user?.role === 'teacher' && (
          <Button 
            variant="outlined" 
            onClick={goToTeacherPage}
          >
            前往教师页面
          </Button>
        )}
        
        {user?.role === 'student' && (
          <Button 
            variant="outlined" 
            onClick={goToStudentPage}
          >
            前往学生页面
          </Button>
        )}
      </Box>

      {testResult && (
        <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {testResult.message}
        </Alert>
      )}

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>测试账号信息</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">教师账号:</Typography>
            <Typography>邮箱: teacher1@example.com</Typography>
            <Typography>密码: password123</Typography>
          </Box>
          <div>
            <Typography variant="subtitle1">学生账号:</Typography>
            <Typography>邮箱: student1@example.com</Typography>
            <Typography>密码: password123</Typography>
          </div>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>管理员账号:</Typography>
          <Typography>邮箱: admin@example.com</Typography>
          <Typography>密码: admin123</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestPage;