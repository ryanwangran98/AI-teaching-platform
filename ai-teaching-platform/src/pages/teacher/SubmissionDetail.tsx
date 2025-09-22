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
  CardHeader,
  Avatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  Grade,
  ExpandMore,
  Person,
  Email,
  Schedule,
  CheckCircle,
  Error,
  Info,
  School,
  Assignment,
  Star,
  Comment,
  Quiz,
  RateReview
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

const SubmissionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, assignmentId, submissionId } = useParams<{ courseId: string; assignmentId: string; submissionId: string }>();
  const theme = useTheme();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await submissionAPI.getSubmission(submissionId || '');
      
      if (response.success && response.data) {
        setSubmission(response.data);
      } else {
        setError('获取提交详情失败');
      }
    } catch (error) {
      console.error('获取提交详情失败:', error);
      setError('获取提交详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <Chip 
            label="待批改" 
            color="warning" 
            size="small"
            icon={<Schedule />}
            sx={{ fontWeight: 500 }}
          />
        );
      case 'GRADED':
        return (
          <Chip 
            label="已批改" 
            color="success" 
            size="small"
            icon={<CheckCircle />}
            sx={{ fontWeight: 500 }}
          />
        );
      case 'PENDING':
        return (
          <Chip 
            label="待提交" 
            color="info" 
            size="small"
            icon={<Info />}
            sx={{ fontWeight: 500 }}
          />
        );
      case 'RETURNED':
        return (
          <Chip 
            label="已返回" 
            color="secondary" 
            size="small"
            icon={<Assignment />}
            sx={{ fontWeight: 500 }}
          />
        );
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single_choice': return '单选题';
      case 'multiple_choice': return '多选题';
      case 'true_false': return '判断题';
      case 'fill_blank': return '填空题';
      case 'short_answer': return '简答题';
      case 'essay': return '论述题';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'single_choice': 
      case 'multiple_choice': 
      case 'true_false': 
        return <Star fontSize="small" />;
      case 'fill_blank': 
      case 'short_answer': 
      case 'essay': 
        return <Assignment fontSize="small" />;
      default: return <Info fontSize="small" />;
    }
  };

  const isAutoScored = (type: string) => {
    return ['single_choice', 'multiple_choice', 'true_false'].includes(type);
  };

  const handleGradeSubmission = () => {
    if (submission) {
      navigate(`/teacher/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`);
    }
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
        <Button variant="contained" onClick={fetchSubmission}>
          重新加载
        </Button>
      </Box>
    );
  }

  if (!submission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">未找到提交记录</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: 3,
      bgcolor: alpha(theme.palette.primary.main, 0.02),
      minHeight: '100vh'
    }}>
      {/* 页面头部 */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <CardHeader
          title={
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.primary.dark,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <School fontSize="large" />
              提交详情
            </Typography>
          }
          action={
          <>
            {submission.status === 'SUBMITTED' && (
              <Button
                variant="contained"
                startIcon={<Grade />}
                onClick={handleGradeSubmission}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  }
                }}
              >
                开始批改
              </Button>
            )}
            {submission.status === 'GRADED' && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RateReview />}
                onClick={handleGradeSubmission}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
                  },
                  ml: 2
                }}
              >
                重新评分
              </Button>
            )}
          </>
        }
          avatar={
            <IconButton 
              onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignmentId}/grading`)}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <ArrowBack />
            </IconButton>
          }
        />
      </Card>

      {/* 学生信息卡片 */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <CardHeader
          title={
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.primary.dark,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Person />
              学生信息
            </Typography>
          }
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  姓名
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={500}>
                {submission.user.firstName} {submission.user.lastName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  邮箱
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={500}>
                {submission.user.email}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Schedule fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  提交时间
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(submission.submittedAt)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Info fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  状态
                </Typography>
              </Box>
              {getStatusChip(submission.status)}
            </Grid>
            {submission.gradedAt && (
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Grade fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    批改时间
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(submission.gradedAt)}
                </Typography>
              </Grid>
            )}
            {submission.score !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Star fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    得分
                  </Typography>
                </Box>
                <Chip
                  label={`${submission.score}/${submission.assignment.totalPoints}`}
                  color={getScoreColor(submission.score, submission.assignment.totalPoints) as any}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      

      {/* 答题详情卡片 */}
      {submission.answers && submission.answers.length > 0 && (
        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardHeader
            title={
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.primary.dark,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Quiz />
                答题详情
              </Typography>
            }
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          />
          <CardContent>
            <Box>
              {submission.answers.map((answer, index) => (
                <Accordion 
                  key={answer.id} 
                  expanded={expandedQuestion === answer.questionAssignmentId}
                  onChange={() => setExpandedQuestion(
                    expandedQuestion === answer.questionAssignmentId ? null : answer.questionAssignmentId
                  )}
                  sx={{ 
                    mb: 2, 
                    borderRadius: 2,
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={`${index + 1}`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600, width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {answer.question.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {answer.question.content}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={getTypeLabel(answer.question.type)} 
                          size="small" 
                          color={isAutoScored(answer.question.type) ? "success" : "warning"}
                          variant="outlined"
                          icon={getTypeIcon(answer.question.type)}
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip 
                          label={`${answer.points}/${answer.question.points}分`} 
                          size="small" 
                          color={getScoreColor(answer.points, answer.question.points) as any}
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          题目内容
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {answer.question.content}
                        </Typography>
                      </Grid>
                      
                      {/* 显示选择题选项 */}
                      {answer.question.options && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            选项
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {(() => {
                              try {
                                // 如果 options 已经是数组，直接使用；如果是字符串，则解析
                                let options: string[] = [];
                                if (Array.isArray(answer.question.options)) {
                                  options = answer.question.options;
                                } else if (typeof answer.question.options === 'string') {
                                  options = JSON.parse(answer.question.options);
                                }
                                
                                return options.map((option: string, index: number) => {
                                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
                                  return (
                                    <Box 
                                      key={index} 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        p: 1.5,
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                                        }
                                      }}
                                    >
                                      <Chip
                                        label={optionLabel}
                                        size="small"
                                        sx={{ 
                                          fontWeight: 600,
                                          color: answer.answer === optionLabel ? 'primary.main' : 'inherit',
                                          borderColor: answer.answer === optionLabel ? 'primary.main' : 'default'
                                        }}
                                        variant={answer.answer === optionLabel ? "filled" : "outlined"}
                                      />
                                      <Typography variant="body1">
                                        {option}
                                      </Typography>
                                    </Box>
                                  );
                                });
                              } catch (error) {
                                return (
                                  <Typography variant="body2" color="error" sx={{ ml: 2 }}>
                                    选项格式错误
                                  </Typography>
                                );
                              }
                            })()}
                          </Box>
                        </Grid>
                      )}
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          学生答案
                        </Typography>
                        <Box 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            border: '1px dashed',
                            borderColor: alpha(theme.palette.info.main, 0.3)
                          }}
                        >
                          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {answer.question.type === 'single_choice' || answer.question.type === 'multiple_choice' 
                              ? (() => {
                                  try {
                                    // 对于选择题，需要将选项内容转换为选项字母
                                    let options: string[] = [];
                                    if (Array.isArray(answer.question.options)) {
                                      options = answer.question.options;
                                    } else if (typeof answer.question.options === 'string') {
                                      options = JSON.parse(answer.question.options);
                                    }
                                    
                                    if (answer.question.type === 'single_choice') {
                                      // 单选题：查找学生答案内容对应的选项索引，然后转换为字母
                                      const studentAnswer = answer.answer;
                                      const optionIndex = options.findIndex((opt: string) => opt === studentAnswer);
                                      return optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : studentAnswer;
                                    } else {
                                      // 多选题：解析学生答案数组，将每个选项内容转换为字母
                                      let studentAnswers;
                                      if (Array.isArray(answer.answer)) {
                                        studentAnswers = answer.answer;
                                      } else {
                                        try {
                                          studentAnswers = JSON.parse(answer.answer || '[]');
                                        } catch (e) {
                                          studentAnswers = [answer.answer];
                                        }
                                      }
                                      
                                      return studentAnswers.map((ans: string) => {
                                        const optionIndex = options.findIndex((opt: string) => opt === ans);
                                        return optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : ans;
                                      }).join(', ');
                                    }
                                  } catch (error) {
                                    return answer.answer; // 解析失败时显示原始答案
                                  }
                                })()
                              : answer.answer
                            }
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {isAutoScored(answer.question.type) && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            正确答案
                          </Typography>
                          <Box 
                            sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              bgcolor: alpha(theme.palette.success.main, 0.05),
                              border: '1px dashed',
                              borderColor: alpha(theme.palette.success.main, 0.3)
                            }}
                          >
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {(() => {
                                  try {
                                    let options: string[] = [];
                                    if (Array.isArray(answer.question.options)) {
                                      options = answer.question.options;
                                    } else if (typeof answer.question.options === 'string') {
                                      options = JSON.parse(answer.question.options);
                                    }
                                    
                                    if (answer.question.type === 'single_choice') {
                                      const correctIndex = options.findIndex((opt: string) => opt === answer.question.correctAnswer);
                                      return correctIndex !== -1 ? String.fromCharCode(65 + correctIndex) : answer.question.correctAnswer;
                                    } else if (answer.question.type === 'multiple_choice') {
                                      const correctOptions = JSON.parse(answer.question.correctAnswer || '[]');
                                      return correctOptions.map((correctOpt: string) => {
                                        const index = options.findIndex((opt: string) => opt === correctOpt);
                                        return index !== -1 ? String.fromCharCode(65 + index) : correctOpt;
                                      }).join(', ');
                                    }
                                    return answer.question.correctAnswer;
                                  } catch (error) {
                                    return answer.question.correctAnswer;
                                  }
                                })()}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isAutoScored(answer.question.type) ? (
                            <Chip 
                              label="自动评分" 
                              size="small" 
                              color="success" 
                              icon={<CheckCircle />}
                              sx={{ fontWeight: 500 }}
                            />
                          ) : (
                            <Chip 
                              label="需手动评分" 
                              size="small" 
                              color="warning" 
                              icon={<RateReview />}
                              sx={{ fontWeight: 500 }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 评分信息卡片 */}
      {submission.status === 'GRADED' && (
        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardHeader
            title={
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.primary.dark,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Grade />
                评分信息
              </Typography>
            }
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    总得分
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="primary" 
                    fontWeight={600}
                  >
                    {submission.score}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    / {submission.assignment.totalPoints}分
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    得分率
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="info.main" 
                    fontWeight={600}
                  >
                    {submission.assignment.totalPoints > 0 
                      ? Math.round(((submission.score || 0) / submission.assignment.totalPoints) * 100) 
                      : 0}%
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    状态
                  </Typography>
                  {getStatusChip(submission.status)}
                </Box>
              </Grid>
              
              {submission.feedback && (
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: '1px dashed',
                      borderColor: alpha(theme.palette.warning.main, 0.3)
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      <Comment />
                      教师评语
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {submission.feedback}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SubmissionDetail;