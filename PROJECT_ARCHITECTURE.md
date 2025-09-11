# AI融合教学平台项目架构文档

## 1. 项目概述

AI融合教学平台是一个现代化的在线教育系统，集成了人工智能技术，为教师和学生提供智能化的教学和学习体验。该平台支持课程管理、在线学习、作业布置与批改、知识点图谱、AI辅助教学等功能。

## 2. 技术架构

### 2.1 整体架构

项目采用前后端分离的架构模式，前端使用React + TypeScript构建单页应用，后端使用Node.js + Express提供RESTful API服务，数据库采用SQLite并通过Prisma ORM进行数据访问。

```
┌─────────────────┐    HTTP     ┌──────────────────┐    Database    ┌──────────────┐
│   Frontend      │◄───────────►│    Backend       │◄──────────────►│   Database   │
│  (React/TS)     │             │ (Node.js/Express)│               │   (SQLite)   │
└─────────────────┘             └──────────────────┘               └──────────────┘
```

### 2.2 前端架构

#### 2.2.1 技术栈
- React 18 (TypeScript)
- React Router v6 用于路由管理
- Material-UI (MUI) 用于UI组件
- Axios 用于HTTP请求
- Recharts 用于数据可视化

#### 2.2.2 目录结构
```
ai-teaching-platform/
├── public/                 # 静态资源文件
├── src/
│   ├── contexts/           # React Context状态管理
│   ├── data/               # 静态数据
│   ├── layouts/            # 页面布局组件
│   ├── mocks/              # Mock数据服务
│   ├── pages/              # 页面组件
│   │   ├── admin/          # 管理员功能页面
│   │   ├── ai/             # AI功能页面
│   │   ├── student/        # 学生功能页面
│   │   └── teacher/        # 教师功能页面
│   ├── services/           # API服务封装
│   ├── types/              # TypeScript类型定义
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 应用根组件
│   └── main.tsx            # 应用入口
└── package.json            # 项目依赖配置
```

#### 2.2.3 核心功能模块

1. **认证模块**
   - 用户登录/注册
   - JWT Token认证
   - 权限控制

2. **路由管理**
   - 基于角色的路由访问控制
   - 教师、学生、管理员独立路由

3. **用户界面**
   - 响应式设计
   - 不同角色的专用仪表板
   - Material-UI组件库

### 2.3 后端架构

#### 2.3.1 技术栈
- Node.js + Express.js
- TypeScript
- Prisma ORM
- SQLite数据库
- JWT用于身份验证
- Helmet用于安全头设置
- CORS用于跨域资源共享

#### 2.3.2 目录结构
```
backend/
├── prisma/                 # Prisma配置和迁移文件
├── src/
│   ├── config/             # 配置文件
│   ├── middleware/         # Express中间件
│   ├── routes/             # 路由控制器
│   ├── scripts/            # 脚本文件
│   ├── utils/              # 工具函数
│   └── server.ts           # 应用入口
├── package.json            # 项目依赖配置
└── tsconfig.json           # TypeScript配置
```

#### 2.3.3 核心功能模块

1. **认证与授权**
   - JWT Token生成与验证
   - 基于角色的访问控制(RBAC)
   - 用户权限管理

2. **API服务**
   - RESTful API设计
   - 数据验证
   - 错误处理机制

3. **数据模型**
   - 用户管理(User)
   - 课程管理(Course)
   - 章节管理(Chapter)
   - 知识点管理(KnowledgePoint)
   - 选课管理(Enrollment)
   - 课件管理(Courseware)
   - 学习资料(Material)
   - 作业管理(Assignment)
   - 问题题库(Question)
   - 提交记录(Submission)
   - 通知管理(Notification)
   - 学习记录(LearningRecord)

## 3. 前后端对接

### 3.1 API通信机制

