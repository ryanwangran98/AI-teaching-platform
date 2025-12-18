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
import { courseAPI, materialAPI } from '../../services/api';

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
  datasetId?: string;
  documentId?: string;
}

interface AgentAppInfo {
  appId: string;
  accessCode: string;
}

const TeacherCreateAssistant: React.FC = () => {
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
  const [associationStatus, setAssociationStatus] = useState<Record<string, boolean>>({});
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
      const courseResponse = await courseAPI.getCourse(courseId);
      setCurrentCourse(courseResponse.data);
      
      // 获取课程材料
      const materialsResponse = await courseAPI.getCourseMaterials(courseId);
      setMaterials(materialsResponse.data);
      
      // 获取AI助手关联信息
      try {
        const assistantResponse = await courseAPI.getAssistantAssociations(courseId);
        setAssistantAssociations(assistantResponse.data);
      } catch (error) {
        console.error('获取AI助手关联信息失败:', error);
      }
      
      // 直接尝试获取AI助手应用信息（不依赖于关联信息）
      try {
        const appInfoResponse = await courseAPI.getAgentAppInfo(courseId);
        setAgentAppInfo(appInfoResponse.data);
      } catch (error) {
        console.error('获取AI助手应用信息失败:', error);
        // 如果获取失败，说明AI助手确实不存在
        setAgentAppInfo(null);
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

  // 检查资料是否关联到AI助手
  const checkMaterialAssociation = async (material: Material) => {
    if (!currentCourse?.id || !agentAppInfo?.appId) {
      return false;
    }

    if (associationStatus[material.id] !== undefined) {
      return associationStatus[material.id];
    }

    try {
      // 获取资料详细信息
      const materialResponse = await materialAPI.getMaterial(material.id);
      const materialInfo = materialResponse.data;

      if (!materialInfo.datasetId || !materialInfo.documentId) {
        setAssociationStatus(prev => ({ ...prev, [material.id]: false }));
        return false;
      }

      // 使用后端API获取课程关联的知识库列表
      const response = await fetch(`http://localhost:3001/api/courses/${currentCourse.id}/agent-app/datasets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        setAssociationStatus(prev => ({ ...prev, [material.id]: false }));
        return false;
      }

      const result = await response.json();
      
      // 检查资料的知识库是否在关联列表中
      const isAssociated = result.data?.some((dataset: any) => dataset.datasetId === materialInfo.datasetId);
      
      setAssociationStatus(prev => ({ ...prev, [material.id]: isAssociated }));
      return isAssociated;

    } catch (error) {
      console.error('检查关联状态失败:', error);
      setAssociationStatus(prev => ({ ...prev, [material.id]: false }));
      return false;
    }
  };

  useEffect(() => {
    fetchCourseAndAssistantData();
  }, [courseId]);

  // 检查所有材料的关联状态
  useEffect(() => {
    if (materials.length > 0 && agentAppInfo?.appId) {
      materials.forEach(material => {
        if (material.datasetId) {
          checkMaterialAssociation(material);
        }
      });
    }
  }, [materials, agentAppInfo?.appId]);

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

  // 重新创建AI助手
  const handleRecreateAgent = async () => {
    if (!courseId) return;
    
    // 弹出确认对话框
    const confirmed = window.confirm(
      '重新创建AI助手将会删除现有的AI助手并创建新的助手。\n\n' +
      '这将导致：\n' +
      '• 现有AI助手的对话历史将丢失\n' +
      '• 需要重新关联学习资料\n\n' +
      '确定要继续吗？'
    );
    
    if (!confirmed) return;
    
    setCreatingAgent(true);
    try {
      // 重新创建AI助手应用
      const response = await courseAPI.createAgentApp(courseId);
      setAgentAppInfo(response.data);
      
      // 重新获取助手关联信息
      const assistantResponse = await courseAPI.getAssistantAssociations(courseId);
      setAssistantAssociations(assistantResponse.data);
      
      // 重新检查所有资料的关联状态
      setAssociationStatus({});
      if (materials.length > 0 && agentAppInfo?.appId) {
        materials.forEach(material => {
          if (material.datasetId) {
            checkMaterialAssociation(material);
          }
        });
      }
      
      setSnackbar({
        open: true,
        message: 'AI助手重新创建成功！',
        severity: 'success'
      });
      
      // 关闭对话框
      setAgentDialogOpen(false);
    } catch (error: any) {
      console.error('重新创建AI助手失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '重新创建AI助手失败',
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
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* 页面标题区域 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <AutoAwesome sx={{ fontSize: 36, mr: 2, color: theme.palette.primary.main }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            创建课程AI助手
          </Typography>
        </Box>
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
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaf1 100%)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 64, 
                height: 64, 
                borderRadius: '50%',
                background: alpha(theme.palette.primary.main, 0.1),
                mr: 3
              }}>
                <Psychology sx={{ fontSize: 36, color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    AI助手状态
                  </Typography>
                  {agentAppInfo ? (
                    <Box sx={{ 
                      px: 2, 
                      py: 0.5, 
                      borderRadius: 2, 
                      background: theme.palette.success.main,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <CheckCircle sx={{ color: 'white', fontSize: 18 }} />
                      <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                        已创建
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      px: 2, 
                      py: 0.5, 
                      borderRadius: 2, 
                      background: alpha(theme.palette.warning.main, 0.05),
                      border: `1px dashed ${theme.palette.warning.main}`
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        尚未创建AI助手
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            <Box>
              <Button
                variant={agentAppInfo ? "outlined" : "contained"}
                onClick={agentAppInfo ? handleRecreateAgent : handleOpenAgentDialog}
                startIcon={agentAppInfo ? <Refresh /> : <Add />}
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  boxShadow: agentAppInfo ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: agentAppInfo ? 'none' : '0 6px 16px rgba(0,0,0,0.15)',
                  }
                }}
                disabled={creatingAgent}
              >
                {creatingAgent ? '处理中...' : (agentAppInfo ? "重新创建" : "创建AI助手")}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 关联的学习资料 */}
      {materials.filter(material => associationStatus[material.id]).length > 0 && (
        <Card 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaf1 100%)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 48, 
                height: 48, 
                borderRadius: '50%',
                background: alpha(theme.palette.secondary.main, 0.1),
                mr: 2
              }}>
                <Book sx={{ fontSize: 28, color: theme.palette.secondary.main }} />
              </Box>
              <Typography variant="h5" fontWeight="bold">
                关联的学习资料 ({materials.filter(material => associationStatus[material.id]).length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {materials
                .filter(material => associationStatus[material.id])
                .map((material) => (
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

      {/* 使用说明 */}
      <Card 
        sx={{ 
          mb: 4,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4eaf1 100%)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              background: alpha(theme.palette.info.main, 0.1),
              mr: 2
            }}>
              <Info sx={{ fontSize: 28, color: theme.palette.info.main }} />
            </Box>
            <Typography variant="h5" fontWeight="bold">
              使用提示
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
            您可以试试向助手提问有关课程知识的问题，或者让AI助手为您生成有关课程内容的PPT！
          </Typography>
        </CardContent>
      </Card>

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
          {agentAppInfo && agentAppInfo.accessCode ? (
            <Box sx={{ 
              width: '100%', 
              height: '700px', 
              minHeight: '700px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <iframe
                src={`http://localhost/chatbot/${agentAppInfo.accessCode}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'block'
                }}
                frameBorder="0"
                allow="microphone"
                title="课程AI助手"
              />
            </Box>
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
                <Grid xs={12}>
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
                
                <Grid xs={12}>
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
                
                <Grid xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
                      嵌入代码
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={`<iframe src="http://localhost/chatbot/${agentAppInfo.accessCode}" style="width: 100%; height: 600px; border: none;" allow="microphone"></iframe>`}
                      InputProps={{
                        readOnly: true,
                        sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                      }}
                      sx={{ mt: 1 }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => handleCopyToClipboard(`<iframe src="http://localhost/chatbot/${agentAppInfo.accessCode}" style="width: 100%; height: 600px; border: none;" allow="microphone"></iframe>`)}
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

export default TeacherCreateAssistant;