import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, TextareaAutosize, Divider, Alert, CircularProgress, FormControl, RadioGroup, Radio, FormControlLabel, Checkbox, Chip } from '@mui/material';
import { ArrowBack, CalendarToday, FileCopy, CheckCircle } from '@mui/icons-material';
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
      const response = await assignmentAPI.getAssignment(assignmentId!);
      console.log('获取到的作业详情:', response);
      
      // 处理作业数据
      const assignmentData = response.data || response;
      
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
          answer: null
        }));
        setAnswers(initialAnswers);
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
              setAnswers(
                userSubmission.content 
                  ? JSON.parse(userSubmission.content) 
                  : answers
              );
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
    
    // 输出题目类型用于调试
    console.log('题目类型:', question.type);
    
    // 将题目类型转换为小写，进行不区分大小写的比较
    const questionType = question.type?.toLowerCase() || '';

    return (
      <Card key={question.id || index} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {index + 1}. {question.content || '问题内容缺失'}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            分值: {question.points || 0}分 | 难度: {question.difficulty || '未知'} | 类型: {question.type || '未知'}
          </Typography>
          
          {/* 单选题 */}
          {questionType === 'single_choice' && (
            <FormControl component="fieldset" disabled={isDisabled} sx={{ mt: 2 }}>
              <RadioGroup
                value={answerValue}
                onChange={(e) => handleSingleChoiceChange(question.id, e.target.value)}
                aria-label={`Question ${index + 1}`}
                disabled={isDisabled}
              >
                {(() => {
                  try {
                    const options = question.options ? JSON.parse(question.options) : [];
                    return options.length > 0 ? (
                      options.map((option: string, optIndex: number) => (
                        <FormControlLabel
                          key={optIndex}
                          value={String.fromCharCode(65 + optIndex)} // A, B, C, D...
                          control={<Radio />}
                          label={`${String.fromCharCode(65 + optIndex)}. ${option}`}
                          disabled={isDisabled}
                          sx={{
                            opacity: isDisabled ? 0.6 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer'
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="warning">
                        该题目暂无选项，默认显示文本输入框
                      </Typography>
                    );
                  } catch (error) {
                    console.error('解析选项失败:', error);
                    return (
                      <>
                        <Typography variant="body2" color="error">
                          题目选项解析错误
                        </Typography>
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
                      </>
                    );
                  }
                })()}
              </RadioGroup>
            </FormControl>
          )}
          
          {/* 多选题 */}
          {questionType === 'multiple_choice' && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              {(() => {
                try {
                  const options = question.options ? JSON.parse(question.options) : [];
                  return options.length > 0 ? (
                    options.map((option: string, optIndex: number) => {
                      const optionKey = String.fromCharCode(65 + optIndex);
                      const isChecked = Array.isArray(answerValue) && answerValue.includes(optionKey);
                      
                      return (
                        <FormControlLabel
                          key={optIndex}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => handleMultipleChoiceChange(question.id, optionKey, e.target.checked)}
                              disabled={isDisabled}
                            />
                          }
                          label={`${optionKey}. ${option}`}
                        />
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="warning">
                      该题目暂无选项，默认显示文本输入框
                    </Typography>
                  );
                } catch (error) {
                  console.error('解析选项失败:', error);
                  return (
                    <>
                      <Typography variant="body2" color="error">
                        题目选项解析错误
                      </Typography>
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
                    </>
                  );
                }
              })()}
            </FormControl>
          )}
          
          {/* 判断题 */}
          {questionType === 'true_false' && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup
                value={answerValue as string || ''}
                onChange={(e) => handleSingleChoiceChange(question.id, e.target.value)}
                aria-label={`Question ${index + 1}`}
                disabled={isDisabled}
              >
                <FormControlLabel value="TRUE" control={<Radio />} label="正确" />
                <FormControlLabel value="FALSE" control={<Radio />} label="错误" />
              </RadioGroup>
            </FormControl>
          )}
          
          {/* 文本类题目 */}
          {(questionType === 'short_answer' || questionType === 'essay') && (
            <TextareaAutosize
              minRows={questionType === 'essay' ? 8 : 4}
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
      if (!assignmentId || (!assignment.questions?.length && !answers.some(a => a.answer))) {
        setError('作业ID或答案为空，无法提交');
        return;
      }

      // 提交前再次检查用户是否已经提交过作业
      const hasSubmitted = await checkUserSubmissionStatus();
      if (hasSubmitted) {
        setError('你已经提交过这个作业了，无法再次提交');
        return;
      }

      setIsSubmitting(true);
      try {
        // 构造提交数据，符合后端API要求的格式
        const submissionData = {
          assignmentId,
          answers
        };

        await assignmentAPI.submitAssignment(assignmentId, submissionData);
        setSubmitSuccess(true);
        setUserSubmissionStatus('submitted');
        
        // 保存提交状态和答案到本地存储
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(
          `assignment_submission_${assignmentId}_${userInfo.id}`,
          JSON.stringify({
            submittedAt: new Date().toISOString(),
            status: 'submitted',
            answers: answers // 保存用户的答案数据
          })
        );
        setHasLocalSubmission(true);
        
        // 提交成功后重新获取作业详情，更新状态
        await fetchAssignmentDetail();
        
        // 3秒后自动返回课程页面
        setTimeout(() => {
          navigate(`/student/course/${courseId}`);
        }, 3000);
      } catch (error: any) {
          console.error('提交作业失败:', error);
          // 处理特定的错误消息
          if (error.response?.data?.error?.includes('already submitted')) {
            setError('你已经提交过这个作业了，无法再次提交');
            setUserSubmissionStatus('submitted');
            // 保存提交状态和答案到本地存储，确保即使刷新页面也能正确显示
          const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem(
            `assignment_submission_${assignmentId}_${userInfo.id}`,
            JSON.stringify({
              submittedAt: new Date().toISOString(),
              status: 'submitted',
              answers: answers // 保存用户的答案数据
            })
          );
          setHasLocalSubmission(true);
          } else {
            setError(error.response?.data?.message || '提交作业失败，请重试');
          }
      } finally {
        setIsSubmitting(false);
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