import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { ArrowBack, SmartToy, Book } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface AssistantAssociation {
  materialId: string;
  materialTitle: string;
  courseId: string;
  courseTitle: string;
  datasetId: string;
  appId: string;
  accessCode: string;
  createdAt: string;
}

const CourseAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [loading, setLoading] = useState(true);
  const [assistantAssociations, setAssistantAssociations] = useState<AssistantAssociation[]>([]);
  const [currentCourse, setCurrentCourse] = useState<any>(null);

  useEffect(() => {
    fetchAssistantAssociations();
  }, [courseId]);

  const fetchAssistantAssociations = async () => {
    try {
      setLoading(true);
      
      // 获取课程信息
      if (courseId) {
        const courseResponse = await fetch(`http://localhost:3001/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (courseResponse.ok) {
          const courseData = await courseResponse.json();
          const course = courseData.data;
          setCurrentCourse(course);
          
          // 如果课程已经关联了助手，创建一个关联对象
          if (course.agentAppId && course.agentAccessCode) {
            // 获取课程下的所有资料
            const materialsResponse = await fetch(`http://localhost:3001/api/materials?chapter.courseId=${courseId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (materialsResponse.ok) {
              const materialsData = await materialsResponse.json();
              const materials = materialsData.data || [];
              
              // 为每个资料创建一个关联对象
              const associations = materials.map((material: any) => ({
                materialId: material.id,
                materialTitle: material.title,
                courseId: course.id,
                courseTitle: course.title,
                datasetId: material.datasetId || '',
                appId: course.agentAppId,
                accessCode: course.agentAccessCode,
                createdAt: new Date().toISOString()
              }));
              
              setAssistantAssociations(associations);
            }
          }
        }
      }
    } catch (error) {
      console.error('获取答疑助手关联关系失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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
        {currentCourse && (
          <Chip
            label={currentCourse.title}
            color="primary"
            variant="filled"
            sx={{ ml: 2 }}
          />
        )}
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

      {/* 关联的学习资料 */}
      {assistantAssociations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Book sx={{ mr: 1 }} />
              关联的学习资料
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {assistantAssociations.map((association) => (
                <Chip
                  key={association.materialId}
                  label={association.materialTitle}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 智能体对话区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {assistantAssociations.length > 0 ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                已加载 {assistantAssociations.length} 个学习资料的知识库，您可以开始提问了！
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
                  src={`http://localhost:3000/chatbot/${assistantAssociations[0].accessCode}`}
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
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SmartToy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                暂无关联的学习资料
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                请先在学习资料页面为学习资料创建知识库并关联到课程答疑助手。
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/student/materials')}
              >
                前往学习资料页面
              </Button>
            </Box>
          )}
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