#### 3.1.1 基础配置
- 前端通过[Axios](file:///C:/Users/wr/Desktop/code/AI_teaching_platform/ai-teaching-platform/node_modules/.pnpm/axios@1.7.9/node_modules/axios/index.d.ts#L327-L327)库与后端进行HTTP通信
- 默认后端地址: `http://localhost:3001/api`
- 支持通过环境变量`VITE_API_BASE_URL`配置后端地址

#### 3.1.2 请求/响应拦截器
- 请求拦截器自动添加JWT Token到Authorization头
- 响应拦截器处理401错误并自动跳转到登录页

#### 3.1.3 API组织结构
- 认证API (`/api/auth`)
- 用户API (`/api/users`)
- 课程API (`/api/courses`)
- 章节API (`/api/chapters`)
- 作业API (`/api/assignments`)
- 题库API (`/api/questions`)
- 知识点API (`/api/knowledge-points`)
- 课件API (`/api/coursewares`)
- 资料API (`/api/materials`)
- 提交API (`/api/submissions`)
- 通知API (`/api/notifications`)
- 学习记录API (`/api/learning-records`)
- 上传API (`/api/upload`)

### 3.2 认证与授权对接

#### 3.2.1 登录流程
1. 前端调用`authAPI.login`发送用户名和密码
2. 后端验证用户凭据并生成JWT Token
3. 前端接收Token并存储在localStorage中
4. 后续请求自动携带Token

#### 3.2.2 权限控制
- 前端根据用户角色显示不同界面和功能
- 后端通过中间件验证用户角色权限
- RBAC模型: ADMIN > TEACHER > STUDENT

### 3.3 文件上传对接

#### 3.3.1 上传流程
1. 前端通过`/api/upload`接口上传文件
2. 后端接收文件并保存到[uploads](file:///C:/Users/wr/Desktop/code/AI_teaching_platform/backend/uploads)目录
3. 返回文件访问URL供后续使用

#### 3.3.2 文件访问
- 上传的文件通过`/uploads`路径直接访问
- 支持多种文件类型(PDF, PPT, 视频等)

## 4. 数据库设计

### 4.1 主要数据实体

1. **用户(User)**
   - 教师、学生、管理员角色
   - 个人信息管理

2. **课程(Course)**
   - 课程基本信息
   - 教师关联
   - 分类和学院信息

3. **章节(Chapter)**
   - 课程章节结构
   - 章节顺序管理

4. **知识点(KnowledgePoint)**
   - 知识点内容
   - 难度和重要性等级
   - 章节关联

5. **课件(Courseware)**
   - 课件类型(PDF, PPT, 视频等)
   - 章节或知识点关联

6. **学习资料(Material)**
   - 补充学习材料
   - 课程关联

7. **作业(Assignment)**
   - 作业信息
   - 截止日期
   - 课程关联

8. **问题(Question)**
   - 题库管理
   - 题目类型
   - 知识点关联

9. **提交(Submission)**
   - 作业提交记录
   - 学生关联

10. **通知(Notification)**
    - 系统通知
    - 课程通知
    - 作业通知
    - 考试通知
    - 自定义通知
    - 支持关联实体ID和类型（relatedId, relatedType）

11. **学习记录(LearningRecord)**
    - 学习进度跟踪
    - 学生学习行为记录

12. **选课(Enrollment)**
    - 学生选课关系
    - 学习进度和成绩管理
    - 选课状态跟踪（PENDING, APPROVED等）

11. **学习记录(LearningRecord)**
    - 学习进度跟踪
    - 学生学习行为记录

### 4.2 数据关系图

```
User 1───┐
         ├── Many Course (教师教授多门课程)
Course 1─┘

Course 1───┐
           ├── Many Chapter (课程包含多个章节)
Chapter 1─┘

Chapter 1───┐
            ├── Many KnowledgePoint (章节包含多个知识点)
KnowledgePoint 1─┘

Chapter 1───┐
            ├── Many Courseware (章节关联多个课件)
Courseware 1─┘

Course 1───┐
           ├── Many Material (课程包含多个学习资料)
Material 1─┘

Course 1───┐
           ├── Many Assignment (课程包含多个作业)
Assignment 1─┘

KnowledgePoint 1───┐
                   ├── Many Question (知识点关联多个问题)
Question 1─┘

User(Student) 1───┐
                  ├── Many Submission (学生提交多个作业)
Submission 1─┘

Course 1───┐
           ├── Many Notification (课程包含多个通知)
Notification 1─┘

User(Student) 1───┐
                  ├── Many LearningRecord (学生有多条学习记录)
LearningRecord 1─┘

User(Student) 1───┐
                  ├── Many Enrollment (学生选多门课程)
Enrollment 1─────┘

Course 1─────────┐
                 ├── Many Enrollment (课程有多个学生)
Enrollment 1────┘
```

## 5. 功能模块详解

### 5.1 测试模块

#### 5.1.1 测试页面功能
- 提供教师和学生账号的快速测试登录
- 支持测试登录、登出功能
- 显示当前用户状态信息
- 提供跳转到对应角色页面的快捷入口

#### 5.1.2 测试账号
- 教师账号：teacher1@example.com / password123
- 学生账号：student1@example.com / password123  
- 管理员账号：admin@example.com / admin123

### 5.2 用户管理模块

#### 5.1.1 角色定义
- **管理员**: 系统管理，用户管理，课程审核
- **教师**: 课程创建，内容管理，作业布置，学生管理
- **学生**: 课程学习，作业提交，进度跟踪

#### 5.1.2 功能特性
- 用户注册与登录
- 密码加密存储
- JWT Token认证
- 权限控制访问

### 5.3 课程管理模块

#### 5.2.1 课程结构
- 课程基本信息(标题、描述、分类等)
- 章节组织结构
- 知识点细化管理
- 课件和学习资料关联

#### 5.2.2 功能特性
- 课程创建与编辑
- 章节管理
- 知识点管理
- 课件上传与管理
- 学习资料管理

### 5.4 学习模块

#### 5.3.1 学习功能
- 课程浏览与选择
- 章节学习
- 课件查看
- 学习进度跟踪

#### 5.3.2 功能特性
- 在线学习
- 学习记录保存
- 进度可视化
- 学习路径推荐

### 5.5 作业与评估模块

#### 5.4.1 作业功能
- 作业创建与发布
- 作业提交
- 作业批改
- 成绩管理
- **在线作业功能**：支持学生在线作答各类题型并提交答案

#### 5.4.2 功能特性
- 作业模板
- 截止日期管理
- 提交状态跟踪
- 成绩统计分析
- **多种题型支持**：
  - 单选题 (SINGLE_CHOICE)
  - 多选题 (MULTIPLE_CHOICE)
  - 判断题 (TRUE_FALSE)
  - 简答题 (SHORT_ANSWER)
  - 论述题 (ESSAY)
- **在线作答界面**：为不同题型提供针对性的交互界面
- **答案自动保存**：用户作答数据实时保存
- **提交状态显示**：显示作业的待完成、已提交、已评分状态

#### 5.4.3 数据提交流程
- **前端提交**：通过FormData格式提交JSON序列化的答案数据
- **后端处理**：解析JSON答案，验证作业和题目有效性，计算得分
- **数据存储**：创建提交记录和答案记录，保存到数据库
- **结果反馈**：返回提交成功状态和得分信息

#### 5.4.4 技术实现要点
- 前端使用React + TypeScript + Material-UI构建响应式作答界面
- 后端使用Express + Prisma + SQLite处理数据存储和业务逻辑
- 通过JSON序列化答案数据，支持复杂的数据结构
- 实现了防重复提交机制，确保学生只能提交一次作业

### 5.6 AI功能模块

#### 5.6.1 AI辅助功能
- AI课件助手
- 智能内容生成
- 自动批改作业
- 学习行为分析
- 预警系统

#### 5.6.2 AI课件助手
- 基于AI技术快速生成教学课件
- 支持多种内容类型（PPT课件、讲义笔记、练习题、教学计划）
- 可配置学科、年级、主题、难度等级
- 支持生成内容下载和预览
- 提供快捷操作（上传模板、历史课件、AI优化建议、模板库）

#### 5.6.3 技术实现要点
- 通过URL路径参数courseId动态获取课程ID
- 使用React Router v6实现资源管理页面路由
- 通过useEffect监听路由参数变化，确保页面内容正确更新
- 资源管理入口位于教师端"我的课程"页面，通过"资源管理"按钮进入资源操作对话框

#### 5.6.4 教师仪表板最近活动展示
- 展示教师最近发布的通知、教学资源（课件和资料）、课程操作记录
- 通过后端API聚合各类活动数据，按时间倒序排列
- 前端定期请求更新活动数据，确保信息实时性
- 支持显示至少10条最近活动记录
- 活动类型包括：
  - 通知发布（notification）
  - 课件上传（courseware）
  - 资料上传（material）
  - 课程创建/更新（course）

## 6. 安全设计

### 6.1 认证与授权
- JWT Token认证机制
- 基于角色的访问控制
- 密码加密存储(bcrypt)
- 请求频率限制

### 6.2 数据安全
- SQL注入防护(Prisma ORM)
- XSS防护(Helmet中间件)
- CORS策略配置
- 输入数据验证

### 6.3 传输安全
- HTTPS支持
- 敏感信息不记录日志
- API访问控制

## 7. 部署架构

### 7.1 开发环境
- 前端: Vite开发服务器
- 后端: Node.js + Express
- 数据库: SQLite

### 7.2 生产环境建议
- 前端: Nginx静态文件服务
- 后端: Node.js集群部署
- 数据库: PostgreSQL或MySQL
- 反向代理: Nginx
- 监控: PM2进程管理

## 8. 性能优化

### 8.1 前端优化
- 代码分割与懒加载
- 组件缓存
- HTTP请求缓存
- 图片优化

### 8.2 后端优化
- 数据库索引优化
- API响应缓存
- 查询优化
- 连接池管理

## 9. 扩展性设计

### 9.1 微服务扩展
- 可将各功能模块拆分为独立服务
- 用户服务、课程服务、AI服务等

### 9.2 数据库扩展
- 支持主从复制
- 分库分表策略
- 读写分离

### 9.3 AI服务扩展
- 独立AI服务模块
- 支持多种AI模型集成
- 异步任务处理