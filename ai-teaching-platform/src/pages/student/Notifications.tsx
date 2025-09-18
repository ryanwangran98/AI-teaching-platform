import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Notifications as NotificationsIcon,
  NotificationsNone,
  Markunread,
  Drafts,
  Delete,
  CheckCircle,
  Error,
  Info,
  Warning,
  School,
  Assignment,
  Event,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseAPI, notificationAPI, assignmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'course' | 'assignment' | 'exam' | 'general';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  relatedCourse?: {
    id: string;
    title: string;
  };
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);
  const [assignments, setAssignments] = useState<{id: string, title: string}[]>([]);

  // 获取学生课程和作业
  useEffect(() => {
    fetchCoursesAndAssignments();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [selectedCourse]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeTab]);

  const fetchCoursesAndAssignments = async () => {
    try {
      // 获取学生已加入的课程
      const courseResponse = await courseAPI.getStudentCourses();
      const coursesData = courseResponse.data || courseResponse || [];
      
      // 转换课程数据格式
      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => ({
            id: course.id,
            title: course.title || course.name || '未命名课程'
          }))
        : [];
      
      setCourses(convertedCourses);
      
      // 获取作业列表
      const assignmentResponse = await assignmentAPI.getAssignments();
      if (assignmentResponse.success) {
        setAssignments(assignmentResponse.data.assignments || assignmentResponse.data);
      }
    } catch (error) {
      console.error('获取课程或作业列表失败:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 调用真实API获取通知
      const response = await notificationAPI.getNotifications();
      
      // 处理通知数据，确保数据格式正确
      let notificationsData = Array.isArray(response.data?.notifications) 
        ? response.data.notifications
        : [];
      
      // 后端已经过滤了已发布的通知，这里不需要再次过滤
      
      // 根据选中的课程过滤通知
      let filtered = notificationsData;
      if (selectedCourse) {
        filtered = notificationsData.filter(n => 
          n.relatedCourse?.id === selectedCourse || 
          n.relatedId === selectedCourse
        );
      }
      
      setNotifications(filtered);
      setError(null);
    } catch (error) {
      console.error('获取通知失败:', error);
      setError('获取通知失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    switch (activeTab) {
      case 'unread':
        setFilteredNotifications(notifications.filter(n => !n.isRead));
        break;
      case 'read':
        setFilteredNotifications(notifications.filter(n => n.isRead));
        break;
      default:
        setFilteredNotifications(notifications);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('标记为已读失败:', error);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      // 这里需要实现一个标记为未读的API
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: false } : n
      ));
    } catch (error) {
      console.error('标记为未读失败:', error);
    }
  };

  // 学生端不提供删除通知功能，因为通知由教师/管理员创建和管理
  const handleDelete = async (id: string) => {
    console.log('学生无权限删除通知');
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('全部标记为已读失败:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      case 'success': return <CheckCircle color="success" />;
      case 'course': return <School color="primary" />;
      case 'assignment': return <Assignment color="warning" />;
      case 'exam': return <Event color="error" />;
      default: return <NotificationsIcon color="action" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      case 'course': return 'primary';
      case 'assignment': return 'warning';
      case 'exam': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info': return '信息';
      case 'warning': return '警告';
      case 'error': return '错误';
      case 'success': return '成功';
      case 'course': return '课程';
      case 'assignment': return '作业';
      case 'exam': return '考试';
      case 'general': return '通用';
      default: return type;
    }
  };

  const getRelatedContent = (notification: Notification) => {
    if (!notification.relatedId || !notification.relatedType) {
      return null;
    }
    
    switch (notification.relatedType) {
      case 'COURSE':
        const course = courses.find(c => c.id === notification.relatedId);
        return course ? `课程: ${course.title}` : '关联课程';
      case 'ASSIGNMENT':
        const assignment = assignments.find(a => a.id === notification.relatedId);
        return assignment ? `作业: ${assignment.title}` : '关联作业';
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
        <Button variant="contained" onClick={fetchNotifications}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">我的通知</Typography>
        <Button 
          variant="outlined" 
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          全部标记为已读
        </Button>
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
                  <span>{course.title}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            icon={<NotificationsIcon />} 
            label={
              <Badge badgeContent={notifications.length} color="primary">
                全部
              </Badge>
            } 
            value="all" 
          />
          <Tab 
            icon={<Markunread />} 
            label={
              <Badge badgeContent={unreadCount} color="error">
                未读
              </Badge>
            } 
            value="unread" 
          />
          <Tab icon={<Drafts />} label="已读" value="read" />
        </Tabs>
      </Paper>

      {filteredNotifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NotificationsNone sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            暂无通知
          </Typography>
        </Box>
      ) : (
        <List>
          {filteredNotifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getTypeIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" component="span">
                        {notification.title}
                      </Typography>
                      {!notification.isRead && (
                        <Chip 
                          label="未读" 
                          color="error" 
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                      {notification.relatedType && (
                        <Chip 
                          label={getTypeLabel(notification.type)} 
                          color={getTypeColor(notification.type) as any}
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.content}
                      </Typography>
                      <br />
                      {notification.relatedId && notification.relatedType && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="primary"
                        >
                          {getRelatedContent(notification)}
                        </Typography>
                      )}
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label={notification.isRead ? "标记为未读" : "标记为已读"}
                    onClick={() => 
                      notification.isRead 
                        ? handleMarkAsUnread(notification.id) 
                        : handleMarkAsRead(notification.id)
                    }
                  >
                    {notification.isRead ? <Markunread /> : <Drafts />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default NotificationsPage;