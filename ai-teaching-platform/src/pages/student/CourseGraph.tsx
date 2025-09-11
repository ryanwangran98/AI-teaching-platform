import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
} from '@mui/material';
import {
  AccountTree,
  School,
  TrendingUp,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { courseAPI, knowledgePointAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  parentId?: string;
  children?: KnowledgePoint[];
  progress: number; // 0-100
  isCompleted: boolean;
  courseId: string;
  chapterId?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalPoints: number;
  completedPoints: number;
}

interface CourseGraphProps {
  courseId?: string; // 可选的课程ID参数
}

const CourseGraph: React.FC<CourseGraphProps> = ({ courseId: propCourseId }) => {
  const navigate = useNavigate();
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 确定使用的课程ID
  const effectiveCourseId = propCourseId || routeCourseId || '';

  // 获取学生课程
  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (effectiveCourseId) {
      setSelectedCourse(effectiveCourseId);
    } else if (selectedCourse) {
      fetchKnowledgePoints(selectedCourse);
    }
  }, [effectiveCourseId, selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // 调用API获取学生已加入的课程
      const response = await courseAPI.getStudentCourses();
      const coursesData = response.data || response || [];
      
      // 转换课程数据格式
      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => ({
            id: course.id,
            title: course.title || course.name || '未命名课程',
            description: course.description || '暂无描述',
            progress: isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0)),
            totalPoints: course.totalPoints || course.chapters?.length || 0,
            completedPoints: course.completedPoints || 0,
          }))
        : [];
      
      setCourses(convertedCourses);
      
      // 如果没有选中课程且有课程数据，默认选择第一个
      if (!selectedCourse && convertedCourses.length > 0) {
        setSelectedCourse(convertedCourses[0].id);
      }
      
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('获取课程失败:', error);
      setError('获取课程失败，请稍后重试');
      setLoading(false);
    }
  };

  const fetchKnowledgePoints = async (courseId: string) => {
    try {
      setLoading(true);
      // 调用API获取课程知识点
      const response = await knowledgePointAPI.getKnowledgePoints({ courseId });
      const pointsData = response.data || response || [];
      
      // 转换知识点数据格式
      const convertPoints = (points: any[]): KnowledgePoint[] => {
        return points.map(point => ({
          id: point.id,
          title: point.title || '未命名知识点',
          description: point.description || '暂无描述',
          parentId: point.parentId || undefined,
          progress: isNaN(Number(point.progress)) ? 0 : Math.max(0, Math.min(100, point.progress || 0)),
          isCompleted: point.isCompleted || false,
          courseId: point.courseId || courseId,
          chapterId: point.chapterId || undefined,
        }));
      };
      
      const convertedPoints = convertPoints(Array.isArray(pointsData) ? pointsData : []);
      setKnowledgePoints(convertedPoints);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('获取知识点失败:', error);
      setError('获取知识点失败，请稍后重试');
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'success';
    if (progress >= 50) return 'primary';
    return 'warning';
  };

  const renderKnowledgePoint = (point: KnowledgePoint, level: number = 0) => {
    return (
      <Box key={point.id} sx={{ mb: 2, ml: level * 3 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            borderLeft: `4px solid ${point.isCompleted ? '#4caf50' : '#2196f3'}`,
            bgcolor: point.isCompleted ? 'rgba(76, 175, 80, 0.05)' : 'rgba(33, 150, 243, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {point.isCompleted ? (
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                ) : (
                  <RadioButtonUnchecked color="primary" sx={{ mr: 1 }} />
                )}
                <Typography variant="h6">{point.title}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                {point.description}
              </Typography>
            </Box>
            <Chip 
              label={`${point.progress}%`} 
              color={getProgressColor(point.progress) as any}
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <Box 
                sx={{ 
                  height: 8, 
                  bgcolor: 'grey.200', 
                  borderRadius: 4,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    width: `${point.progress}%`, 
                    height: '100%', 
                    bgcolor: point.isCompleted ? 'success.main' : 'primary.main',
                  }}
                />
              </Box>
            </Box>
            <Typography variant="caption" color="textSecondary">
              {point.progress}%
            </Typography>
          </Box>
        </Paper>
        
        {point.children && point.children.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {point.children.map(child => renderKnowledgePoint(child, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  if (loading && courses.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchCourses}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">课程图谱</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">课程选择</Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>选择课程</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="选择课程"
                >
                  {courses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {selectedCourse && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">学习进度</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {courses.find(c => c.id === selectedCourse)?.progress || 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    已完成 {courses.find(c => c.id === selectedCourse)?.completedPoints || 0}/
                    {courses.find(c => c.id === selectedCourse)?.totalPoints || 0} 个知识点
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountTree color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">知识结构</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {knowledgePoints.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    个主要知识点
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      ) : selectedCourse ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              {courses.find(c => c.id === selectedCourse)?.title} 知识图谱
            </Typography>
          </Box>
          
          {knowledgePoints.length > 0 ? (
            <Box>
              {knowledgePoints.map(point => renderKnowledgePoint(point))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <AccountTree sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                该课程暂无知识图谱数据
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AccountTree sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            请选择一门课程查看知识图谱
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CourseGraph;