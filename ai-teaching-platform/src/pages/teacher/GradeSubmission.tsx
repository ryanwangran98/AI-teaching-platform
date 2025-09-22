import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Divider,
  Avatar,
  alpha,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Assignment,
  Grade as GradeIcon,
  CheckCircle,
  Cancel
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
  score?: number;
  maxScore?: number;
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

const GradeSubmission: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, assignmentId, submissionId } = useParams<{ courseId: string; assignmentId: string; submissionId: string }>();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [feedback, setFeedback] = useState<string>('');
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const response = await submissionAPI.getSubmission(submissionId || '');
        
        if (response.success && response.data) {
          const submissionData = response.data;
          setSubmission(submissionData);
          
          // 初始化分数
          const initialScores: { [key: string]: number } = {};
          let total = 0;
          let max = 0;
          
          if (submissionData.answers) {
            submissionData.answers.forEach((answer: SubmissionAnswer) => {
              initialScores[answer.questionAssignmentId] = answer.points || 0;
              total += answer.points || 0;
              max += answer.question.points || 0;
            });
          }
          
          setScores(initialScores);
          setTotalScore(total);
          setMaxScore(max);
          setFeedback(submissionData.feedback || '');
        } else {
          setError('获取提交详情失败');
        }
      } catch (err) {
        setError('获取提交详情失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleQuestionScoreChange = (questionAssignmentId: string, score: number) => {
    const maxPoints = submission?.answers?.find(
      a => a.questionAssignmentId === questionAssignmentId
    )?.question.points || 0;
    
    setScores(prev => ({
      ...prev,
      [questionAssignmentId]: Math.max(0, Math.min(score, maxPoints))
    }));
  };

  const handleSaveGrade = async () => {
    if (!submission) return;

    try {
      setGradingLoading(true);
      
      // 计算总分
      const calculatedTotalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      
      const gradeData = {
        score: calculatedTotalScore,
        feedback,
      };

      const response = await submissionAPI.updateSubmission(submission.id, {
        ...gradeData,
        status: 'GRADED',
      });

      if (response.success) {
        // 导航回批改列表页面
        navigate(`/teacher/courses/${courseId}/assignments/${assignmentId}/grading`);
      } else {
        setError('保存评分失败');
      }
    } catch (error) {
      console.error('评分失败:', error);
      setError('评分失败，请稍后重试');
    } finally {
      setGradingLoading(false);
    }
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
    // Trigger hot reload
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

  const isAutoScored = (type: string) => {
    return ['single_choice', 'multiple_choice', 'true_false'].includes(type);
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
        <Button variant="contained" onClick={() => window.location.reload()}>
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

  const calculatedTotalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const scorePercentage = submission.assignment.totalPoints > 0 
    ? Math.round((calculatedTotalScore / submission.assignment.totalPoints) * 100) 
    : 0;

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: 3,
      bgcolor: alpha('#f5f7fa', 0.5),
      minHeight: '100vh'
    }}>
      {/* 页面头部 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`)}
              sx={{ 
                bgcolor: alpha('#1976d2', 0.1),
                '&:hover': { bgcolor: alpha('#1976d2', 0.2) }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight={600}>
              作业评分
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleSaveGrade}
            disabled={gradingLoading}
            startIcon={gradingLoading ? <CircularProgress size={16} /> : <Save />}
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            {gradingLoading ? '保存中...' : '保存评分'}
          </Button>
        </Box>
      </Paper>

      {/* 学生和作业信息卡片 */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <CardHeader 
          title="学生与作业信息"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          sx={{ 
            bgcolor: alpha('#1976d2', 0.05),
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}
        />
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3,
                pb: 2,
                borderBottom: '1px dashed rgba(0,0,0,0.1)'
              }}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48,
                  bgcolor: alpha('#1976d2', 0.1),
                  color: '#1976d2',
                  fontSize: '1.5rem'
                }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={500}>
                    学生信息
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    学生详情与提交状态
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    姓名:
                  </Typography>
                  <Typography variant="body1">
                    {submission.user.firstName} {submission.user.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="textSecondary">
                    邮箱:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {submission.user.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="textSecondary">
                    提交时间:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(submission.submittedAt)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="textSecondary">
                    状态:
                  </Typography>
                  <Chip 
                    label={submission.status === 'SUBMITTED' ? '已提交' : 
                           submission.status === 'GRADED' ? '已评分' : 
                           submission.status === 'PENDING' ? '待提交' : '已返回'}
                    color={submission.status === 'SUBMITTED' ? 'info' : 
                           submission.status === 'GRADED' ? 'success' : 
                           submission.status === 'PENDING' ? 'warning' : 'default'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3,
                pb: 2,
                borderBottom: '1px dashed rgba(0,0,0,0.1)'
              }}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48,
                  bgcolor: alpha('#4caf50', 0.1),
                  color: '#4caf50',
                  fontSize: '1.5rem'
                }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={500}>
                    作业信息
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    作业详情与评分标准
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    标题:
                  </Typography>
                  <Typography variant="body1">
                    {submission.assignment.title}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="textSecondary">
                    总分:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {submission.assignment.totalPoints}分
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="textSecondary">
                    类型:
                  </Typography>
                  <Chip 
                    label={getTypeLabel(submission.assignment.type)} 
                    size="small" 
                    color="primary"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="textSecondary">
                    题目数量:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {submission.answers?.length || 0}题
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 评分统计卡片 */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <CardHeader 
          title="评分统计"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          sx={{ 
            bgcolor: alpha('#1976d2', 0.05),
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}
        />
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              总分: <span style={{ color: '#1976d2' }}>{calculatedTotalScore}</span> / {submission.assignment.totalPoints}
            </Typography>
            <Chip 
              label={scorePercentage >= 90 ? '优秀' : scorePercentage >= 70 ? '良好' : scorePercentage >= 60 ? '及格' : '不及格'} 
              color={scorePercentage >= 90 ? 'success' : scorePercentage >= 70 ? 'primary' : scorePercentage >= 60 ? 'warning' : 'error'}
              sx={{ 
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 2,
                py: 0.5
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              得分率: {scorePercentage}%
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={scorePercentage} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: alpha('#e0e0e0', 0.5),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: scorePercentage >= 90 ? '#4caf50' : 
                            scorePercentage >= 70 ? '#2196f3' : 
                            scorePercentage >= 60 ? '#ff9800' : '#f44336'
                  }
                }} 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 题目评分卡片 */}
      {submission.answers && submission.answers.length > 0 && (
        <Card sx={{ 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <CardHeader 
            title="题目评分"
            titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            sx={{ 
              bgcolor: alpha('#1976d2', 0.05),
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}
          />
          <CardContent sx={{ p: 3 }}>
            <Box>
              {submission.answers.map((answer, index) => {
                const isAuto = isAutoScored(answer.question.type);
                const maxPoints = answer.question.points;
                const currentScore = scores[answer.questionAssignmentId] || 0;
                const scorePercentage = maxPoints > 0 ? (currentScore / maxPoints) * 100 : 0;
                
                return (
                  <Paper 
                    key={answer.questionAssignmentId} 
                    sx={{ 
                      p: 3, 
                      mb: 3, 
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 36, 
                          height: 36,
                          bgcolor: alpha('#1976d2', 0.1),
                          color: '#1976d2',
                          fontWeight: 600
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" fontWeight={500}>
                            {answer.question.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={getTypeLabel(answer.question.type)} 
                              size="small" 
                              color={isAuto ? "success" : "warning"}
                              sx={{ fontWeight: 500 }}
                            />
                            <Chip 
                              label={`${currentScore}/${maxPoints}分`} 
                              size="small" 
                              color={scorePercentage >= 90 ? 'success' : scorePercentage >= 70 ? 'primary' : scorePercentage >= 60 ? 'warning' : 'error'}
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        </Box>
                        
                        {/* 题目详情 - 默认展示 */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: alpha('#f5f7fa', 0.5), borderRadius: 1 }}>
                          <Typography variant="body2" color="textSecondary" paragraph sx={{ fontWeight: 500 }}>
                            题目内容:
                          </Typography>
                          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
                            {answer.question.content}
                          </Typography>
                          
                          {/* 显示选择题选项 */}
                          {answer.question.options && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="textSecondary" paragraph sx={{ fontWeight: 500 }}>
                                选项:
                              </Typography>
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
                                    const isSelected = answer.answer === optionLabel;
                                    return (
                                      <Box 
                                        key={index} 
                                        sx={{ 
                                          display: 'flex',
                                          alignItems: 'center',
                                          p: 1,
                                          mb: 1,
                                          borderRadius: 1,
                                          bgcolor: isSelected ? alpha('#1976d2', 0.1) : 'transparent',
                                          border: isSelected ? '1px solid rgba(25, 118, 210, 0.3)' : '1px solid transparent'
                                        }}
                                      >
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            mr: 1,
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            color: isSelected ? '#1976d2' : 'inherit'
                                          }}
                                        >
                                          {optionLabel}.
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            flex: 1,
                                            color: isSelected ? '#1976d2' : 'inherit',
                                            fontWeight: isSelected ? '500' : 'normal'
                                          }}
                                        >
                                          {option}
                                        </Typography>
                                        {isSelected && (
                                          <CheckCircle sx={{ color: '#1976d2', fontSize: 18 }} />
                                        )}
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
                          )}
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                              学生答案:
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                borderColor: alpha('#1976d2', 0.3),
                                bgcolor: alpha('#1976d2', 0.02)
                              }}
                            >
                              <Typography variant="body1">
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
                            </Paper>
                          </Box>
                          
                          {isAuto && (
                            <Box>
                              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                                正确答案:
                              </Typography>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  borderColor: alpha('#4caf50', 0.3),
                                  bgcolor: alpha('#4caf50', 0.02)
                                }}
                              >
                                <Typography variant="body1" sx={{ color: '#4caf50' }}>
                                  {answer.question.correctAnswer}
                                </Typography>
                              </Paper>
                            </Box>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TextField
                            type="number"
                            label="得分"
                            value={currentScore}
                            onChange={(e) => handleQuestionScoreChange(
                              answer.questionAssignmentId, 
                              parseFloat(e.target.value) || 0
                            )}
                            inputProps={{
                              min: 0,
                              max: maxPoints,
                              step: 0.5,
                            }}
                            disabled={isAuto}
                            sx={{ 
                              width: 120,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1
                              }
                            }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            / {maxPoints} 分
                          </Typography>
                          
                          {isAuto ? (
                            <Chip 
                              icon={<CheckCircle />}
                              label="自动评分" 
                              size="small" 
                              color="success" 
                              sx={{ fontWeight: 500 }}
                            />
                          ) : (
                            <Chip 
                              label="手动评分" 
                              size="small" 
                              color="warning" 
                              sx={{ fontWeight: 500 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 评语卡片 */}
      <Card sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <CardHeader 
          title="评语（可选）"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          sx={{ 
            bgcolor: alpha('#1976d2', 0.05),
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}
        />
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请输入评语..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default GradeSubmission;