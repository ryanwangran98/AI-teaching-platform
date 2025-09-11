import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  AccessTime,
  CheckCircle,
  ExpandMore,
  Quiz,
  Assignment,
  VideoLibrary,
  Description,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: number;
  progress: number;
  completed: boolean;
  content: {
    type: 'video' | 'text' | 'quiz' | 'assignment';
    title: string;
    duration?: number;
    content?: string;
    questions?: QuizQuestion[];
    assignment?: Assignment;
  }[];
  resources: {
    type: 'video' | 'document' | 'link';
    title: string;
    url: string;
  }[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submitted: boolean;
  score?: number;
}

const ChapterLearning: React.FC = () => {
  const [currentChapter, setCurrentChapter] = useState<Chapter>({
    id: '1',
    title: '第1章：函数与极限',
    description: '本章将介绍函数的基本概念、极限的定义和计算方法，为后续微积分学习打下基础。',
    duration: 120,
    progress: 60,
    completed: false,
    content: [
      {
        type: 'video',
        title: '1.1 函数的概念',
        duration: 15,
      },
      {
        type: 'text',
        title: '1.2 函数的表示方法',
        content: '函数可以通过解析式、图像、表格等多种方式表示。每种表示方法都有其特点和适用场景...',
      },
      {
        type: 'video',
        title: '1.3 极限的概念',
        duration: 20,
      },
      {
        type: 'quiz',
        title: '1.4 函数与极限测验',
        questions: [
          {
            id: '1',
            question: '函数的定义域是指什么？',
            options: ['函数值的范围', '自变量的取值范围', '函数图像的范围', '以上都不对'],
            correctAnswer: 1,
            explanation: '函数的定义域是指自变量的取值范围，即函数有意义的输入值的集合。',
          },
          {
            id: '2',
            question: '当x趋近于0时，sin(x)/x的极限值是多少？',
            options: ['0', '1', '无穷大', '不存在'],
            correctAnswer: 1,
            explanation: '根据重要极限公式，lim(x→0) sin(x)/x = 1。',
          },
        ],
      },
      {
        type: 'assignment',
        title: '1.5 章节作业',
        assignment: {
          id: '1',
          title: '函数与极限练习题',
          description: '完成教材第1章习题1-10题，要求写出详细的解题过程。',
          dueDate: '2024-01-20',
          maxScore: 100,
          submitted: false,
        },
      },
    ],
    resources: [
      {
        type: 'video',
        title: '函数图像绘制技巧',
        url: '#',
      },
      {
        type: 'document',
        title: '极限计算常用公式',
        url: '#',
      },
      {
        type: 'link',
        title: '在线计算器',
        url: '#',
      },
    ],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [assignmentText, setAssignmentText] = useState('');

  const handleNextStep = () => {
    if (currentStep < currentChapter.content.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers({ ...quizAnswers, [questionId]: answerIndex });
  };

  const handleSubmitQuiz = () => {
    // 提交测验逻辑
    console.log('Quiz answers:', quizAnswers);
  };

  const handleSubmitAssignment = () => {
    // 提交作业逻辑
    console.log('Assignment submitted:', assignmentText);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'text': return <Description />;
      case 'quiz': return <Quiz />;
      case 'assignment': return <Assignment />;
      default: return <Description />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'document': return <Description />;
      case 'link': return <Description />;
      default: return <Description />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{currentChapter.title}</Typography>
          <Typography variant="body1" color="textSecondary">
            {currentChapter.description}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6">
            进度: {currentChapter.progress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={currentChapter.progress}
            sx={{ width: 200, height: 8, borderRadius: 4, mt: 1 }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 左侧：章节内容 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stepper activeStep={currentStep} orientation="vertical">
                {currentChapter.content.map((content, index) => (
                  <Step key={index}>
                    <StepLabel>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getContentIcon(content.type)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {content.title}
                        </Typography>
                      </Box>
                    </StepLabel>
                    <StepContent>
                      {content.type === 'video' && (
                        <Box>
                          <Typography variant="body1" gutterBottom>
                            视频学习 ({content.duration}分钟)
                          </Typography>
                          <Box sx={{ 
                            height: 300, 
                            bgcolor: '#f5f5f5', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderRadius: 1,
                            mb: 2
                          }}>
                            <Typography variant="h6" color="textSecondary">
                              视频播放器
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                              variant="contained"
                              startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                              onClick={() => setIsPlaying(!isPlaying)}
                            >
                              {isPlaying ? '暂停' : '播放'}
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {content.type === 'text' && (
                        <Box>
                          <Typography variant="body1" paragraph>
                            {content.content}
                          </Typography>
                        </Box>
                      )}

                      {content.type === 'quiz' && content.questions && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            测验练习
                          </Typography>
                          {content.questions.map((question, qIndex) => (
                            <Box key={question.id} sx={{ mb: 3 }}>
                              <Typography variant="body1" gutterBottom>
                                {qIndex + 1}. {question.question}
                              </Typography>
                              <FormControl component="fieldset">
                                {question.options.map((option, oIndex) => (
                                  <Box key={oIndex} sx={{ mb: 1 }}>
                                    <label>
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={oIndex}
                                        checked={quizAnswers[question.id] === oIndex}
                                        onChange={() => handleQuizAnswer(question.id, oIndex)}
                                      />
                                      <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                                        {option}
                                      </Typography>
                                    </label>
                                  </Box>
                                ))}
                              </FormControl>
                            </Box>
                          ))}
                          <Button
                            variant="contained"
                            onClick={handleSubmitQuiz}
                          >
                            提交测验
                          </Button>
                        </Box>
                      )}

                      {content.type === 'assignment' && content.assignment && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {content.assignment.title}
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {content.assignment.description}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            截止日期: {content.assignment.dueDate}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            满分: {content.assignment.maxScore}分
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="作业答案"
                            value={assignmentText}
                            onChange={(e) => setAssignmentText(e.target.value)}
                            variant="outlined"
                            sx={{ mb: 2 }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleSubmitAssignment}
                          >
                            提交作业
                          </Button>
                        </Box>
                      )}

                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<NavigateBefore />}
                          onClick={handlePrevStep}
                          disabled={currentStep === 0}
                        >
                          上一步
                        </Button>
                        <Button
                          variant="contained"
                          endIcon={<NavigateNext />}
                          onClick={handleNextStep}
                          disabled={currentStep === currentChapter.content.length - 1}
                        >
                          下一步
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧：学习资源和进度 */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* 学习资源 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                学习资源
              </Typography>
              <List dense>
                {currentChapter.resources.map((resource, index) => (
                  <ListItem key={index} button>
                    <ListItemIcon>
                      {getResourceIcon(resource.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={resource.title}
                      secondary={resource.type === 'video' ? '视频' : 
                               resource.type === 'document' ? '文档' : '链接'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* 章节内容列表 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                章节内容
              </Typography>
              <List dense>
                {currentChapter.content.map((content, index) => (
                  <ListItem
                    key={index}
                    button
                    selected={currentStep === index}
                    onClick={() => setCurrentStep(index)}
                  >
                    <ListItemIcon>
                      {getContentIcon(content.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={content.title}
                      secondary={content.type === 'video' ? `${content.duration}分钟` : 
                               content.type === 'quiz' ? '测验' : 
                               content.type === 'assignment' ? '作业' : '阅读'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChapterLearning;