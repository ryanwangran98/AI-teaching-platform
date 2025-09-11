# 前端路由与页面交互文档

## 1. 前端架构概述

AI融合教学平台前端采用React+TypeScript+Material-UI架构，使用React Router实现页面路由管理。本文档详细描述了前端路由结构、页面布局、主要组件及其交互流程。

### 1.1 技术栈
- React 19 + TypeScript 5.8
- React Router v7
- Material-UI 7.x
- Axios 1.11
- Recharts 3.x

## 2. 路由结构

### 2.1 路由配置
前端路由配置位于`src/router/index.tsx`文件中，采用React Router 6的声明式路由方式。

### 2.2 路由分类

#### 2.2.1 公共路由
无需登录即可访问的页面：
- 登录页
- 注册页
- 忘记密码页
- 测试页面

#### 2.2.2 私有路由
需要登录才能访问的页面，根据用户角色进行权限控制：
- 学生端路由
- 教师端路由
- 管理员端路由

## 3. 详细路由列表

### 3.1 公共路由

| 路由路径 | 页面名称 | 组件文件 | 说明 |
|---------|---------|---------|------|
| `/login` | 登录页 | `src/pages/Login.tsx` | 用户登录入口 |
| `/register` | 注册页 | `src/pages/Register.tsx` | 新用户注册入口 |
| `/test` | 测试页 | `src/pages/TestPage.tsx` | 快速登录测试 |
| `/404` | 页面不存在 | `src/pages/404.tsx` | 页面未找到提示 |

### 3.2 学生端路由

| 路由路径 | 页面名称 | 组件文件 | 说明 |
|---------|---------|---------|------|
| `/student` | 学生仪表盘 | `src/pages/student/StudentDashboard.tsx` | 学生个人中心和学习概览 |
| `/student/courses` | 我的课程 | `src/pages/student/MyCourses.tsx` | 学生已选课程列表 |
| `/student/courses/explore` | 浏览课程 | `src/pages/student/CourseBrowser.tsx` | 浏览并加入可学习的课程 |
| `/student/course/:courseId` | 课程详情 | `src/pages/student/CourseDetail.tsx` | 课程详细内容和学习进度 |
| `/student/course/:courseId/assignment/:assignmentId` | 做作业 | `src/pages/student/AssignmentDetail.tsx` | 完成并提交作业的页面 |
| `/student/assignments` | 我的作业 | `src/pages/student/MyAssignments.tsx` | 作业列表和完成情况 |
| `/student/results` | 学习成绩 | `src/pages/student/LearningResults.tsx` | 作业成绩和学习成果展示 |
| `/student/learning-records` | 学习记录 | `src/pages/student/LearningRecords.tsx` | 学习进度和历史记录 |
| `/student/notifications` | 我的通知 | `src/pages/student/NotificationList.tsx` | 系统通知和消息中心 |
| `/student/profile` | 个人资料 | `src/pages/student/Profile.tsx` | 个人信息管理 |

### 3.3 教师端路由

| 路由路径 | 页面名称 | 组件文件 | 说明 |
|---------|---------|---------|------|
| `/teacher` | 教师仪表盘 | `src/pages/teacher/TeacherDashboard.tsx` | 教师工作台和数据分析 |
| `/teacher/courses` | 我的课程 | `src/pages/teacher/TeacherCourseManagement.tsx` | 教师创建和管理的课程列表 |
| `/teacher/courses/new` | 创建课程 | `src/pages/teacher/CreateCourse.tsx` | 新建课程表单 |
| `/teacher/courses/:courseId` | 课程资源管理 | `src/pages/teacher/ResourceManagement.tsx` | 课程资源统一管理入口 |
| `/teacher/courses/:courseId/courseware` | 课件管理 | `src/pages/teacher/CoursewareManagement.tsx` | 课件上传和管理 |
| `/teacher/courses/:courseId/materials` | 资料管理 | `src/pages/teacher/MaterialManagement.tsx` | 学习资料管理 |
| `/teacher/courses/:courseId/chapters` | 章节管理 | `src/pages/teacher/ChapterManagement.tsx` | 课程章节和知识点管理 |
| `/teacher/courses/:courseId/knowledge-points` | 知识点管理 | `src/pages/teacher/KnowledgePointManagement.tsx` | 知识点维护 |
| `/teacher/courses/:courseId/questions` | 题库管理 | `src/pages/teacher/QuestionBankManagement.tsx` | 题目列表和题库维护 |
| `/teacher/courses/:courseId/assignments` | 作业管理 | `src/pages/teacher/AssignmentManagement.tsx` | 作业列表和发布情况 |
| `/teacher/assignments` | 全部作业 | `src/pages/teacher/AssignmentManagement.tsx` | 所有课程作业管理 |
| `/teacher/notifications` | 我的通知 | `src/pages/teacher/NotificationManagement.tsx` | 系统通知和消息中心 |
| `/teacher/profile` | 个人资料 | `src/pages/teacher/Profile.tsx` | 个人信息管理 |

### 3.4 管理员端路由

| 路由路径 | 页面名称 | 组件文件 | 说明 |
|---------|---------|---------|------|
| `/admin` | 管理仪表盘 | `src/pages/admin/AdminDashboard.tsx` | 系统概览和数据统计 |
| `/admin/users` | 用户管理 | `src/pages/admin/UserManagement.tsx` | 系统用户列表和权限管理 |
| `/admin/courses` | 课程管理 | `src/pages/admin/CourseManagement.tsx` | 所有课程的管理和审核 |
| `/admin/statistics` | 系统统计 | `src/pages/admin/SystemStatistics.tsx` | 系统使用数据统计和分析 |
| `/admin/settings` | 系统设置 | `src/pages/admin/SystemSettings.tsx` | 系统全局配置和参数设置 |

## 4. 页面布局结构

### 4.1 整体布局
平台采用统一的布局模式，主要包含以下部分：

1. **顶部导航栏**：包含logo、用户信息、通知、设置等
2. **侧边栏**：根据用户角色显示不同的功能菜单
3. **主内容区**：根据当前路由显示相应的页面内容
4. **页脚**：版权信息和辅助链接

### 4.2 布局组件
- 布局组件：`src/layouts/Layout.tsx`
- 学生端布局：`src/layouts/StudentLayout.tsx`
- 教师端布局：`src/layouts/TeacherLayout.tsx`
- 管理员端布局：`src/layouts/AdminLayout.tsx`

## 5. 主要页面交互流程

### 5.1 用户认证流程
1. 用户访问平台首页或其他受限页面
2. 系统检查用户登录状态（Token是否有效）
3. 未登录状态下，重定向到登录页面
4. 用户输入凭证，提交登录请求
5. 后端验证凭证，返回JWT Token
6. 前端保存Token并跳转到对应角色的仪表盘
7. 后续请求通过Authorization头携带Token

### 5.2 课程学习流程（学生）
1. 学生登录后进入学生仪表盘
2. 点击左侧菜单"我的课程"，进入课程列表页面
3. 选择一门课程，点击进入课程详情页面
4. 在课程详情页面查看课程介绍、章节列表等信息
5. 点击具体章节，进入章节学习页面，查看课件、学习资料
6. 完成章节学习后，系统自动记录学习进度

### 5.3 作业完成与提交流程（学生）
1. 学生在学生仪表盘或课程详情页面查看待完成作业
2. 点击"做作业"按钮，进入作业详情页面
3. 仔细阅读题目要求，输入答案或上传相关文件
4. 完成所有题目后，点击"提交"按钮
5. 系统进行提交验证，检查是否重复提交
6. 提交成功后，显示提交成功提示和预估得分（如有）
7. 学生可在"我的作业"页面查看提交状态和教师评分

### 5.4 课程创建与管理流程（教师）
1. 教师登录后进入教师仪表盘
2. 点击左侧菜单"我的课程"，进入课程管理页面
3. 点击"创建课程"按钮，填写课程基本信息
4. 提交创建请求，系统创建新课程并返回课程详情
5. 在课程详情页面，教师可以管理课程信息、添加章节和知识点
6. 点击"发布课程"按钮，课程变为可访问状态
7. 教师可以在课程管理页面查看学生列表、学习进度等

### 5.5 作业发布与批改流程（教师）
1. 教师在教师仪表盘或课程管理页面进入作业管理
2. 点击"创建作业"按钮，填写作业基本信息
3. 从题库中选择题目或创建新题目添加到作业中
4. 设置作业截止日期和总分，点击"发布"按钮
5. 学生提交作业后，教师在作业详情页面查看提交列表
6. 点击单个提交记录，进入作业批改页面
7. 对学生答案进行评分并添加反馈
8. 完成评分后，系统自动更新学生成绩并发送通知

### 5.6 题目创建与管理流程（教师）
1. 教师登录后进入教师仪表盘
2. 点击左侧菜单"题库管理"，进入题库页面
3. 点击"创建题目"按钮，选择题目类型
4. 填写题目内容、选项、正确答案等信息
5. 点击"保存"按钮，题目被添加到题库中
6. 教师可以在题库页面搜索、编辑、删除题目

