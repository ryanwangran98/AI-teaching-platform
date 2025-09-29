import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Paper,
  TextField,
  CircularProgress,
  Snackbar,
  Container,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  useNavigate,
  useParams
} from 'react-router-dom';
import {
  SmartToy,
  Book,
  Add,
  Refresh,
  Close,
  ContentCopy,
  CheckCircle,
  Info,
  Psychology,
  Chat,
  School,
  AutoAwesome
} from '@mui/icons-material';
import { courseAPI } from '../../services/api';

interface AssistantAssociation {
  id: string;
  accessCode: string;
  materialId: string;
  materialTitle: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  college: string;
  credits: number;
  level: string;
  tags: string[];
}

interface Material {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
}

interface AgentAppInfo {
  appId: string;
  accessCode: string;
}

const TeacherCourseAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [assistantAssociations, setAssistantAssociations] = useState<AssistantAssociation[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [agentAppInfo, setAgentAppInfo] = useState<AgentAppInfo | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 获取课程信息和关联资料
  const fetchCourseAndAssistantData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // 获取课程信息
      const courseResponse = await courseAPI.getCourseById(courseId);
      setCurrentCourse(courseResponse.data);
      
      // 获取课程材料
      const materialsResponse = await courseAPI.getCourseMaterials(courseId);
      setMaterials(materialsResponse.data);
      
      // 获取AI助手关联信息
      try {
        const assistantResponse = await courseAPI.getAssistantAssociations(courseId);
        setAssistantAssociations(assistantResponse.data);
        
        // 如果有助手关联信息，获取应用信息
        if (assistantResponse.data.length > 0) {
          try {
            const appInfoResponse = await courseAPI.getAgentAppInfo(courseId);
            setAgentAppInfo(appInfoResponse.data);
          } catch (error) {
            console.error('获取AI助手应用信息失败:', error);
          }
        }
      } catch (error) {
        console.error('获取AI助手关联信息失败:', error);
      }
    } catch (error) {
      console.error('获取课程信息失败:', error);
      setSnackbar({
        open: true,
        message: '获取课程信息失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAndAssistantData();
  }, [courseId]);

  const handleCreateAgentApp = async () => {
    if (!courseId) return;
    
    setCreatingAgent(true);
    try {
      // 创建AI助手应用
      const response = await courseAPI.createAgentApp(courseId);
      setAgentAppInfo(response.data);
      
      // 重新获取助手关联信息
      const assistantResponse = await courseAPI.getAssistantAssociations(courseId);
      setAssistantAssociations(assistantResponse.data);
      
      setSnackbar({
        open: true,
        message: 'AI助手创建成功！',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('创建AI助手失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '创建AI助手失败',
        severity: 'error'
      });
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: '已复制到剪贴板',
      severity: 'success'
    });
  };

  const handleOpenAgentDialog = () => {
    setAgentDialogOpen(true);
  };

  const handleCloseAgentDialog = () => {
    setAgentDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题区域 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <AutoAwesome sx={{ fontSize: 36, mr: 2, color: theme.palette.primary.main }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            课程AI助手
          </Typography>
        </Box>
        {currentCourse && (
          <Chip
            label={currentCourse.title}
            color="primary"
            variant="filled"
            sx={{ 
              fontSize: '1rem', 
              py: 0.5, 
              px: 2,
              fontWeight: 'medium'
            }}
          />
        )}
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          为您的课程创建AI助手，提供智能答疑服务
        </Typography>
      </Box>

      {/* AI助手状态卡片 */}
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Psychology sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  AI助手状态
                </Typography>
                {agentAppInfo ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip 
                      label="已创建" 
                      color="success" 
                      icon={<CheckCircle />}
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ID: {agentAppInfo.appId}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    尚未创建AI助手
                  </Typography>
                )}
              </Box>
            </Box>
            <Box>
              <Button
                variant={agentAppInfo ? "outlined" : "contained"}
                onClick={handleOpenAgentDialog}
                startIcon={agentAppInfo ? <Refresh /> : <Add />}
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold'
                }}
              >
                {agentAppInfo ? "重新创建" : "创建AI助手"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 关联的学习资料 */}
      {materials.length > 0 && (
        <Card 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Book sx={{ fontSize: 28, mr: 2, color: theme.palette.secondary.main }} />
              <Typography variant="h5" fontWeight="bold">
                关联的学习资料 ({materials.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {materials.map((material) => (
                <Chip
                  key={material.id}
                  label={material.title}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 智能体对话区域 */}
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {assistantAssociations.length > 0 ? (
            <>
              <Box sx={{ 
                p: 3, 
                background: alpha(theme.palette.success.main, 0.1),
                borderBottom: `1px solid ${theme.palette.success.main}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="success.dark">
                    已加载 {assistantAssociations.length} 个学习资料的知识库，您可以开始与AI助手对话了！
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                width: '100%', 
                height: '700px', 
                minHeight: '700px',
                position: 'relative'
              }}>
                <iframe
                  src={`http://localhost:3000/chatbot/${assistantAssociations[0].accessCode}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '0 0 12px 12px'
                  }}
                  frameBorder="0"
                  allow="microphone"
                  title="课程AI助手"
                />
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SmartToy sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                {materials.length > 0 ? "请先创建AI助手" : "暂无学习资料"}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                {materials.length > 0 
                  ? "请点击上方的'创建AI助手'按钮，为您的课程创建AI助手。" 
                  : "请先为课程添加学习资料，然后创建AI助手。"}
              </Typography>
              {materials.length === 0 && (
                <Button 
                  variant="contained" 
                  onClick={() => navigate(`/teacher/courses/${courseId}/materials`)}
                  size="large"
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold'
                  }}
                >
                  前往学习资料管理
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Info sx={{ fontSize: 28, mr: 2, color: theme.palette.info.main }} />
            <Typography variant="h5" fontWeight="bold">
              使用说明
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Chat sx={{ mr: 2, mt: 0.5, color: theme.palette.primary.main }} />
                <Typography variant="body1" color="text.secondary">
                  创建AI助手后，系统会自动关联课程下的所有学习资料
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <School sx={{ mr: 2, mt: 0.5, color: theme.palette.primary.main }} />
                <Typography variant="body1" color="text.secondary">
                  您可以通过文字与AI助手进行交流，测试其回答质量
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Psychology sx={{ mr: 2, mt: 0.5, color: theme.palette.primary.main }} />
                <Typography variant="body1" color="text.secondary">
                  AI助手可以帮助学生解答课程内容相关问题
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Refresh sx={{ mr: 2, mt: 0.5, color: theme.palette.primary.main }} />
                <Typography variant="body1" color="text.secondary">
                  如需重新创建AI助手，点击"重新创建"按钮即可
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* AI助手管理对话框 */}
      <Dialog
        open={agentDialogOpen}
        onClose={handleCloseAgentDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              AI助手管理 - {currentCourse?.title}
            </Typography>
            <IconButton onClick={handleCloseAgentDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {creatingAgent ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>正在创建AI助手，请稍候...</Typography>
            </Box>
          ) : agentAppInfo ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                AI助手创建成功！
              </Alert>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
                      AI助手ID
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body1" sx={{ flexGrow: 1, fontFamily: 'monospace' }}>
                        {agentAppInfo.appId}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyToClipboard(agentAppInfo.appId)}
                        sx={{ ml: 1 }}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
                      访问令牌
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body1" sx={{ flexGrow: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {agentAppInfo.accessCode}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyToClipboard(agentAppInfo.accessCode)}
                        sx={{ ml: 1 }}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
                      嵌入代码
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={`<iframe src="http://localhost:3000/chatbot/${agentAppInfo.accessCode}" style="width: 100%; height: 600px; border: none;" allow="microphone"></iframe>`}
                      InputProps={{
                        readOnly: true,
                        sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                      }}
                      sx={{ mt: 1 }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => handleCopyToClipboard(`<iframe src="http://localhost:3000/chatbot/${agentAppInfo.accessCode}" style="width: 100%; height: 600px; border: none;" allow="microphone"></iframe>`)}
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      复制代码
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                您可以将此嵌入代码添加到任何网页中，让学生能够直接访问AI助手。
              </Alert>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" paragraph sx={{ mb: 2 }}>
                创建AI助手后，系统将自动关联课程下的所有学习资料，为学生提供智能答疑服务。
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                当前课程包含 {materials.length} 个学习资料，这些资料将被用作AI助手的知识库。
              </Typography>
              
              {materials.length === 0 && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  当前课程没有学习资料，建议先添加学习资料再创建AI助手。
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAgentDialog} sx={{ borderRadius: 2 }}>
            关闭
          </Button>
          {!agentAppInfo && !creatingAgent && (
            <Button 
              onClick={handleCreateAgentApp}
              variant="contained"
              disabled={creatingAgent}
              sx={{ borderRadius: 2 }}
            >
              创建AI助手
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TeacherCourseAssistant;