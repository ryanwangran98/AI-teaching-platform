import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Search,
  Person,
  School,
  AdminPanelSettings,
  Block,
  CheckCircle,
} from '@mui/icons-material';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  department?: string;
  major?: string;
  enrollmentYear?: string;
  coursesCount: number;
  lastLogin: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'student001',
      email: 'student001@university.edu',
      fullName: '张三',
      role: 'student',
      status: 'active',
      phone: '13800138001',
      department: '数学学院',
      major: '数学与应用数学',
      enrollmentYear: '2022',
      coursesCount: 8,
      lastLogin: '2024-01-15 14:30',
      createdAt: '2024-01-01 10:00',
    },
    {
      id: '2',
      username: 'teacher001',
      email: 'teacher001@university.edu',
      fullName: '李教授',
      role: 'teacher',
      status: 'active',
      phone: '13800138002',
      department: '数学学院',
      coursesCount: 3,
      lastLogin: '2024-01-15 09:15',
      createdAt: '2023-09-01 08:00',
    },
    {
      id: '3',
      username: 'admin001',
      email: 'admin001@university.edu',
      fullName: '王管理员',
      role: 'admin',
      status: 'active',
      phone: '13800138003',
      department: '教务处',
      coursesCount: 0,
      lastLogin: '2024-01-15 08:00',
      createdAt: '2023-08-01 08:00',
    },
    {
      id: '4',
      username: 'student002',
      email: 'student002@university.edu',
      fullName: '李四',
      role: 'student',
      status: 'inactive',
      phone: '13800138004',
      department: '计算机学院',
      major: '计算机科学与技术',
      enrollmentYear: '2023',
      coursesCount: 5,
      lastLogin: '2024-01-10 16:45',
      createdAt: '2024-01-05 14:00',
    },
  ]);

  const [tabValue, setTabValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
  };

//  const handleStatusChange = (id: string, status: User['status']) => {
//    setUsers(users.map(user => 
//      user.id === id ? { ...user, status } : user
//    ));
//  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <School />;
      case 'teacher': return <Person />;
      case 'admin': return <AdminPanelSettings />;
      default: return <Person />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return '学生';
      case 'teacher': return '教师';
      case 'admin': return '管理员';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'primary';
      case 'teacher': return 'success';
      case 'admin': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'inactive': return '未激活';
      case 'suspended': return '已停用';
      default: return status;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUsersByRole = (role: string) => {
    return filteredUsers.filter(user => user.role === role);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">用户管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          新建用户
        </Button>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>总用户数</Typography>
              </Box>
              <Typography variant="h4">{users.length}</Typography>
              <Typography variant="body2" color="textSecondary">
                学生: {users.filter(u => u.role === 'student').length} |
                教师: {users.filter(u => u.role === 'teacher').length} |
                管理员: {users.filter(u => u.role === 'admin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>活跃用户</Typography>
              </Box>
              <Typography variant="h4">{users.filter(u => u.status === 'active').length}</Typography>
              <Typography variant="body2" color="textSecondary">
                今日新增: 3人
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Block color="error" />
                <Typography variant="h6" sx={{ ml: 1 }}>停用用户</Typography>
              </Box>
              <Typography variant="h4">{users.filter(u => u.status === 'suspended').length}</Typography>
              <Typography variant="body2" color="textSecondary">
                本月停用: 1人
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>课程总数</Typography>
              </Box>
              <Typography variant="h4">
                {users.reduce((sum, user) => sum + user.coursesCount, 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                平均每人 {Math.round(users.reduce((sum, user) => sum + user.coursesCount, 0) / users.length)} 门
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 搜索和筛选 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索用户名、邮箱或姓名"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>角色</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="角色"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="student">学生</MenuItem>
            <MenuItem value="teacher">教师</MenuItem>
            <MenuItem value="admin">管理员</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>状态</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="状态"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="active">活跃</MenuItem>
            <MenuItem value="inactive">未激活</MenuItem>
            <MenuItem value="suspended">已停用</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="全部用户" />
          <Tab label="学生" />
          <Tab label="教师" />
          <Tab label="管理员" />
        </Tabs>
      </Box>

      {/* 用户列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用户</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>联系方式</TableCell>
              <TableCell>部门/专业</TableCell>
              <TableCell>课程数</TableCell>
              <TableCell>最后登录</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? filteredUsers : 
              tabValue === 1 ? getUsersByRole('student') :
              tabValue === 2 ? getUsersByRole('teacher') :
              getUsersByRole('admin')).map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {user.fullName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {user.fullName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.username}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(user.status)}
                    color={getStatusColor(user.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{user.email}</Typography>
                  {user.phone && (
                    <Typography variant="body2" color="textSecondary">
                      {user.phone}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.department}
                  </Typography>
                  {user.role === 'student' && user.major && (
                    <Typography variant="body2" color="textSecondary">
                      {user.major} - {user.enrollmentYear}级
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{user.coursesCount}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{user.lastLogin}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 创建/编辑用户对话框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? '编辑用户' : '新建用户'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="用户名"
                  variant="outlined"
                  defaultValue={selectedUser?.username || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="邮箱"
                  variant="outlined"
                  type="email"
                  defaultValue={selectedUser?.email || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="姓名"
                  variant="outlined"
                  defaultValue={selectedUser?.fullName || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>角色</InputLabel>
                  <Select
                    defaultValue={selectedUser?.role || 'student'}
                  >
                    <MenuItem value="student">学生</MenuItem>
                    <MenuItem value="teacher">教师</MenuItem>
                    <MenuItem value="admin">管理员</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="手机号"
                  variant="outlined"
                  defaultValue={selectedUser?.phone || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="部门/学院"
                  variant="outlined"
                  defaultValue={selectedUser?.department || ''}
                />
              </Grid>
              {selectedUser?.role === 'student' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="专业"
                      variant="outlined"
                      defaultValue={selectedUser?.major || ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="入学年份"
                      variant="outlined"
                      defaultValue={selectedUser?.enrollmentYear || ''}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button variant="contained">
            {selectedUser ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;