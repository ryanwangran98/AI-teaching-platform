import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
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
  Tabs,
  Tab,
  Avatar,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  Grade,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { submissionAPI } from '../../services/api';

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
  answers?: SubmissionAnswer[];
}

interface SubmissionAnswer {
  id: string;
  questionId: string;
  questionAssignmentId: string;
  answer: string;
  isCorrect: boolean;
  points: number;
  question: {
    id: string;
    title: string;
    content: string;
    type: string;
    points: number;
    options?: string[];
    correctAnswer?: string;
  };
}

const AssignmentGrading: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

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
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
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
                      onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignmentId}/submissions/${submission.id}`)}
                    >
                      查看
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Grade />}
                      onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignmentId}/submissions/${submission.id}/grade`)}
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
    </Box>
  );
};

export default AssignmentGrading;
