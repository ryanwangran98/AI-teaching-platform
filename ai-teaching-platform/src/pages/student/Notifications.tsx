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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
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

  // 获取学生课程
  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [selectedCourse]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeTab]);

  const fetchCourses = async () => {
    try {
      // 获取学生已加入的课程
      const response = await courseAPI.getStudentCourses();
      const coursesData = response.data || response || [];
      
      // 转换课程数据格式
      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => ({
            id: course.id,
            title: course.title || course.name || '未命名课程'
          }))
        : [];
      
      setCourses(convertedCourses);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // 这里应该调用真实的API获取通知
      // 暂时使用模拟数据，但会根据选中的课程进行过滤
      setTimeout(() => {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: '课程更新提醒',
            content: '您学习的《高等数学》课程新增了第5章内容，请及时学习。',
            type: 'info',
            isRead: false,
            createdAt: '2024-01-15T10:30:00Z',
            relatedCourse: {
              id: 'math101',
              title: '高等数学',
            },
          },
          {
            id: '2',
            title: '作业截止提醒',
            content: '《线性代数》第3章作业将于明天截止，请尽快完成。',
            type: 'warning',
            isRead: false,
            createdAt: '2024-01-14T14:20:00Z',
            relatedCourse: {
              id: 'linear101',
              title: '线性代数',
            },
          },
          {
            id: '3',
            title: '成绩发布',
            content: '您提交的《大学英语》第2单元作业已批改完成，成绩为85分。',
            type: 'success',
            isRead: true,
            createdAt: '2024-01-13T09:15:00Z',
            relatedCourse: {
              id: 'english101',
              title: '大学英语',
            },
          },
          {
            id: '4',
            title: '系统维护通知',
            content: '平台将于本周六凌晨2:00-4:00进行系统维护，届时服务将暂时不可用。',
            type: 'info',
            isRead: true,
            createdAt: '2024-01-12T16:45:00Z',
          },
          {
            id: '5',
            title: '课程即将开课',
            content: '您已报名的《Python编程基础》课程将于明天正式开课，请做好学习准备。',
            type: 'info',
            isRead: false,
            createdAt: '2024-01-11T11:30:00Z',
            relatedCourse: {
              id: 'python101',
              title: 'Python编程基础',
            },
          },
        ];
        
        // 根据选中的课程过滤通知
        let filtered = mockNotifications;
        if (selectedCourse) {
          filtered = mockNotifications.filter(n => 
            n.relatedCourse?.id === selectedCourse
          );
        }
        
        setNotifications(filtered);
        setError(null);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取通知失败:', error);
      setError('获取通知失败，请稍后重试');
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

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAsUnread = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: false } : n
    ));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <NotificationsIcon color="action" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      default: return 'default';
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
                      {notification.relatedCourse && (
                        <Chip 
                          label={notification.relatedCourse.title} 
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
                  <IconButton 
                    edge="end" 
                    aria-label="删除"
                    onClick={() => handleDelete(notification.id)}
                    sx={{ ml: 1 }}
                  >
                    <Delete />
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