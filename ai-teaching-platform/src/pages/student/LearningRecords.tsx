import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  PlayArrow,
  AccessTime,
  CheckCircle,
  Schedule,
  TrendingUp,
  School,
} from '@mui/icons-material';
import { learningRecordAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface LearningRecord {
  id: string;
  courseName: string;
  chapterName: string;
  duration: number;
  completed: boolean;
  startTime: string;
  endTime: string;
  progress: number;
  score: number;
  type: 'video' | 'quiz' | 'assignment' | 'reading';
  notes: string;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  totalDuration: number;
  completedDuration: number;
  progress: number;
  lastStudyTime: string;
  chapters: {
    id: string;
    name: string;
    progress: number;
    lastStudyTime: string;
  }[];
}

const LearningRecords: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<{id: string, name: string}[]>([]);

  const [selectedRecord, setSelectedRecord] = useState<LearningRecord | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // 获取学生课程
  useEffect(() => {
    fetchCourses();
  }, []);

  // 获取学习记录
  useEffect(() => {
    fetchLearningRecords();
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      // 获取学生已加入的课程
      const response = await courseAPI.getStudentCourses();
      const coursesData = response.data || response || [];
      
      // 转换课程数据格式
      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => ({
            id: course.id,
            name: course.title || course.name || '未命名课程'
          }))
        : [];
      
      setCourses(convertedCourses);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    }
  };

  const fetchLearningRecords = async () => {
    try {
      setLoading(true);
      // 调用API获取学习记录，根据选中的课程过滤
      const params: any = {};
      if (user?.id) {
        params.studentId = user.id;
      }
      if (selectedCourse) {
        params.courseId = selectedCourse;
      }
      
      const response = await learningRecordAPI.getLearningRecords(params);
      // 修复数据处理逻辑，正确提取学习记录数据
      const recordsData = response.data?.records || response.data || [];
      
      // 转换学习记录数据格式
      const convertedRecords = Array.isArray(recordsData) 
        ? recordsData.map(record => ({
            id: record.id,
            courseName: record.courseName || '未知课程',
            chapterName: record.chapterName || '未知章节',
            duration: record.duration || 0,
            completed: record.completed || false,
            startTime: record.lastStudyTime ? new Date(record.lastStudyTime).toLocaleString() : '',
            endTime: record.lastStudyTime ? new Date(record.lastStudyTime).toLocaleString() : '',
            progress: isNaN(Number(record.progress)) ? 0 : Math.max(0, Math.min(100, record.progress || 0)),
            score: record.score || 0,
            type: record.type || 'video',
            notes: record.notes || '',
          }))
        : [];
      
      setRecords(convertedRecords);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('获取学习记录失败:', error);
      setError('获取学习记录失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetail = (record: LearningRecord) => {
    setSelectedRecord(record);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedRecord(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayArrow color="primary" />;
      case 'quiz': return <CheckCircle color="success" />;
      case 'assignment': return <Schedule color="warning" />;
      case 'reading': return <TrendingUp color="info" />;
      default: return <AccessTime />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return '视频学习';
      case 'quiz': return '测验练习';
      case 'assignment': return '作业提交';
      case 'reading': return '阅读材料';
      default: return type;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">学习记录</Typography>
      </Box>

      {/* 课程选择器 */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>选择课程</InputLabel>
          <Select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            label="选择课程"
          >
            <MenuItem value="">全部课程</MenuItem>
            {courses.map(course => (
              <MenuItem key={course.id} value={course.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ mr: 1, fontSize: 16 }} />
                  <span>{course.name}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>总学习时长</Typography>
              </Box>
              <Typography variant="h4">12小时30分钟</Typography>
              <Typography variant="body2" color="textSecondary">
                本周新增2小时15分钟
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>完成课程</Typography>
              </Box>
              <Typography variant="h4">8</Typography>
              <Typography variant="body2" color="textSecondary">
                总计12门课程
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>平均成绩</Typography>
              </Box>
              <Typography variant="h4">85.5</Typography>
              <Typography variant="body2" color="textSecondary">
                较上周提升3.2分
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="warning" />
                <Typography variant="h6" sx={{ ml: 1 }}>连续学习</Typography>
              </Box>
              <Typography variant="h4">5天</Typography>
              <Typography variant="body2" color="textSecondary">
                保持每日学习习惯
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="学习记录" />
          <Tab label="课程进度" />
          <Tab label="学习统计" />
        </Tabs>
      </Box>

      {/* 学习记录 */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>课程名称</TableCell>
                <TableCell>章节名称</TableCell>
                <TableCell>学习类型</TableCell>
                <TableCell>学习时长</TableCell>
                <TableCell>完成状态</TableCell>
                <TableCell>学习进度</TableCell>
                <TableCell>成绩</TableCell>
                <TableCell>学习时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.courseName}</TableCell>
                  <TableCell>{record.chapterName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTypeIcon(record.type)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {getTypeLabel(record.type)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDuration(record.duration)}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.completed ? '已完成' : '未完成'}
                      color={record.completed ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                      variant="determinate"
                      value={isNaN(Number(record.progress)) ? 0 : Math.max(0, Math.min(100, record.progress || 0))}
                      sx={{ height: 8, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {isNaN(Number(record.progress)) ? 0 : Math.max(0, Math.min(100, record.progress || 0))}%
                  </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {record.completed ? `${record.score}分` : '-'}
                  </TableCell>
                  <TableCell>{record.startTime}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleViewDetail(record)}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 课程进度 */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {courseProgress.map((course) => (
            <Grid size={{ xs: 12, md: 6 }} key={course.courseId}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {course.courseName}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      总进度: {isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0))}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={isNaN(Number(course.progress)) ? 0 : Math.max(0, Math.min(100, course.progress || 0))}
                      sx={{ height: 8, borderRadius: 5, mb: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    已完成: {formatDuration(course.completedDuration)} / {formatDuration(course.totalDuration)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    最后学习时间: {course.lastStudyTime}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    章节进度:
                  </Typography>
                  <List dense>
                    {course.chapters.map((chapter) => (
                      <ListItem key={chapter.id} component="div">
                        <ListItemText
                          primary={chapter.name}
                          secondary={`进度: ${chapter.progress}%`}
                        />
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={chapter.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 学习统计 */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  每日学习时长
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  最近7天平均学习时长: 1小时45分钟
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  学习类型分布
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  视频学习: 60% | 测验练习: 25% | 作业提交: 15%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 详情对话框 */}
      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>学习记录详情</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedRecord.courseName} - {selectedRecord.chapterName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                学习类型: {getTypeLabel(selectedRecord.type)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                学习时长: {formatDuration(selectedRecord.duration)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                学习进度: {selectedRecord.progress}%
              </Typography>
              {selectedRecord.completed && (
                <Typography variant="body1" gutterBottom>
                  成绩: {selectedRecord.score}分
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                开始时间: {selectedRecord.startTime}
              </Typography>
              <Typography variant="body1" gutterBottom>
                结束时间: {selectedRecord.endTime}
              </Typography>
              <Typography variant="body1" gutterBottom>
                学习笔记:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedRecord.notes}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LearningRecords;