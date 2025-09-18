import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Edit from '@mui/icons-material/Edit';
import Refresh from '@mui/icons-material/Refresh';
import School from '@mui/icons-material/School';
import { courseAPI, studentStatsAPI, assignmentAPI } from '../../services/api';

interface AssignmentStats {
  id: string;
  title: string;
  type: '作业' | '考试' | '项目';
  averageScore: number;
  submissionRate: number;
  studentCount: number;
  submittedCount: number;
  scoreDistribution: { score: string; count: number }[];
  chapterId?: string;
  chapterTitle?: string;
  courseName?: string;
  isMerged?: boolean;
  originalAssignments?: AssignmentStats[];
}

interface CourseStats {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  assignments: AssignmentStats[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StudentStatsCharts: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourses.length > 0) {
      fetchCourseStats();
    }
  }, [selectedCourses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesResponse = await courseAPI.getMyCourses();
      let courses = [];
      
      if (Array.isArray(coursesResponse)) {
        courses = coursesResponse;
      } else if (coursesResponse && typeof coursesResponse === 'object') {
        if (Array.isArray(coursesResponse.data)) {
          courses = coursesResponse.data;
        } else if (coursesResponse.courses && Array.isArray(coursesResponse.courses)) {
          courses = coursesResponse.courses;
        } else if (coursesResponse.data && coursesResponse.data.courses) {
          courses = coursesResponse.data.courses;
        }
      }
      
      // 按发布时间倒序排序，取最新的3个作为默认选中
      const sortedCourses = courses.sort((a: any, b: any) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      setCourses(sortedCourses);
      
      // 默认选择最新的3个课程
      const defaultSelected = sortedCourses.slice(0, 3).map((course: any) => course.id);
      setSelectedCourses(defaultSelected);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStats = async () => {
    try {
      setLoading(true);
      const statsPromises = selectedCourses.map(async (courseId) => {
        // 获取课程信息
        const courseInfo = courses.find(c => c.id === courseId);
        if (!courseInfo) return null;
        
        // 获取课程作业
        const assignmentsResponse = await assignmentAPI.getAssignments({ courseId });
        let assignments = [];
        
        if (Array.isArray(assignmentsResponse)) {
          assignments = assignmentsResponse;
        } else if (assignmentsResponse && typeof assignmentsResponse === 'object') {
          if (Array.isArray(assignmentsResponse.data)) {
            assignments = assignmentsResponse.data;
          } else if (assignmentsResponse.assignments && Array.isArray(assignmentsResponse.assignments)) {
            assignments = assignmentsResponse.assignments;
          } else if (assignmentsResponse.data && assignmentsResponse.data.assignments) {
            assignments = assignmentsResponse.data.assignments;
          }
        }
        
        // 获取学生统计信息
        const studentStatsResponse = await studentStatsAPI.getStudentStats(courseId);
        let studentStats = {};
        
        if (studentStatsResponse && typeof studentStatsResponse === 'object') {
          studentStats = studentStatsResponse.data || studentStatsResponse;
        }
        
        // 处理作业统计数据
        const assignmentStats: AssignmentStats[] = assignments.map((assignment: any) => {
          const assignmentId = assignment.id;
          const stats = (studentStats as any).assignmentStats?.find((s: any) => s.assignmentId === assignmentId) || {};
          
          // 确定作业类型
          let type: '作业' | '考试' | '项目' = '作业';
          if (assignment.type === 'EXAM') type = '考试';
          if (assignment.type === 'PROJECT') type = '项目';
          
          // 计算平均分
          const averageScore = stats.averageScore || 0;
          
          // 计算提交率
          const studentCount = courseInfo._count?.enrollments || 
                             courseInfo.enrollments?.length || 
                             courseInfo.studentCount || 
                             0;
          const submittedCount = stats.submittedCount || 0;
          const submissionRate = studentCount > 0 ? (submittedCount / studentCount) * 100 : 0;
          
          // 分数分布
          const scoreDistribution = [
            { score: '90-100', count: stats.scoreDistribution?.['90-100'] || 0 },
            { score: '80-89', count: stats.scoreDistribution?.['80-89'] || 0 },
            { score: '70-79', count: stats.scoreDistribution?.['70-79'] || 0 },
            { score: '60-69', count: stats.scoreDistribution?.['60-69'] || 0 },
            { score: '0-59', count: stats.scoreDistribution?.['0-59'] || 0 },
          ];
          
          return {
            id: assignmentId,
            title: assignment.title || '未命名作业',
            type,
            averageScore,
            submissionRate,
            studentCount,
            submittedCount,
            scoreDistribution,
            chapterId: assignment.chapter?.id,
            chapterTitle: assignment.chapter?.title,
          };
        });
        
        return {
          id: courseId,
          name: courseInfo.title || courseInfo.name || '未命名课程',
          code: courseInfo.code || '',
          studentCount: courseInfo._count?.enrollments || 
                        courseInfo.enrollments?.length || 
                        courseInfo.studentCount || 
                        0,
          assignments: assignmentStats,
        };
      });
      
      const statsResults = await Promise.all(statsPromises);
      setCourseStats(statsResults.filter(Boolean) as CourseStats[]);
    } catch (error) {
      console.error('获取课程统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelection = (courseIds: string[]) => {
    setSelectedCourses(courseIds);
  };

  const handleRefresh = () => {
    fetchCourseStats();
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // 按作业类型获取作业列表
  const getAssignmentsByType = (type: '作业' | '考试' | '项目') => {
    return courseStats.flatMap(course => 
      course.assignments
        .filter(assignment => assignment.type === type)
        .map(assignment => ({
          ...assignment,
          courseName: course.name,
        }))
    );
  };

  // 按章节和作业类型分组数据，用于条形图
  const getChapterStatsByType = (type: '作业' | '考试' | '项目') => {
    // 获取所有章节
    const allChapters = new Set<string>();
    const chapterTitles: Record<string, string> = {};
    
    // 收集所有章节
    courseStats.forEach(course => {
      course.assignments.forEach(assignment => {
        if (assignment.type === type && assignment.chapterId) {
          allChapters.add(assignment.chapterId);
          if (assignment.chapterTitle) {
            chapterTitles[assignment.chapterId] = assignment.chapterTitle;
          }
        }
      });
    });
    
    // 如果没有章节信息，则使用课程名称作为章节
    if (allChapters.size === 0) {
      courseStats.forEach(course => {
        const courseKey = `course-${course.id}`;
        allChapters.add(courseKey);
        chapterTitles[courseKey] = course.name;
      });
    }
    
    // 为每个章节计算统计数据
    return Array.from(allChapters).map(chapterId => {
      const chapterTitle = chapterTitles[chapterId] || '未命名章节';
      
      // 获取该章节的所有指定类型作业
      const chapterAssignments = courseStats.flatMap(course => 
        course.assignments.filter(assignment => {
          if (assignment.type !== type) return false;
          
          // 如果有章节ID，则按章节匹配
          if (assignment.chapterId) {
            return assignment.chapterId === chapterId;
          }
          
          // 如果没有章节信息，则按课程匹配
          return `course-${course.id}` === chapterId;
        })
      );
      
      // 计算统计数据
      const totalStudents = chapterAssignments.reduce((sum, assignment) => sum + assignment.studentCount, 0);
      const totalScore = chapterAssignments.reduce((sum, assignment) => sum + (assignment.averageScore * assignment.studentCount), 0);
      const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;
      
      return {
        chapterId,
        chapterTitle,
        averageScore: parseFloat(averageScore.toFixed(1)),
        assignmentCount: chapterAssignments.length,
        totalStudents,
      };
    }).sort((a, b) => a.chapterTitle.localeCompare(b.chapterTitle)); // 按章节标题排序
  };

  // 获取所有类型作业的章节统计数据，用于统一图表
  const getAllChapterStats = () => {
    // 获取所有章节
    const allChapters = new Set<string>();
    const chapterTitles: Record<string, string> = {};
    
    // 收集所有章节
    courseStats.forEach(course => {
      course.assignments.forEach(assignment => {
        if (assignment.chapterId) {
          allChapters.add(assignment.chapterId);
          if (assignment.chapterTitle) {
            chapterTitles[assignment.chapterId] = assignment.chapterTitle;
          }
        }
      });
    });
    
    // 如果没有章节信息，则使用课程名称作为章节
    if (allChapters.size === 0) {
      courseStats.forEach(course => {
        const courseKey = `course-${course.id}`;
        allChapters.add(courseKey);
        chapterTitles[courseKey] = course.name;
      });
    }
    
    // 为每个章节计算统计数据
    return Array.from(allChapters).map(chapterId => {
      const chapterTitle = chapterTitles[chapterId] || '未命名章节';
      
      // 初始化各类型作业的统计数据
      const typeStats: Record<string, { totalScore: number; totalStudents: number; assignmentCount: number }> = {
        '作业': { totalScore: 0, totalStudents: 0, assignmentCount: 0 },
        '考试': { totalScore: 0, totalStudents: 0, assignmentCount: 0 },
        '项目': { totalScore: 0, totalStudents: 0, assignmentCount: 0 },
      };
      
      // 获取该章节的所有作业
      const chapterAssignments = courseStats.flatMap(course => 
        course.assignments.filter(assignment => {
          // 如果有章节ID，则按章节匹配
          if (assignment.chapterId) {
            return assignment.chapterId === chapterId;
          }
          
          // 如果没有章节信息，则按课程匹配
          return `course-${course.id}` === chapterId;
        })
      );
      
      // 计算各类型作业的统计数据
      chapterAssignments.forEach(assignment => {
        const type = assignment.type;
        if (typeStats[type]) {
          typeStats[type].totalScore += assignment.averageScore * assignment.studentCount;
          typeStats[type].totalStudents += assignment.studentCount;
          typeStats[type].assignmentCount += 1;
        }
      });
      
      // 计算各类型作业的平均分
      const result: any = {
        chapterId,
        chapterTitle,
      };
      
      Object.keys(typeStats).forEach(type => {
        const stats = typeStats[type];
        const averageScore = stats.totalStudents > 0 ? stats.totalScore / stats.totalStudents : 0;
        result[`${type}平均分`] = parseFloat(averageScore.toFixed(1));
        result[`${type}数量`] = stats.assignmentCount;
      });
      
      return result;
    }).sort((a, b) => a.chapterTitle.localeCompare(b.chapterTitle)); // 按章节标题排序
  };

  // 渲染章节平均分条形图
  const renderChapterAverageScoreChart = (type: '作业' | '考试' | '项目') => {
    const chapterStats = getChapterStatsByType(type);
    
    if (chapterStats.length === 0) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            background: 'linear-gradient(145deg, #f5f7fa, #e4e8f0)',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            暂无{type}数据
          </Typography>
          <Typography variant="body2" color="text.disabled">
            请添加相关{type}或检查数据源
          </Typography>
        </Paper>
      );
    }
    
    // 获取该类型的颜色
    const getColor = () => {
      switch(type) {
        case '作业': return '#4f46e5';
        case '考试': return '#10b981';
        case '项目': return '#f59e0b';
        default: return '#8884d8';
      }
    };
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
          backdropFilter: 'blur(5px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            {type}平均分统计
          </Typography>
          <Chip 
            label={`共 ${chapterStats.length} 个章节`} 
            size="small" 
            sx={{ 
              backgroundColor: getColor() + '20',
              color: getColor(),
              fontWeight: 'bold',
              borderRadius: 2,
              px: 1,
              py: 0.5
            }} 
          />
        </Box>
        
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chapterStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="chapterTitle" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                domain={[0, 100]}
                label={{ 
                  value: '平均分', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b' }
                }}
                tick={{ fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                formatter={(value) => [`${value}分`, '平均分']}
                labelFormatter={(label) => `章节: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="averageScore" 
                name="平均分"
                fill={getColor()}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
          backdropFilter: 'blur(5px)'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            按章节统计{type}平均分
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            最高分: {Math.max(...chapterStats.map(c => c.averageScore)).toFixed(1)}分
          </Typography>
        </Box>
      </Paper>
    );
  };

  // 渲染所有类型作业的统一图表
  const renderAllTypesChart = () => {
    const allChapterStats = getAllChapterStats();
    
    if (allChapterStats.length === 0) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            background: 'linear-gradient(145deg, #f5f7fa, #e4e8f0)',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            暂无数据
          </Typography>
          <Typography variant="body2" color="text.disabled">
            请添加相关作业或检查数据源
          </Typography>
        </Paper>
      );
    }
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
          backdropFilter: 'blur(5px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            各类型作业平均分统计
          </Typography>
          <Chip 
            label={`共 ${allChapterStats.length} 个章节`} 
            size="small" 
            sx={{ 
              backgroundColor: '#4f46e520',
              color: '#4f46e5',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 1,
              py: 0.5
            }} 
          />
        </Box>
        
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={allChapterStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="chapterTitle" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                domain={[0, 100]}
                label={{ 
                  value: '平均分', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b' }
                }}
                tick={{ fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                formatter={(value, name) => [`${value}分`, name.replace('平均分', '')]}
                labelFormatter={(label) => `章节: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="作业平均分" 
                name="作业"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="考试平均分" 
                name="考试"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="项目平均分" 
                name="项目"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
          backdropFilter: 'blur(5px)'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            按章节统计各类型作业平均分
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              作业最高分: {Math.max(...allChapterStats.map(c => c['作业平均分'] || 0)).toFixed(1)}分
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              考试最高分: {Math.max(...allChapterStats.map(c => c['考试平均分'] || 0)).toFixed(1)}分
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              项目最高分: {Math.max(...allChapterStats.map(c => c['项目平均分'] || 0)).toFixed(1)}分
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  if (loading && courseStats.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      minHeight: '100vh',
      p: 3,
      borderRadius: 3,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.18)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
        backdropFilter: 'blur(5px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 8, 
            height: 40, 
            background: 'linear-gradient(90deg, #4f46e5, #10b981, #f59e0b)', 
            borderRadius: 4, 
            mr: 2 
          }} />
          学情统计
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {editMode && (
            <FormControl sx={{ 
              minWidth: 200, 
              mr: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(79, 70, 229, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(79, 70, 229, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4f46e5',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#64748b',
              },
              '& .MuiSelect-select': {
                borderRadius: 2,
              }
            }}>
              <InputLabel id="course-select-label">选择课程</InputLabel>
              <Select
                labelId="course-select-label"
                multiple
                value={selectedCourses}
                onChange={(e) => handleCourseSelection(e.target.value as string[])}
                label="选择课程"
                sx={{ borderRadius: 2 }}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title || course.name || '未命名课程'} ({course.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            sx={{ 
              mr: 1, 
              backgroundColor: 'white', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': { 
                backgroundColor: '#f0f0f0',
                transform: 'rotate(180deg)',
                transition: 'transform 0.5s ease'
              },
              transition: 'transform 0.5s ease, background-color 0.3s ease'
            }}
          >
            <Refresh />
          </IconButton>
          <IconButton 
            onClick={toggleEditMode}
            sx={{ 
              backgroundColor: editMode ? '#4f46e5' : 'white', 
              color: editMode ? 'white' : 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': { 
                backgroundColor: editMode ? '#4338ca' : '#f0f0f0',
                transform: 'scale(1.05)'
              },
              transition: 'transform 0.3s ease, background-color 0.3s ease'
            }}
          >
            <Edit />
          </IconButton>
        </Box>
      </Box>

      {loading && courseStats.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)'
        }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 2, color: '#4f46e5' }} />
          <Typography variant="h6" color="text.secondary">
            正在加载数据...
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* 统一图表展示所有类型作业 */}
          <Box sx={{ mb: 5 }}>
            {renderAllTypesChart()}
          </Box>

          {courseStats.length === 0 && !loading && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                borderRadius: 3,
                background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box sx={{ 
                backgroundColor: '#f1f5f9',
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                mx: 'auto'
              }}>
                <School sx={{ color: '#94a3b8', fontSize: 40 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                没有找到相关统计数据
              </Typography>
              <Typography variant="body2" color="text.disabled">
                请添加相关课程或检查数据源
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StudentStatsCharts;