## 6. 核心组件交互

### 6.1 导航组件
- **顶部导航栏**：显示当前页面路径、用户信息、通知图标
- **侧边栏**：根据用户角色动态加载菜单项，支持折叠/展开
- **面包屑导航**：显示当前页面的层级路径

### 6.2 表单组件
- **登录表单**：包含邮箱、密码输入框和登录按钮
- **注册表单**：包含邮箱、密码、姓名、角色等输入项
- **课程表单**：创建/编辑课程的详细信息表单
- **作业表单**：创建/编辑作业的详细信息和题目选择表单
- **题目表单**：创建/编辑各种类型题目的表单
- **个人资料表单**：用户个人信息编辑表单

### 6.3 数据展示组件
- **课程列表**：以卡片或表格形式展示课程信息
- **作业列表**：展示作业名称、截止日期、状态等信息
- **成绩列表**：展示学生姓名、作业名称、得分等信息
- **数据统计**：使用图表展示学习进度、成绩分布等统计数据
- **通知列表**：展示系统通知和消息

### 6.4 交互组件
- **模态框**：用于创建/编辑表单、确认操作等
- **抽屉**：用于展示详情信息、辅助操作等
- **对话框**：用于删除确认、重要提示等
- **上传组件**：支持文件上传预览、进度显示
- **确认对话框**：用于确认重要操作，避免误操作

## 7. 状态管理

前端采用React Context和自定义Hook进行状态管理，主要管理以下状态：

- 用户认证状态（登录信息、Token等）
- 全局设置状态（主题、语言等）
- 页面加载状态（loading动画、骨架屏等）
- 表单数据状态（输入内容、验证状态等）
- 数据列表状态（分页、筛选、排序等）

## 8. API请求处理

### 8.1 API请求封装
前端通过`src/services/api.ts`统一封装API请求，主要功能包括：

- Axios实例配置（基础URL、超时设置等）
- 请求拦截器（Token携带、请求加载状态等）
- 响应拦截器（错误处理、Token过期处理等）
- API方法统一封装（认证、课程、作业等模块）

### 8.2 API调用示例
```typescript
import { login, getCourses } from 'src/services/api';

// 登录请求示例
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await login({ email, password });
    // 处理登录成功逻辑
  } catch (error) {
    // 处理登录失败逻辑
  }
};

// 获取课程列表示例
const fetchCourses = async () => {
  try {
    const response = await getCourses({ page: 1, limit: 10 });
    // 处理获取课程成功逻辑
  } catch (error) {
    // 处理获取课程失败逻辑
  }
};
```

## 9. 错误处理机制

### 9.1 全局错误处理
- 统一的错误拦截器处理网络请求错误
- 全局错误提示组件显示错误信息
- 401错误（Token失效）自动跳转到登录页面
- 403错误（权限不足）显示无权限提示

### 9.2 表单验证错误
- 使用Ant Design表单组件的内置验证功能
- 实时验证用户输入，提供友好的错误提示
- 提交前进行全量验证，确保数据完整性

## 10. 前端性能优化

### 10.1 路由懒加载
- 使用React.lazy和Suspense实现路由组件的懒加载
- 按需加载各个页面组件，减少初始加载时间

### 10.2 组件复用
- 封装可复用的UI组件，提高代码复用率
- 合理划分业务组件和展示组件

### 10.3 数据缓存
- 对不经常变动的数据进行本地缓存
- 使用React.memo避免不必要的组件重渲染

### 10.4 图片优化
- 使用适当的图片格式和大小
- 实现图片懒加载功能

## 11. 响应式设计

前端支持响应式布局，适配不同屏幕尺寸：

- 大屏设备（≥1200px）：完整显示侧边栏和多列内容
- 中屏设备（992px-1199px）：适当调整布局，保证内容清晰显示
- 小屏设备（768px-991px）：优化布局，确保关键功能可用
- 平板设备（576px-767px）：简化布局，提供核心功能
- 移动设备（<576px）：使用抽屉菜单，单列显示内容

## 12. 无障碍设计

前端遵循Web无障碍标准，确保所有用户都能便捷使用平台：

- 合理的HTML语义化标签
- 适当的颜色对比度
- 键盘导航支持
- ARIA属性支持
- 屏幕阅读器兼容性优化

## 13. 浏览器兼容性

平台支持以下主流浏览器：

- Google Chrome (最新2个版本)
- Mozilla Firefox (最新2个版本)
- Microsoft Edge (最新2个版本)
- Apple Safari (最新2个版本)