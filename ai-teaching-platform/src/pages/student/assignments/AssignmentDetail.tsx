import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, TextField, TextareaAutosize, Divider, Alert, CircularProgress, FormControl, RadioGroup, Radio, FormControlLabel, Checkbox, FormLabel } from '@mui/material';
import { ArrowBack, CalendarToday, FileCopy, CheckCircle, Info } from '@mui/icons-material';
import { assignmentAPI } from '../../../services/api';
import type { Assignment as AssignmentType } from '../../../types/assignment';

interface Answer {
  questionId: string;
  answer: string | string[] | null;
}

const AssignmentDetail: React.FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssignmentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [userSubmissionStatus, setUserSubmissionStatus] = useState<'pending' | 'submitted' | 'graded'>('pending');
  const [submissionText, setSubmissionText] = useState(''); // 添加这个状态

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetail();
    }
  }, [assignmentId]);

  const fetchAssignmentDetail = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getAssignment(assignmentId!);
      console.log('获取到的作业详情:', response);
      
      // 处理作业数据
      const assignmentData = response.data || response;
      setAssignment(assignmentData);
      
      // 初始化答案数组
      if (assignmentData.questions && assignmentData.questions.length > 0) {
        const initialAnswers: Answer[] = assignmentData.questions.map(q => ({
          questionId: q.id,
          answer: null
        }));
        setAnswers(initialAnswers);
      }
      
      // 检查用户提交状态
      checkUserSubmissionStatus();
      setError(null);
    } catch (err: any) {
      console.error('获取作业详情失败:', err);
      setError(err.response?.data?.message || err.message || '获取作业详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 检查用户提交状态
  const checkUserSubmissionStatus = async () => {
    try {
      // 这里可以添加获取用户提交状态的API调用
      // 目前默认设置为pending
      setUserSubmissionStatus('pending');
    } catch (err) {
      console.error('获取提交状态失败:', err);
    }
  };

  // 处理单选题答案变更
  const handleSingleChoiceChange = (questionId: string, value: string) => {
    setAnswers(answers.map(ans => 
      ans.questionId === questionId ? { ...ans, answer: value } : ans
    ));
  };

  // 处理多选题答案变更
  const handleMultipleChoiceChange = (questionId: string, value: string, checked: boolean) => {
    setAnswers(answers.map(ans => {
      if (ans.questionId === questionId) {
        if (checked) {
          // 添加选项
          if (!ans.answer) {
            return { ...ans, answer: [value] };
          } else if (Array.isArray(ans.answer)) {
            return { ...ans, answer: [...ans.answer, value] };
          }
        } else {
          // 移除选项
          if (Array.isArray(ans.answer)) {
            return { ...ans, answer: ans.answer.filter(item => item !== value) };
          }
        }
      }
      return ans;
    }));
  };

  // 处理文本题答案变更
  const handleTextChange = (questionId: string, value: string) => {
    setAnswers(answers.map(ans => 
      ans.questionId === questionId ? { ...ans, answer: value } : ans
    ));
  };

  // 渲染题目
  const renderQuestion = (question: any, index: number) => {
    const currentAnswer = answers.find(ans => ans.questionId === question.id);
    const answerValue = currentAnswer?.answer || null;

    return (
      <Card key={question.id} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {index + 1}. {question.content}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            分值: {question.points}分 | 难度: {question.difficulty}
          </Typography>
          
          {question.type === 'SINGLE_CHOICE' && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup
                value={answerValue as string || ''}
                onChange={(e) => handleSingleChoiceChange(question.id, e.target.value)}
                aria-label={`Question ${index + 1}`}
              >
                {(question.options ? JSON.parse(question.options) : []).map((option: string, optIndex: number) => (
                  <FormControlLabel
                    key={optIndex}
                    value={String.fromCharCode(65 + optIndex)} // A, B, C, D...
                    control={<Radio />}
                    label={`${String.fromCharCode(65 + optIndex)}. ${option}`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          
          {question.type === 'MULTIPLE_CHOICE' && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              {(question.options ? JSON.parse(question.options) : []).map((option: string, optIndex: number) => {
                const optionKey = String.fromCharCode(65 + optIndex);
                const isChecked = Array.isArray(answerValue) && answerValue.includes(optionKey);
                
                return (
                  <FormControlLabel
                    key={optIndex}
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => handleMultipleChoiceChange(question.id, optionKey, e.target.checked)}
                      />
                    }
                    label={`${optionKey}. ${option}`}
                  />
                );
              })}
            </FormControl>
          )}
          
          {question.type === 'TRUE_FALSE' && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup
                value={answerValue as string || ''}
                onChange={(e) => handleSingleChoiceChange(question.id, e.target.value)}
                aria-label={`Question ${index + 1}`}
              >
                <FormControlLabel value="TRUE" control={<Radio />} label="正确" />
                <FormControlLabel value="FALSE" control={<Radio />} label="错误" />
              </RadioGroup>
            </FormControl>
          )}
          
          {question.type === 'SHORT_ANSWER' || question.type === 'ESSAY' && (
            <TextareaAutosize
              minRows={question.type === 'ESSAY' ? 8 : 4}
              placeholder="请在这里输入你的答案..."
              value={answerValue as string || ''}
              onChange={(e) => handleTextChange(question.id, e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginTop: '8px'
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() || !assignmentId) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 构造提交数据
      const submissionData = new FormData();
      submissionData.append('content', submissionText);

      await assignmentAPI.submitAssignment(assignmentId, submissionData);
      setSubmitSuccess(true);
      setUserSubmissionStatus('submitted');
      
      // 提交成功后重新获取作业详情，更新状态
      await fetchAssignmentDetail();
    } catch (error) {
      console.error('提交作业失败:', error);
      setError('提交作业失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/student/course/${courseId}`);
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
        <Button variant="contained" onClick={fetchAssignmentDetail}>
          重新加载
        </Button>
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          未找到作业数据
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          返回课程
        </Button>
        <Typography variant="h4" sx={{ ml: 2 }}>
          {assignment.title}
        </Typography>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FileCopy sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                {assignment.type === 'homework' ? '作业' : 
                 assignment.type === 'quiz' ? '测验' : '考试'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                截止日期: {new Date(assignment.dueDate).toLocaleString('zh-CN')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="body1" paragraph>
            {assignment.description}
          </Typography>

          {assignment.content && (
            <Typography variant="body1" paragraph>
              {assignment.content}
            </Typography>
          )}

          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              作业要求:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请在下方文本框中输入你的作业答案，完成后点击提交按钮提交作业。
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {assignment.status === 'DRAFT' && (
        <Card>
          <CardContent>
            <Alert severity="info">
              此作业尚未发布，暂时无法提交。请等待教师发布后再进行提交。
            </Alert>
          </CardContent>
        </Card>
      )}

      {assignment.status === 'PUBLISHED' && userSubmissionStatus === 'pending' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              提交作业
            </Typography>
            
            <TextareaAutosize
              minRows={10}
              placeholder="请在这里输入你的作业答案..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || !submissionText.trim()}
              >
                {isSubmitting ? '提交中...' : '提交作业'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {assignment.status === 'submitted' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
              <Typography variant="h6" color="success.main">
                已提交作业
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              你的作业已经提交成功，等待教师批改中。
            </Typography>
          </CardContent>
        </Card>
      )}

      {assignment.status === 'graded' && assignment.score !== undefined && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  已批改
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                得分: {assignment.score}/{assignment.totalPoints}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              你的作业已经批改完成。
            </Typography>
          </CardContent>
        </Card>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mt: 3 }}>
          作业提交成功！3秒后自动返回课程页面...
        </Alert>
      )}
    </Box>
  );

  // 渲染提交状态指示器
  const renderSubmissionStatus = () => {
    let statusColor = 'warning';
    let statusText = '待完成';

    if (userSubmissionStatus === 'submitted') {
      statusColor = 'info';
      statusText = '已提交';
    } else if (userSubmissionStatus === 'graded') {
      statusColor = 'success';
      statusText = '已评分';
    }

    return (
      <Chip
        label={statusText}
        color={statusColor}
        sx={{ mr: 2 }}
      />
    );
  };

  return (
    <div className="assignment-detail">
      <Box sx={{ p: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" component="h1">
            作业详情
          </Typography>
          {renderSubmissionStatus()}
        </div>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {assignment.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, mt: 3 }}>
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  截止日期
                </Typography>
                <Typography variant="body2">
                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('zh-CN') : '无截止日期'}
                </Typography>
              </div>
              
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  总分
                </Typography>
                <Typography variant="body2">
                  {assignment.totalPoints}分
                </Typography>
              </div>
              
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  题目数量
                </Typography>
                <Typography variant="body2">
                  {assignment.questions ? assignment.questions.length : 0}题
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {submitSuccess ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            作业提交成功！3秒后自动返回课程页面...
          </Alert>
        ) : null}
        
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}
        
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          题目列表
        </Typography>
        
        {assignment.questions && assignment.questions.length > 0 ? (
          <div>
            {assignment.questions.map((question: any, index: number) => renderQuestion(question, index))}
          </div>
        ) : (
          <Typography variant="body1" color="textSecondary">
            暂无题目
          </Typography>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
          <Button variant="outlined" onClick={handleBack}>
            返回课程
          </Button>
          
          {userSubmissionStatus === 'pending' && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || !assignment.questions?.length}
              sx={{ backgroundColor: '#4caf50' }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  提交中...
                </>
              ) : (
                '提交作业'
              )}
            </Button>
          )}
          
          {userSubmissionStatus === 'submitted' && (
            <Alert severity="info" sx={{ width: 'fit-content' }}>
              作业已提交，等待评分
            </Alert>
          )}
          
          {userSubmissionStatus === 'graded' && (
            <Alert severity="success" sx={{ width: 'fit-content' }}>
              作业已评分
            </Alert>
          )}
        </div>
      </Box>
    </div>
  );
};

export default AssignmentDetail;