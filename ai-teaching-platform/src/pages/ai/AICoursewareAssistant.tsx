import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Upload,
  Download,
  AutoFixHigh,
  Preview,
  School,
} from '@mui/icons-material';

const AICoursewareAssistant: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    topic: '',
    difficulty: 'medium',
    contentType: 'slides',
    additionalInfo: '',
  });
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 模拟AI生成内容
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = `
# ${formData.topic} - ${formData.subject} ${formData.grade}年级

## 课程目标
- 掌握${formData.topic}的基本概念
- 理解${formData.topic}的应用场景
- 能够解决相关问题

## 课程大纲
1. 引入与背景
2. 核心概念讲解
3. 实例演示
4. 练习与巩固
5. 总结与作业

## 重点难点
- 重点：${formData.topic}的核心原理
- 难点：实际应用中的问题分析

## 教学资源
- PPT课件：包含动画演示
- 练习题：分层设计，适合不同水平学生
- 拓展阅读：相关前沿应用
      `;
      
      setGeneratedContent(content);
    } catch (err) {
      setError('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.topic}-课件.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI课件助手
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        基于AI技术，快速生成高质量教学课件
      </Typography>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                课件信息配置
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="学科名称"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                
                <TextField
                  label="年级"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                
                <TextField
                  label="课程主题"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                
                <FormControl fullWidth>
                  <InputLabel>难度等级</InputLabel>
                  <Select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleSelectChange}
                    label="难度等级"
                  >
                    <MenuItem value="easy">简单</MenuItem>
                    <MenuItem value="medium">中等</MenuItem>
                    <MenuItem value="hard">困难</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>内容类型</InputLabel>
                  <Select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleSelectChange}
                    label="内容类型"
                  >
                    <MenuItem value="slides">PPT课件</MenuItem>
                    <MenuItem value="notes">讲义笔记</MenuItem>
                    <MenuItem value="exercises">练习题</MenuItem>
                    <MenuItem value="plan">教学计划</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="补充信息"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="请输入任何额外的要求或说明"
                />
                
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={loading || !formData.subject || !formData.grade || !formData.topic}
                  startIcon={loading ? <CircularProgress size={20} /> : <AutoFixHigh />}
                  fullWidth
                >
                  {loading ? '生成中...' : '生成课件'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Generated Content */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                生成结果
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {generatedContent ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="已生成" color="success" />
                  </Box>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1, 
                      maxHeight: 400, 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {generatedContent}
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleDownload}
                      startIcon={<Download />}
                    >
                      下载课件
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Preview />}
                    >
                      预览
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <AutoFixHigh sx={{ fontSize: 48, mb: 2 }} />
                  <Typography>
                    填写左侧信息，点击"生成课件"开始
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          快捷操作
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Upload />}
            >
              上传模板
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<School />}
            >
              历史课件
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AutoFixHigh />}
            >
              AI优化建议
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Preview />}
            >
              模板库
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AICoursewareAssistant;