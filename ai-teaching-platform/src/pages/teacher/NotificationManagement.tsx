import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Send,
  Add,
} from '@mui/icons-material';
import { notificationAPI } from '../../services/api';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'course' | 'assignment' | 'exam' | 'general';
  targetType: 'all' | 'course' | 'class' | 'individual';
  targetValue: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'sent' | 'scheduled';
  sendTime: string;
  createdAt: string;
  sender: string;
  readCount: number;
  totalCount: number;
}

// 定义新通知的接口
interface NewNotification {
  title: string;
  content: string;
  type: 'course' | 'assignment' | 'exam' | 'general';
  target: 'all' | 'course' | 'class' | 'individual';
  priority: 'low' | 'medium' | 'high';
  schedule: string;
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [newNotification, setNewNotification] = useState<NewNotification>({
    title: '',
    content: '',
    type: 'general',
    target: 'all',
    priority: 'medium',
    schedule: ''
  });
  const [scheduleTime, setScheduleTime] = useState('');

  // 获取通知列表
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      if (response.success) {
        // 转换数据格式以匹配前端接口
        const transformedNotifications = response.data.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type,
          targetType: 'all', // 这里需要根据实际数据调整
          targetValue: '所有学生', // 这里需要根据实际数据调整
          priority: 'medium', // 这里需要根据实际数据调整
          status: n.isRead ? 'sent' : 'draft',
          sendTime: new Date(n.createdAt).toLocaleString(),
          createdAt: new Date(n.createdAt).toLocaleString(),
          sender: n.user?.firstName ? `${n.user.firstName} ${n.user.lastName}` : '系统',
          readCount: n.isRead ? 1 : 0,
          totalCount: 1,
        }));
        setNotifications(transformedNotifications);
      }
    } catch (err) {
      console.error('获取通知列表失败:', err);
      setError('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNotification(null);
    setNewNotification({
      title: '',
      content: '',
      type: 'general',
      target: 'all',
      priority: 'medium',
      schedule: ''
    });
    setOpenDialog(true);
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setNewNotification({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      target: notification.targetType,
      priority: notification.priority,
      schedule: notification.sendTime
    });
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingNotification(null);
    setScheduleTime('');
  };

  const handleSend = async (id: string) => {
    try {
      // 调用后端API标记通知为已读（模拟发送）
      const response = await notificationAPI.markAsRead(id);
      if (response.success) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, status: 'sent', sendTime: new Date().toLocaleString() } : n
        ));
      }
    } catch (err) {
      console.error('发送通知失败:', err);
      alert('发送通知失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await notificationAPI.deleteNotification(id);
      if (response.success) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('删除通知失败:', err);
      alert('删除通知失败');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewNotification({
      ...newNotification,
      [name]: value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewNotification({
      ...newNotification,
      [name]: value
    });
  };

  const handleSaveNotification = async () => {
    if (!newNotification.title || !newNotification.content) {
      alert('请填写标题和内容');
      return;
    }

    try {
      // 如果是编辑模式，更新现有通知
      if (editingNotification) {
        // 这里应该调用更新通知的API
        // 暂时使用模拟数据
        setNotifications(notifications.map(n => 
          n.id === editingNotification.id ? { ...newNotification, id: editingNotification.id } : n
        ));
      } else {
        // 调用后端API创建通知
        const response = await notificationAPI.createNotification({
          title: newNotification.title,
          content: newNotification.content,
          type: newNotification.type,
          relatedId: null,
          relatedType: null,
        });
        
        if (response.success) {
          // 添加新创建的通知到列表
          const newNotificationData = {
            id: response.data.id,
            title: response.data.title,
            content: response.data.content,
            type: response.data.type,
            targetType: 'all',
            targetValue: '所有学生',
            priority: newNotification.priority,
            status: 'draft',
            sendTime: new Date(response.data.createdAt).toLocaleString(),
            createdAt: new Date(response.data.createdAt).toLocaleString(),
            sender: '当前用户', // 这里需要根据实际用户信息调整
            readCount: 0,
            totalCount: 1,
          };
          setNotifications([newNotificationData, ...notifications]);
        }
      }
      
      // 重置状态
      setNewNotification({
        title: '',
        content: '',
        type: 'general',
        target: 'all',
        priority: 'medium',
        schedule: ''
      });
      setEditingNotification(null);
      setOpenDialog(false);
    } catch (error) {
      console.error('保存通知失败:', error);
      alert('保存通知失败');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'primary';
      case 'assignment': return 'warning';
      case 'exam': return 'error';
      case 'general': return 'default';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'course': return '课程通知';
      case 'assignment': return '作业通知';
      case 'exam': return '考试通知';
      case 'general': return '一般通知';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success';
      case 'scheduled': return 'info';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return '已发送';
      case 'scheduled': return '已排程';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">通知管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          新建通知
        </Button>
      </Box>

      {/* 通知列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>通知标题</TableCell>
              <TableCell>通知类型</TableCell>
              <TableCell>发送对象</TableCell>
              <TableCell>优先级</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>发送时间</TableCell>
              <TableCell>阅读情况</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {notification.content.substring(0, 50)}...
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getTypeLabel(notification.type)}
                    color={getTypeColor(notification.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {notification.targetType === 'all' ? '全体学生' : 
                   notification.targetType === 'course' ? `${notification.targetValue}课程` :
                   notification.targetType === 'class' ? `${notification.targetValue}班级` :
                   notification.targetValue}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getPriorityLabel(notification.priority)}
                    color={getPriorityColor(notification.priority) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(notification.status)}
                    color={getStatusColor(notification.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {notification.sendTime}
                </TableCell>
                <TableCell>
                  {notification.readCount}/{notification.totalCount}
                  <LinearProgress
                    variant="determinate"
                    value={(notification.readCount / notification.totalCount) * 100}
                    sx={{ mt: 1, height: 4 }}
                  />
                </TableCell>
                <TableCell>
                  {notification.status === 'draft' && (
                    <Button
                      size="small"
                      startIcon={<Send />}
                      onClick={() => handleSend(notification.id)}
                    >
                      发送
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(notification)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(notification.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 创建/编辑通知对话框 */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNotification ? '编辑通知' : '新建通知'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="通知标题"
              variant="outlined"
              name="title"
              value={newNotification.title}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="通知内容"
              variant="outlined"
              multiline
              rows={4}
              name="content"
              value={newNotification.content}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>通知类型</InputLabel>
              <Select 
                name="type"
                value={newNotification.type}
                onChange={handleSelectChange}
              >
                <MenuItem value="course">课程通知</MenuItem>
                <MenuItem value="assignment">作业通知</MenuItem>
                <MenuItem value="exam">考试通知</MenuItem>
                <MenuItem value="general">一般通知</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>发送对象类型</InputLabel>
              <Select 
                name="target"
                value={newNotification.target}
                onChange={handleSelectChange}
              >
                <MenuItem value="all">全体学生</MenuItem>
                <MenuItem value="course">指定课程</MenuItem>
                <MenuItem value="class">指定班级</MenuItem>
                <MenuItem value="individual">指定个人</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>优先级</InputLabel>
              <Select 
                name="priority"
                value={newNotification.priority}
                onChange={handleSelectChange}
              >
                <MenuItem value="low">低</MenuItem>
                <MenuItem value="medium">中</MenuItem>
                <MenuItem value="high">高</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="排程发送时间"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSaveNotification} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManagement;