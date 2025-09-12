import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Badge,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Visibility,
  Grade,
  Description,
  AccessTime,
  Person,
  School,
  Assessment,
  Edit,
  Save,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentAPI, submissionAPI } from '../../services/api';

interface Submission {
  id: string;
  userId: string;
  assignmentId: string;
  content?: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
  submittedAt: string;
  gradedAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId?: string;
  };
  assignment: {
    id: string;
    title: string;
    totalPoints: number;
    type: string;
    knowledgePoint: {
      chapter: {
        course: {
          title: string;
        };
      };
    };
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AssignmentGrading: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [gradingLoading, setGradingLoading] = useState(false);

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    graded: 0,
    averageScore: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await submissionAPI.getSubmissions({
        assignmentId,
      });

      let submissionsData = [];
      if (response.success && response.data.submissions) {
        submissionsData = response.data.submissions;
      } else if (Array.isArray(response)) {
        submissionsData = response;
      }

      setSubmissions(submissionsData);
      calculateStats(submissionsData);
    } catch (error) {
      console.error('获取提交失败:', error);
      setError('获取学生提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (submissions: Submission[]) => {
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'SUBMITTED').length;
    const graded = submissions.filter(s => s.status === 'GRADED').length;
    const gradedSubmissions = submissions.filter(s => s.score !== undefined);
    const averageScore = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length 
      : 0;

    setStats({
      total,
      pending,
      graded,
      averageScore: Math.round(averageScore * 100) / 100,
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore(submission.score || 0);
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;

    try {
      setGradingLoading(true);
      
      const gradeData = {
        score,
        feedback,
      };

      await submissionAPI.updateSubmission(selectedSubmission.id, {
        ...gradeData,
        status: 'GRADED',
      });

      // 更新本地数据
      const updatedSubmissions = submissions.map(s =>
        s.id === selectedSubmission.id
          ? { ...s, score, feedback, status: 'GRADED' as const, gradedAt: new Date().toISOString() }
          : s
      );
      setSubmissions(updatedSubmissions);
      calculateStats(updatedSubmissions);

      setGradingDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('评分失败:', error);
      setError('评分失败，请稍后重试');
    } finally {
      setGradingLoading(false);
    }
  };

  const getFilteredSubmissions = () => {
    switch (tabValue) {
      case 1: // 待批改
        return submissions.filter(s => s.status === 'SUBMITTED');
      case 2: // 已批改
        return submissions.filter(s => s.status === 'GRADED');
      default: // 全部
        return submissions;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Chip label="待批改" color="warning" size="small" />;
      case 'GRADED':
        return <Chip label="已批改" color="success" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getScoreColor = (score: number, totalPoints: number) => {
    const percentage = (score / totalPoints) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
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
        <Button variant="contained" onClick={fetchSubmissions}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* 页面头部 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          作业批改
        </Typography>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                总提交数
              </Typography>
              <Typography variant="h4" component="div">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                待批改
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                已批改
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {stats.graded}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                平均分
              </Typography>
              <Typography variant="h4" component="div" color="primary.main">
                {stats.averageScore}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`全部 (${stats.total})`} />
          <Tab label={`待批改 (${stats.pending})`} />
          <Tab label={`已批改 (${stats.graded})`} />
        </Tabs>
      </Box>

      {/* 提交列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>学生</TableCell>
              <TableCell>提交时间</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>得分</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredSubmissions().map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      {submission.user.firstName?.[0]}{submission.user.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {submission.user.firstName} {submission.user.lastName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {submission.user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                <TableCell>{getStatusChip(submission.status)}</TableCell>
                <TableCell>
                  {submission.status === 'GRADED' && submission.score !== undefined ? (
                    <Chip
                      label={`${submission.score}/${submission.assignment.totalPoints}`}
                      color={getScoreColor(submission.score, submission.assignment.totalPoints) as any}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      查看
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Grade />}
                      onClick={() => handleGradeSubmission(submission)}
                      disabled={submission.status === 'GRADED'}
                    >
                      {submission.status === 'GRADED' ? '修改' : '批改'}
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 查看提交详情对话框 */}
      <Dialog
        open={selectedSubmission !== null && !gradingDialogOpen}
        onClose={() => setSelectedSubmission(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>提交详情</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                学生信息
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    姓名
                  </Typography>
                  <Typography variant="body1">
                    {selectedSubmission.user.firstName} {selectedSubmission.user.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    邮箱
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.user.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    提交时间
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedSubmission.submittedAt)}
                  </Typography>
                </Grid>
                {selectedSubmission.gradedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      批改时间
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedSubmission.gradedAt)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                作业内容
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                {selectedSubmission.content ? (
                  (() => {
                    try {
                      const content = JSON.parse(selectedSubmission.content);
                      return (
                        <Box>
                          <Typography variant="body1" gutterBottom>
                            <strong>答案详情：</strong>
                          </Typography>
                          {Array.isArray(content) ? (
                            content.map((item: any, index: number) => (
                              <Box key={index} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  题目 {index + 1}:
                                </Typography>
                                <Typography variant="body2">
                                  答案: {typeof item.answer === 'object' ? JSON.stringify(item.answer) : item.answer}
                                </Typography>
                                <Typography variant="body2">
                                  得分: {item.score || 0}分
                                </Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                              {selectedSubmission.content}
                            </Typography>
                          )}
                        </Box>
                      );
                    } catch (error) {
                      return (
                        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                          {selectedSubmission.content}
                        </Typography>
                      );
                    }
                  })()
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    无提交内容
                  </Typography>
                )}
              </Paper>

              {selectedSubmission.status === 'GRADED' && (
                <>
                  <Typography variant="h6" gutterBottom>
                    评分信息
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        得分
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {selectedSubmission.score} / {selectedSubmission.assignment.totalPoints}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        得分率
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {Math.round(((selectedSubmission.score || 0) / selectedSubmission.assignment.totalPoints) * 100)}%
                      </Typography>
                    </Grid>
                    {selectedSubmission.feedback && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          教师评语
                        </Typography>
                        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                          {selectedSubmission.feedback}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSubmission(null)}>关闭</Button>
          {selectedSubmission?.status === 'PENDING' && (
            <Button
              variant="contained"
              onClick={() => {
                setSelectedSubmission(null);
                handleGradeSubmission(selectedSubmission);
              }}
            >
              开始批改
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 评分对话框 */}
      <Dialog
        open={gradingDialogOpen}
        onClose={() => setGradingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>作业评分</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                学生: {selectedSubmission.user.firstName} {selectedSubmission.user.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                作业: {selectedSubmission.assignment.title}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                总分: {selectedSubmission.assignment.totalPoints}分
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="得分"
                value={score}
                onChange={(e) => setScore(Math.max(0, Math.min(Number(e.target.value), selectedSubmission.assignment.totalPoints)))}
                inputProps={{
                  min: 0,
                  max: selectedSubmission.assignment.totalPoints,
                  step: 0.5,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="评语"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="请输入评语..."
              />

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  得分率: {Math.round((score / selectedSubmission.assignment.totalPoints) * 100)}%
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradingDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSaveGrade}
            disabled={gradingLoading}
            startIcon={gradingLoading ? <CircularProgress size={16} /> : <Save />}
          >
            {gradingLoading ? '保存中...' : '保存评分'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentGrading;