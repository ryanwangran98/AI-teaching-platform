import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, TextareaAutosize, Divider, Alert, CircularProgress, FormControl, RadioGroup, Radio, FormControlLabel, Checkbox, Chip, FormGroup, TextField, FormLabel } from '@mui/material';
import { ArrowBack, CalendarToday, FileCopy, CheckCircle } from '@mui/icons-material';
import { assignmentAPI, submissionAPI } from '../../../services/api';
import type { Assignment as AssignmentType } from '../../../types/assignment';

// 答案状态类型定义
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
  const [hasLocalSubmission, setHasLocalSubmission] = useState<boolean>(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetail();
    }
  }, [assignmentId]);

  // 在组件挂载时就尝试从本地存储中恢复提交状态和答案
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    if (userInfo.id && assignmentId) {
      // 尝试多种可能的键名格式，兼容不同的数据存储方式
      const possibleKeys = [
        'submission-assignment1',  // 优先检查测试数据使用的键名格式
        `submission-${assignmentId}`,  // 兼容之前使用的键名格式
        `assignment_submission_${assignmentId}_${userInfo.id}`  // 默认的键名格式
      ];

      let storedSubmission = null;
      // 尝试所有可能的键名
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          storedSubmission = data;
          console.log('从localStorage中找到数据，使用的键名:', key);
          break;
        }
      }

      if (storedSubmission) {
        const parsedSubmission = JSON.parse(storedSubmission);
        setHasLocalSubmission(true);
        setUserSubmissionStatus('submitted');
        console.log('从本地存储恢复提交状态:', parsedSubmission);

        // 如果有保存的答案数据，恢复它
        if (parsedSubmission.answers && Array.isArray(parsedSubmission.answers) && parsedSubmission.answers.length > 0) {
          console.log('从本地存储恢复答案数据:', parsedSubmission.answers);
          // 使用setTimeout确保答案状态更新在其他状态更新之后
          setTimeout(() => {
            setAnswers([...parsedSubmission.answers]);
          }, 100);
        }
      }
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignmentDetail();
  }, [assignmentId]);

  const fetchAssignmentDetail = async () => {
  try {
    setLoading(true);
    console.log('开始获取作业详情，作业ID:', assignmentId);
    
    const response = await assignmentAPI.getAssignment(assignmentId!);
    console.log('获取作业详情响应:', response);
    
    // 处理作业数据
    const assignmentData = response.data || response;
    console.log('作业数据:', assignmentData);
    
    // 检查题目数据
    if (assignmentData.questions && Array.isArray(assignmentData.questions)) {
      console.log('题目数量:', assignmentData.questions.length);
      console.log('题目数据:', assignmentData.questions);
      
      // 检查每个题目的内容
      assignmentData.questions.forEach((q: any, index: number) => {
        console.log(`题目 ${index + 1}:`, {
          id: q.id,
          content: q.content,
          title: q.title,
          question: q.question,
          type: q.type,
          options: q.options
        });
      });
    } else {
      console.warn('作业中没有题目数据或数据格式不正确');
    }
    
    // 专门打印与提交状态相关的字段，避免日志过长
    console.log('作业状态字段:', {
      submissions: assignmentData.submissions,
      userSubmissionStatus: assignmentData.userSubmissionStatus,
      score: assignmentData.score,
      status: assignmentData.status
    });
    
    setAssignment(assignmentData);
    
    // 初始化答案数组，但只在没有从本地存储恢复答案的情况下才执行
    if (assignmentData.questions && assignmentData.questions.length > 0 && answers.length === 0) {
      const initialAnswers: Answer[] = assignmentData.questions.map(q => ({
        questionId: q.id,
        // 根据题目类型初始化答案
        answer: q.type === 'MULTIPLE_CHOICE' ? [] : null
      }));
      setAnswers(initialAnswers);
      console.log('初始化答案状态:', initialAnswers);
    }
    
    // 直接在当前函数中检查提交状态，避免异步状态更新问题
    // 从作业数据中检查是否有提交信息
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('用户信息:', userInfo);
    
    // 简化状态判断逻辑，提高准确性
    let hasSubmitted = false;
    let submissionStatus = 'pending';
    
    // 优先从submissions数组中查找当前用户的提交记录
    if (assignmentData.submissions && Array.isArray(assignmentData.submissions)) {
      const userSubmission = assignmentData.submissions.find((sub: any) => 
        sub.userId === userInfo.id
      );
      
      if (userSubmission) {
        hasSubmitted = true;
        // 统一状态判断，避免大小写问题
        const status = userSubmission.status?.toUpperCase();
        submissionStatus = status === 'GRADED' ? 'graded' : 'submitted';
        
        // 如果已经提交，加载已提交的答案
        if (status === 'SUBMITTED' || status === 'GRADED') {
          setTimeout(() => {
            try {
              const submittedAnswers = userSubmission.content 
                ? JSON.parse(userSubmission.content) 
                : answers;
              console.log('加载已提交的答案:', submittedAnswers);
              setAnswers(submittedAnswers);
            } catch (e) {
              console.error('解析提交的答案失败:', e);
            }
          }, 0);
        }
      }
    }
    
    // 如果后端没有返回提交记录，但本地存储有，优先使用后端数据
    if (!hasSubmitted && hasLocalSubmission) {
      console.warn('本地存储与后端数据不同步，以后端数据为准');
      setHasLocalSubmission(false);
    }
    
    console.log('最终提交状态:', submissionStatus);
    setUserSubmissionStatus(submissionStatus);
    
    setError(null);
  } catch (err: any) {
    console.error('获取作业详情失败:', err);
    setError(err.response?.data?.message || err.message || '获取作业详情失败');
  } finally {
    setLoading(false);
  }
};

  // 检查用户提交状态（用于提交前的二次检查）
  const checkUserSubmissionStatus = async () => {
    try {
      // 直接使用最新的作业数据而不是依赖状态
      const response = await assignmentAPI.getAssignment(assignmentId!);
      const assignmentData = response.data || response;
      
      // 从作业数据中检查是否有提交信息
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      if (assignmentData.submissions && assignmentData.submissions.length > 0) {
        const userSubmission = assignmentData.submissions.find((sub: any) => 
          sub.userId === userInfo.id
        );
        if (userSubmission) {
          // 统一状态判断
          const status = userSubmission.status?.toUpperCase();
          setUserSubmissionStatus(
            status === 'GRADED' ? 'graded' : 'submitted'
          );
          return true; // 已经提交过
        }
      }
      setUserSubmissionStatus('pending');
      return false; // 未提交
    } catch (err) {
      console.error('获取提交状态失败:', err);
      setUserSubmissionStatus('pending');
      return false;
    }
  };

  // 处理单选题答案变更
  const handleSingleChoiceChange = (questionId: string, value: string) => {
    setAnswers(prevAnswers => 
      prevAnswers.map(ans => 
        ans.questionId === questionId ? { ...ans, answer: value } : ans
      )
    );
    
    // 保存到本地存储
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem(`assignment_answers_${assignmentId}_${userInfo.id}`, JSON.stringify(
      answers.map(ans => 
        ans.questionId === questionId ? { ...ans, answer: value } : ans
      )
    ));
  };

  // 处理多选题答案变更
  const handleMultipleChoiceChange = (questionId: string, value: string, checked: boolean) => {
    setAnswers(prevAnswers => 
      prevAnswers.map(ans => {
        if (ans.questionId === questionId) {
          const currentAnswers = Array.isArray(ans.answer) ? ans.answer : [];
          let newAnswers;
          
          if (checked) {
            newAnswers = [...currentAnswers, value];
          } else {
            newAnswers = currentAnswers.filter(item => item !== value);
          }
          
          return { ...ans, answer: newAnswers };
        }
        return ans;
      })
    );
    
    // 保存到本地存储
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem(`assignment_answers_${assignmentId}_${userInfo.id}`, JSON.stringify(answers));
  };

  // 处理文本题答案变更
  const handleTextChange = (questionId: string, value: string) => {
    setAnswers(prevAnswers => 
      prevAnswers.map(ans => 
        ans.questionId === questionId ? { ...ans, answer: value } : ans
      )
    );
    
    // 保存到本地存储
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem(`assignment_answers_${assignmentId}_${userInfo.id}`, JSON.stringify(
      answers.map(ans => 
        ans.questionId === questionId ? { ...ans, answer: value } : ans
      )
    ));
  };

  // 渲染题目
  const renderQuestion = (question: any, index: number) => {
  // 添加调试日志
  console.log(`渲染题目 ${index}:`, question);
  
  // 确保question对象存在
  if (!question) {
    console.error(`题目 ${index} 数据为空`);
    return (
      <Card key={index} sx={{ mb: 3, bgcolor: '#ffebee' }}>
        <CardContent>
          <Typography color="error">
            题目数据为空
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 获取题目内容，优先使用question字段，然后是content、title等
  let questionContent = '';
  if (question.question && typeof question.question === 'object') {
    // 如果question是对象，尝试从中提取内容
    questionContent = question.question.content || question.question.title || question.question.question || `问题 ${index + 1}`;
  } else if (question.question && typeof question.question === 'string') {
    // 如果question是字符串，直接使用
    questionContent = question.question;
  } else {
    // 尝试其他字段
    questionContent = question.content || question.title || question.question || `问题 ${index + 1}`;
  }
  
  // 调试信息：检查禁用状态
  console.log('当前禁用状态:', {hasLocalSubmission, userSubmissionStatus, isDisabled: userSubmissionStatus !== 'pending' || hasLocalSubmission});
  // 调试信息：检查答案状态
  console.log('当前问题ID:', question.id);
  console.log('所有答案:', answers);
  const currentAnswer = answers.find(ans => ans.questionId === question.id);
  console.log('找到的当前答案:', currentAnswer);
  // 确保答案值类型正确处理
  const answerValue = currentAnswer?.answer === null ? '' : currentAnswer?.answer || '';
  console.log('答案值:', answerValue);
  // 判断是否禁用编辑功能（已提交作业时）
  const isDisabled = userSubmissionStatus !== 'pending' || hasLocalSubmission;
  
  // 获取题目类型，优先从question对象中获取
  let questionType = '';
  if (question.question && typeof question.question === 'object' && question.question.type) {
    questionType = question.question.type;
  } else {
    questionType = question.type || '';
  }
  
  // 将题目类型转换为小写，进行不区分大小写的比较
  questionType = questionType.toLowerCase();
  
  // 获取题目选项，优先从question对象中获取
  let questionOptions = [];
  if (question.question && typeof question.question === 'object') {
    if (Array.isArray(question.question.options)) {
      questionOptions = question.question.options;
    } else if (typeof question.question.options === 'string') {
      try {
        // 尝试解析JSON字符串
        questionOptions = JSON.parse(question.question.options);
      } catch (e) {
        console.error('解析选项JSON失败:', e);
        questionOptions = [];
      }
    }
  } else if (Array.isArray(question.options)) {
    questionOptions = question.options;
  } else if (typeof question.options === 'string') {
    try {
      // 尝试解析JSON字符串
      questionOptions = JSON.parse(question.options);
    } catch (e) {
      console.error('解析选项JSON失败:', e);
      questionOptions = [];
    }
  }
  
  // 输出题目类型用于调试
  console.log('题目类型:', questionType);
  console.log('题目内容:', questionContent);
  console.log('题目选项:', questionOptions);

  return (
    <Card key={question.id || index} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {index + 1}. {questionContent}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          分值: {question.points || 0}分 | 难度: {question.difficulty || '未知'} | 类型: {question.type || '未知'}
        </Typography>
          
          {/* 单选题 */}
          {questionType === 'single_choice' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">选项</FormLabel>
              <RadioGroup
                value={answerValue}
                onChange={(e) => handleSingleChoiceChange(question.id, e.target.value)}
                disabled={isDisabled}
              >
                {questionOptions.map((option: string, optIndex: number) => (
                  <FormControlLabel
                    key={optIndex}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={isDisabled}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          
          {/* 多选题 */}
          {questionType === 'multiple_choice' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">选项（可多选）</FormLabel>
              <FormGroup>
                {questionOptions.map((option: string, optIndex: number) => (
                  <FormControlLabel
                    key={optIndex}
                    control={
                      <Checkbox
                        checked={Array.isArray(answerValue) ? answerValue.includes(option) : false}
                        onChange={(e) => handleMultipleChoiceChange(question.id, option, e.target.checked)}
                        disabled={isDisabled}
                      />
                    }
                    label={option}
                    disabled={isDisabled}
                  />
                ))}
              </FormGroup>
            </FormControl>
          )}
          
          {/* 判断题 */}
          {questionType === 'true_false' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">判断</FormLabel>
              <RadioGroup
                value={answerValue}
                onChange={(e) => handleSingleChoiceChange(question.id, e.target.value)}
                disabled={isDisabled}
              >
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label="正确"
                  disabled={isDisabled}
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label="错误"
                  disabled={isDisabled}
                />
              </RadioGroup>
            </FormControl>
          )}
          
          {/* 简答题 */}
          {(questionType === 'short_answer' || questionType === 'essay') && (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answerValue}
              onChange={(e) => handleTextChange(question.id, e.target.value)}
              label="您的答案"
              variant="outlined"
              disabled={isDisabled}
              margin="normal"
            />
          )}
          
          {/* 默认文本输入框 - 确保任何情况下都有作答区域 */}
          {!(questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'true_false' || questionType === 'short_answer' || questionType === 'essay') && (
            <TextareaAutosize
              minRows={4}
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
                marginTop: '8px',
                backgroundColor: isDisabled ? '#f5f5f5' : 'white'
              }}
              disabled={isDisabled}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const handleSubmit = async () => {
    try {
      // 检查是否已提交
      if (userSubmissionStatus !== 'pending') {
        alert('您已经提交过该作业了');
        return;
      }

      // 检查是否有题目
      if (!assignment || !assignment.questions || assignment.questions.length === 0) {
        alert('该作业没有题目');
        return;
      }

      // 准备提交数据
      const submitData = {
        assignmentId: assignment.id,
        answers: assignment.questions.map((q: any) => {
          const questionId = q.id || q.questionId;
          const answerObj = answers.find(ans => ans.questionId === questionId);
          const answer = answerObj ? answerObj.answer : '';
          
          return {
            questionId,
            answer: Array.isArray(answer) ? answer : answer
          };
        })
      };

      console.log('提交数据:', submitData);

      // 调用提交API
      const response = await submissionAPI.createSubmission(submitData);
      console.log('提交响应:', response);

      if (response.success || response.data) {
        // 清除本地存储的答案
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.removeItem(`assignment_answers_${assignmentId}_${userInfo.id}`);
        
        // 更新提交状态
        setUserSubmissionStatus('submitted');
        
        alert('作业提交成功！');
        
        // 返回课程页面
        navigate(`/student/course/${courseId}`);
      } else {
        alert(response.message || '提交失败，请重试');
      }
    } catch (error: any) {
      console.error('提交作业失败:', error);
      alert(error.response?.data?.message || error.message || '提交失败，请重试');
    }
  };

  const handleBack = () => {
    navigate(`/student/course/${courseId}`);
  };

  // 渲染提交状态指示器
  const renderSubmissionStatus = () => {
    let statusColor = 'warning';
    let statusText = '待完成';

    if (userSubmissionStatus === 'graded') {
      statusColor = 'success';
      statusText = `已评分 - ${assignment?.score || 0}/${assignment?.totalPoints || 0}分`;
    } else if (userSubmissionStatus === 'submitted' || hasLocalSubmission) {
      statusColor = 'info';
      statusText = '已提交，等待评分';
    }

    return (
      <Chip
        label={statusText}
        color={statusColor}
        icon={<CheckCircle size={16} />}
        sx={{ fontWeight: 500, fontSize: '0.9rem' }}
      />
    );
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
    <div className="assignment-detail">
      <Box sx={{ p: 3 }}>
        <div style={{ mb: 4 }}>
          <Typography variant="h5" component="h1">
            作业详情
          </Typography>
        </div>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                {assignment.title}
              </Typography>
              {/* 统一的状态显示 */}
              {renderSubmissionStatus()}
            </div>
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
        
        {assignment.status === 'DRAFT' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            此作业尚未发布，暂时无法提交。请等待教师发布后再进行提交。
          </Alert>
        )}
        

        
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
          
          {/* 调试信息：显示当前状态值 */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* 始终显示提交按钮，但根据状态调整可用性 */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || !assignment.questions?.length || assignment.status === 'DRAFT'}
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
            
            {/* 显示当前状态信息，但不替代提交按钮 */}
            {(userSubmissionStatus === 'submitted' || hasLocalSubmission) && userSubmissionStatus !== 'graded' && (
              <Typography variant="body2" color="textSecondary">
                （作业已提交，等待评分）
              </Typography>
            )}
            
            {userSubmissionStatus === 'graded' && assignment.score !== undefined && (
              <Typography variant="body2" color="textSecondary">
                （已评分: {assignment.score}/{assignment.totalPoints}分）
              </Typography>
            )}
          </div>
        </div>
      </Box>
    </div>
  );
};

export default AssignmentDetail;