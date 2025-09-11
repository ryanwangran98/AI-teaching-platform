import { http, HttpResponse } from 'msw';

// Mock数据
const mockUsers = [
  {
    id: '1',
    username: 'teacher1',
    email: 'teacher1@example.com',
    password: 'password123',
    role: 'teacher',
    realName: '张老师',
  },
  {
    id: '2',
    username: 'student1',
    email: 'student1@example.com',
    password: 'password123',
    role: 'student',
    realName: '李同学',
  },
  {
    id: '3',
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    realName: '管理员',
  }
];

const mockCourses = [
  {
    id: '1',
    title: '高等数学',
    description: '高等数学基础课程',
    subject: '数学',
    grade: '大一',
    teacherId: '1',
    teacherName: '张老师',
    studentsCount: 45,
    chaptersCount: 8,
  },
  {
    id: '2',
    title: '线性代数',
    description: '线性代数基础课程',
    subject: '数学',
    grade: '大一',
    teacherId: '1',
    teacherName: '张老师',
    studentsCount: 38,
    chaptersCount: 6,
  }
];

const mockChapters = [
  {
    id: '1',
    courseId: '1',
    title: '函数与极限',
    description: '介绍函数的概念和极限的定义',
    order: 1,
    duration: 45,
  },
  {
    id: '2',
    courseId: '1',
    title: '导数与微分',
    description: '介绍导数的概念和计算方法',
    order: 2,
    duration: 60,
  }
];

// Mock请求处理器
export const handlers = [
  // 登录接口
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = await request.json();
    
    const user = mockUsers.find(
      u => (u.username === username || u.email === username) && u.password === password
    );
    
    if (!user) {
      return HttpResponse.json(
        { message: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        realName: user.realName
      },
      token: `mock-jwt-token-${user.id}`
    });
  }),
  
  // 注册接口
  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json();
    
    // 检查用户名或邮箱是否已存在
    const existingUser = mockUsers.find(
      u => u.username === userData.username || u.email === userData.email
    );
    
    if (existingUser) {
      return HttpResponse.json(
        { message: '用户名或邮箱已存在' },
        { status: 400 }
      );
    }
    
    const newUser = {
      id: `${mockUsers.length + 1}`,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'student',
      realName: userData.realName || userData.username
    };
    
    mockUsers.push(newUser);
    
    return HttpResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        realName: newUser.realName
      },
      token: `mock-jwt-token-${newUser.id}`
    });
  }),
  
  // 退出登录接口
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ message: '退出成功' });
  }),
  
  // 获取用户信息接口
  http.get('/api/auth/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userId = token.split('-').pop();
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return HttpResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      realName: user.realName
    });
  }),
  
  // 更新用户信息接口
  http.put('/api/auth/profile', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const userData = await request.json();
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userId = token.split('-').pop();
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return HttpResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
    
    return HttpResponse.json({
      id: mockUsers[userIndex].id,
      username: mockUsers[userIndex].username,
      email: mockUsers[userIndex].email,
      role: mockUsers[userIndex].role,
      realName: mockUsers[userIndex].realName
    });
  }),
  
  // 获取课程列表接口
  http.get('/api/courses', () => {
    return HttpResponse.json(mockCourses);
  }),
  
  // 获取我的课程接口
  http.get('/api/courses/my', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userId = token.split('-').pop();
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return HttpResponse.json([], { status: 200 });
    }
    
    if (user.role === 'teacher') {
      // 教师查看自己创建的课程
      return HttpResponse.json(mockCourses.filter(course => course.teacherId === userId));
    } else {
      // 学生查看所有课程
      return HttpResponse.json(mockCourses);
    }
  }),
  
  // 获取课程详情接口
  http.get('/api/courses/:id', ({ params }) => {
    const { id } = params;
    const course = mockCourses.find(c => c.id === id);
    
    if (!course) {
      return HttpResponse.json(
        { message: '课程不存在' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(course);
  }),
  
  // 获取章节列表接口
  http.get('/api/courses/:courseId/chapters', ({ params }) => {
    const { courseId } = params;
    const chapters = mockChapters.filter(chapter => chapter.courseId === courseId);
    
    return HttpResponse.json(chapters);
  }),
  
  // AI生成课件接口
  http.post('/api/ai/generate-courseware', async ({ request }) => {
    const { subject, grade, topic } = await request.json();
    
    // 模拟AI生成的内容
    const generatedContent = `
# ${topic} - ${subject} ${grade}

## 课程目标
- 掌握${topic}的基本概念
- 理解${topic}的应用场景
- 能够解决相关问题

## 课程大纲
1. 引入与背景
2. 核心概念讲解
3. 实例演示
4. 练习与巩固
5. 总结与作业

## 重点难点
- 重点：${topic}的核心原理
- 难点：实际应用中的问题分析

## 教学资源
- PPT课件：包含动画演示
- 练习题：分层设计，适合不同水平学生
- 拓展阅读：相关前沿应用
    `.trim();
    
    return HttpResponse.json({
      id: `ai-${Date.now()}`,
      content: generatedContent,
      createdAt: new Date().toISOString(),
      metadata: {
        subject,
        grade,
        topic,
        wordCount: generatedContent.split(' ').length
      }
    });
  })
];

export default handlers;