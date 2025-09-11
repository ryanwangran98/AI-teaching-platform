# AI融合教学平台项目架构文档

## 1. 项目概述

AI融合教学平台是一个现代化的AI驱动在线教育系统，深度融合人工智能技术，为教师、学生和管理员提供智能化的教学、学习和管理体验。平台围绕"AI教学智能体"、"AI备课与视频管理平台"、"智能学习支持"三大核心能力构建，实现教学全流程的智能化升级。

### 1.1 建设目标
- **AI教学智能体**: 构建具备教学认知、决策和执行能力的AI智能体
- **AI备课与视频管理平台**: 实现智能化备课、视频资源管理和个性化推荐
- **智能学习支持**: 提供个性化学习路径、智能答疑和学习效果分析
- **教学全流程数字化**: 覆盖课前备课、课中教学、课后辅导全场景

### 1.2 核心价值
- **教师端**: AI辅助备课、智能学情分析、个性化教学建议
- **学生端**: AI学习助手、智能答疑、个性化学习路径
- **管理端**: 教学质量监控、数据驱动决策、资源优化配置

## 2. 技术架构

### 2.1 整体架构

采用云原生微服务架构，支持高并发、高可用和弹性扩展，集成AI服务、大数据分析和实时通信能力。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端层 (Frontend Layer)                          │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│  管理端(Admin)   │  教师端(Teacher)│  学生端(Student)│    小程序端(MiniApp)    │
│   Web Portal    │   Web Portal    │   Web Portal    │   WeChat/Alipay        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          网关层 (Gateway Layer)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────────┐  │
│  │   API Gateway   │  │ Load Balancer   │  │    CDN + Static Assets    │  │
│  │  (Kong/Nginx)   │  │   (Nginx/HAProxy)│  │      (CloudFront)         │  │
│  └─────────────────┘  └─────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          服务层 (Service Layer)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Core       │  │     AI       │  │  Analytics   │  │  Notification  │  │
│  │  Services    │  │  Services    │  │   Services   │  │   Services     │  │
│  │  (Node.js)   │  │(Python/Go)  │  │ (Spark/Flink)│  │  (WebSocket)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          数据层 (Data Layer)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │ Elasticsearch│  │   Object       │  │
│  │  (Primary)   │  │   (Cache)    │  │   (Search)   │  │   Storage      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 架构演进阶段

#### 阶段一：基础能力建设 (当前)
- **前端**: React + TypeScript单页应用
- **后端**: Node.js + Express RESTful API
- **数据库**: SQLite + Prisma ORM
- **部署**: 单机部署，支持基本功能验证

#### 阶段二：AI能力集成
- **AI服务**: 集成Python AI服务，支持LLM调用
- **向量数据库**: 集成Pinecone/ChromaDB用于知识库
- **实时通信**: 集成WebSocket支持实时AI对话
- **文件存储**: 集成云存储服务(AWS S3/阿里云OSS)

#### 阶段三：微服务化改造
- **服务拆分**: 按业务域拆分微服务
- **容器化**: Docker容器化部署
- **服务网格**: 集成Istio服务网格
- **监控告警**: 集成Prometheus + Grafana

#### 阶段四：云原生升级
- **Kubernetes**: 云原生编排
- **自动扩缩容**: 基于负载的弹性伸缩
- **多活架构**: 跨地域高可用部署
- **DevOps**: 完整的CI/CD流水线

### 2.3 前端架构 (AI增强版)

#### 2.3.1 技术栈升级
- **基础框架**: React 18 + TypeScript 5.0
- **状态管理**: Zustand (轻量级状态管理) + React Query (服务端状态)
- **路由**: React Router v6 + 路由守卫
- **UI框架**: Material-UI v5 + 自定义主题系统
- **样式方案**: Emotion + CSS Modules
- **HTTP客户端**: Axios + React Query
- **实时通信**: Socket.io-client
- **图表可视化**: Recharts + D3.js
- **AI交互**: 集成OpenAI SDK + 自定义AI组件库
- **构建工具**: Vite 5.0 + SWC

#### 2.3.2 前端架构模式
- **微前端架构**: 支持模块化开发和独立部署
- **组件驱动开发**: Storybook驱动组件开发
- **设计系统**: 基于Material Design的AI教学专用设计系统
- **无障碍访问**: WCAG 2.1 AA级别支持

#### 2.3.3 目录结构 (AI增强版)
```
ai-teaching-platform/
├── public/                     # 静态资源
├── src/
│   ├── components/              # 可复用组件
│   │   ├── ai/                  # AI专用组件
│   │   │   ├── ChatInterface/   # AI对话界面
│   │   │   ├── ContentGenerator/ # 内容生成器
│   │   │   ├── SmartRecommend/   # 智能推荐
│   │   │   └── VoiceAssistant/   # 语音助手
│   │   ├── common/              # 通用组件
│   │   ├── charts/              # 图表组件
│   │   └── forms/               # 表单组件
│   ├── contexts/                # React Context
│   ├── hooks/                   # 自定义Hooks
│   │   ├── useAI.ts            # AI功能Hook
│   │   ├── useChat.ts          # 实时对话Hook
│   │   └── useAnalytics.ts     # 数据分析Hook
│   ├── layouts/                 # 布局组件
│   ├── pages/                   # 页面组件
│   │   ├── admin/
│   │   ├── teacher/
│   │   │   ├── dashboard/        # 教师仪表板
│   │   │   ├── course-management/# 课程管理
│   │   │   ├── ai-assistant/     # AI备课助手
│   │   │   └── analytics/        # 教学分析
│   │   ├── student/
│   │   │   ├── dashboard/        # 学生仪表板
│   │   │   ├── ai-tutor/         # AI学习导师
│   │   │   └── progress/         # 学习进度
│   │   └── auth/
│   ├── services/                # API服务
│   │   ├── ai.service.ts        # AI服务
│   │   ├── chat.service.ts      # 实时通信
│   │   └── analytics.service.ts # 数据分析
│   ├── stores/                  # 状态管理
│   ├── styles/                  # 样式文件
│   ├── types/                   # TypeScript类型
│   ├── utils/                   # 工具函数
│   └── constants/               # 常量定义
├── tests/                       # 测试文件
├── .storybook/                  # Storybook配置
└── vite.config.ts               # Vite配置
```

#### 2.3.4 AI增强功能模块

1. **AI教学智能体界面**
   - **智能备课助手**: AI驱动的课程内容生成
   - **智能学情分析**: 实时学习数据可视化
   - **个性化推荐**: 基于学习行为的资源推荐
   - **语音交互**: 支持语音控制和问答

2. **AI备课与视频管理平台**
   - **智能课件生成**: 一键生成PPT、讲义、练习题
   - **视频智能处理**: 自动字幕、重点标记、摘要生成
   - **资源智能推荐**: 基于课程内容的资源匹配
   - **协作备课**: 多教师协同编辑和AI建议

3. **智能学习支持系统**
   - **AI学习导师**: 24/7在线答疑和学习指导
   - **个性化学习路径**: 基于知识图谱的学习推荐
   - **智能作业批改**: AI辅助批改和个性化反馈
   - **学习预警系统**: 基于行为分析的学习风险预警

4. **实时AI交互**
   - **WebSocket连接**: 支持实时AI对话
   - **消息队列**: 处理异步AI任务
   - **状态同步**: 实时同步AI处理状态
   - **离线支持**: 弱网环境下的智能降级

### 2.4 后端架构 (AI增强版)

#### 2.4.1 技术栈升级
- **核心框架**: Node.js 20 + Express.js + TypeScript 5.0
- **数据库**: PostgreSQL 15 (主库) + Redis 7 (缓存)
- **ORM**: Prisma 5.0 + 原生SQL优化
- **AI服务**: Python 3.11 + FastAPI + TensorFlow/PyTorch
- **消息队列**: Redis + Bull Queue
- **搜索引擎**: Elasticsearch 8.0
- **文件存储**: AWS S3 / 阿里云OSS
- **监控**: Prometheus + Grafana + Jaeger
- **容器化**: Docker + Docker Compose
- **API文档**: Swagger/OpenAPI 3.0

#### 2.4.2 微服务架构拆分
```
backend/
├── services/                    # 微服务目录
│   ├── api-gateway/            # API网关服务
│   ├── auth-service/           # 认证授权服务
│   ├── user-service/           # 用户管理服务
│   ├── course-service/         # 课程管理服务
│   ├── ai-service/             # AI核心服务
│   │   ├── teaching-agent/      # AI教学智能体
│   │   ├── content-generator/   # 内容生成服务
│   │   ├── video-processor/     # 视频处理服务
│   │   └── recommendation/      # 推荐算法服务
│   ├── analytics-service/       # 数据分析服务
│   ├── notification-service/    # 通知服务
│   └── file-service/           # 文件管理服务
├── shared/                     # 共享组件
│   ├── database/               # 数据库配置
│   ├── middleware/             # 通用中间件
│   ├── utils/                  # 工具库
│   └── types/                  # 共享类型
├── infrastructure/             # 基础设施
│   ├── docker/                 # Docker配置
│   ├── kubernetes/             # K8s配置
│   └── monitoring/             # 监控配置
└── scripts/                    # 部署脚本
```

#### 2.4.3 AI服务架构

1. **AI教学智能体服务**
   - **技术栈**: Python + FastAPI + LangChain + OpenAI GPT-4
   - **功能模块**:
     - 教学内容理解与分析
     - 个性化教学策略生成
     - 学情诊断与建议
     - 智能答疑系统
   - **部署**: 独立容器部署，支持GPU加速

2. **内容生成服务**
   - **技术栈**: Python + FastAPI + Transformers
   - **功能模块**:
     - PPT课件自动生成
     - 教学讲义智能撰写
     - 练习题自动出题
     - 教学计划智能编排
   - **集成**: 支持Markdown、PPTX、PDF格式输出

3. **视频处理服务**
   - **技术栈**: Python + OpenCV + Whisper + FFmpeg
   - **功能模块**:
     - 视频自动字幕生成
     - 关键帧提取与标记
     - 视频内容摘要
     - 视频质量优化
   - **存储**: 集成云存储CDN分发

4. **推荐算法服务**
   - **技术栈**: Python + TensorFlow + Scikit-learn
   - **算法模型**:
     - 协同过滤推荐
     - 基于内容的推荐
     - 深度学习推荐模型
     - 知识图谱推荐

#### 2.4.4 核心服务模块

1. **认证与授权服务**
   - **JWT Token管理**: 支持刷新Token机制
   - **OAuth 2.0**: 支持第三方登录
   - **RBAC权限模型**: 细粒度权限控制
   - **多因子认证**: 支持短信、邮箱验证

2. **实时通信服务**
   - **WebSocket**: 支持实时消息推送
   - **Socket.io**: 跨平台实时通信
   - **消息队列**: Redis Pub/Sub + Bull Queue
   - **在线状态**: 用户在线状态管理

3. **数据分析服务**
   - **实时分析**: Apache Kafka + Flink
   - **离线分析**: Apache Spark
   - **数据仓库**: PostgreSQL + Elasticsearch
   - **可视化**: 集成Grafana仪表盘

4. **文件管理服务**
   - **云存储**: AWS S3 / 阿里云OSS
   - **CDN分发**: CloudFront / 阿里云CDN
   - **文件处理**: 图片压缩、文档转换、视频转码
   - **权限控制**: 基于角色的文件访问控制

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

## 4. 数据库设计 (AI增强版)

### 4.1 核心数据实体扩展

#### 4.1.1 用户与用户画像
```sql
-- 用户基础信息扩展
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
  avatar_url VARCHAR(500),
  preferences JSONB, -- 用户偏好设置
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户画像表 (AI分析用)
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  learning_style VARCHAR(50), -- 视觉型、听觉型、动手型
  knowledge_level JSONB, -- 各科目知识水平
  learning_pace VARCHAR(20), -- 慢速、中速、快速
  interests TEXT[], -- 兴趣标签
  weak_areas TEXT[], -- 薄弱知识点
  strengths TEXT[], -- 优势领域
  last_analyzed TIMESTAMP,
  profile_data JSONB -- AI生成的完整画像
);
```

#### 4.1.2 AI教学智能体相关表
```sql
-- AI会话记录
CREATE TABLE ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100) UNIQUE,
  context_type VARCHAR(50), -- 'teaching', 'learning', 'qa'
  messages JSONB, -- 完整对话历史
  summary TEXT, -- AI生成的对话摘要
  sentiment VARCHAR(20), -- 情感分析结果
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI生成内容记录
CREATE TABLE ai_generated_content (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  type VARCHAR(50), -- 'ppt', 'handout', 'quiz', 'plan'
  prompt TEXT, -- 用户输入的提示
  content JSONB, -- 生成的内容
  quality_score FLOAT, -- AI评估的质量分数
  usage_count INTEGER DEFAULT 0,
  feedback JSONB, -- 用户反馈
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI教学建议
CREATE TABLE ai_teaching_suggestions (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  suggestion_type VARCHAR(50), -- 'content', 'method', 'assessment'
  suggestion_text TEXT,
  evidence_data JSONB, -- 支撑数据
  confidence_score FLOAT,
  implemented BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.3 知识图谱系统
```sql
-- 知识图谱节点
CREATE TABLE knowledge_nodes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  subject VARCHAR(50),
  grade_level VARCHAR(20),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  prerequisites INTEGER[], -- 前置知识点ID数组
  learning_objectives TEXT[],
  estimated_time INTEGER, -- 预计学习时长(分钟)
  metadata JSONB
);

-- 知识图谱关系
CREATE TABLE knowledge_relationships (
  id SERIAL PRIMARY KEY,
  from_node_id INTEGER REFERENCES knowledge_nodes(id),
  to_node_id INTEGER REFERENCES knowledge_nodes(id),
  relationship_type VARCHAR(50), -- 'prerequisite', 'related', 'similar'
  strength FLOAT CHECK (strength BETWEEN 0 AND 1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户知识掌握度
CREATE TABLE user_knowledge_mastery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  knowledge_node_id INTEGER REFERENCES knowledge_nodes(id),
  mastery_level FLOAT CHECK (mastery_level BETWEEN 0 AND 1),
  last_practiced TIMESTAMP,
  practice_count INTEGER DEFAULT 0,
  average_score FLOAT,
  time_spent INTEGER, -- 总学习时长(分钟)
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.4 视频与资源管理
```sql
-- 视频资源元数据
CREATE TABLE video_resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  url VARCHAR(500) NOT NULL,
  duration INTEGER, -- 时长(秒)
  thumbnail_url VARCHAR(500),
  transcript TEXT, -- 自动转录文本
  chapters JSONB, -- 章节分段信息
  key_moments JSONB, -- AI标记的关键时刻
  subtitles JSONB, -- 字幕信息
  tags TEXT[],
  upload_status VARCHAR(20) DEFAULT 'processing',
  ai_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 资源智能标签
CREATE TABLE resource_tags (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER REFERENCES video_resources(id),
  tag_name VARCHAR(100),
  tag_category VARCHAR(50), -- 'subject', 'concept', 'skill'
  confidence FLOAT,
  auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.5 智能学习分析
```sql
-- 学习行为日志
CREATE TABLE learning_behaviors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  action_type VARCHAR(50), -- 'video_watch', 'quiz_attempt', 'reading'
  action_data JSONB, -- 详细行为数据
  duration INTEGER, -- 行为持续时间(秒)
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 学习效果评估
CREATE TABLE learning_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  assessment_type VARCHAR(50), -- 'quiz', 'assignment', 'peer_review'
  score FLOAT,
  time_taken INTEGER, -- 用时(分钟)
  accuracy FLOAT,
  difficulty_level INTEGER,
  knowledge_points TEXT[], -- 涉及的知识点
  created_at TIMESTAMP DEFAULT NOW()
);

-- 学习预警记录
CREATE TABLE learning_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  alert_type VARCHAR(50), -- 'low_engagement', 'poor_performance', 'inactivity'
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  message TEXT,
  triggered_data JSONB, -- 触发条件数据
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 数据关系图 (AI增强版)

```
用户层 (User Layer)
├── users
├── user_profiles (AI画像)
└── user_knowledge_mastery (知识掌握度)

课程层 (Course Layer)
├── courses
├── chapters
├── knowledge_nodes (知识图谱)
├── knowledge_relationships (图谱关系)
└── enrollments

AI服务层 (AI Service Layer)
├── ai_conversations (AI对话)
├── ai_generated_content (AI生成内容)
├── ai_teaching_suggestions (AI建议)
└── ai_assessments (AI评估)

资源层 (Resource Layer)
├── video_resources (视频资源)
├── courseware (课件)
├── materials (学习资料)
├── resource_tags (智能标签)
└── assignments (作业)

学习分析层 (Analytics Layer)
├── learning_behaviors (学习行为)
├── learning_assessments (学习评估)
├── learning_records (学习记录)
└── learning_alerts (学习预警)

交互关系:
users 1:n ai_conversations (用户有多条AI对话)
users 1:n user_knowledge_mastery (用户知识掌握度)
courses 1:n ai_generated_content (课程关联AI生成内容)
knowledge_nodes n:m knowledge_relationships (知识图谱关系)
video_resources 1:n resource_tags (视频智能标签)
learning_behaviors 1:n learning_alerts (行为触发预警)
```

### 4.3 数据库优化策略

#### 4.3.1 索引策略
```sql
-- 核心查询索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_knowledge_nodes_subject ON knowledge_nodes(subject, grade_level);
CREATE INDEX idx_learning_behaviors_user_time ON learning_behaviors(user_id, timestamp);
CREATE INDEX idx_video_resources_tags ON resource_tags(tag_name);
```

#### 4.3.2 分区策略
```sql
-- 按时间分区学习行为表
CREATE TABLE learning_behaviors_2024 PARTITION OF learning_behaviors
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 按用户ID哈希分区AI对话表
CREATE TABLE ai_conversations_part_1 PARTITION OF ai_conversations
FOR VALUES WITH (MODULUS 4, REMAINDER 0);
```

#### 4.3.3 缓存策略
- **Redis缓存**: 用户会话、热点数据、AI推荐结果
- **应用级缓存**: 知识图谱、用户画像、生成内容
- **CDN缓存**: 静态资源、视频内容、AI生成文件

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

#### 5.4.2 功能特性
- 作业模板
- 截止日期管理
- 提交状态跟踪
- 成绩统计分析

### 5.6 AI功能模块 (全面增强)

#### 5.6.1 AI教学智能体系统

**5.6.1.1 核心能力**
- **教学认知能力**: 理解教学目标、学生特征、教学内容
- **教学决策能力**: 基于数据分析制定个性化教学策略
- **教学执行能力**: 自动生成教学内容、提供教学建议、实施教学干预
- **教学反思能力**: 持续学习优化教学效果

**5.6.1.2 功能架构**
```
AI教学智能体
├── 认知引擎 (Cognition Engine)
│   ├── 教学目标理解
│   ├── 学情分析
│   ├── 知识图谱构建
│   └── 学习者建模
├── 决策引擎 (Decision Engine)
│   ├── 教学策略制定
│   ├── 个性化推荐
│   ├── 干预措施设计
│   └── 效果预测
├── 执行引擎 (Execution Engine)
│   ├── 内容生成
│   ├── 实时答疑
│   ├── 进度跟踪
│   └── 反馈提供
└── 反思引擎 (Reflection Engine)
    ├── 效果评估
    ├── 策略优化
    ├── 模型更新
    └── 经验积累
```

#### 5.6.2 AI备课与视频管理平台

**5.6.2.1 智能备课系统**
- **AI课件生成**: 
  - 一键生成完整PPT课件
  - 智能匹配教学图片和视频
  - 自动生成互动练习和测验
  - 支持多种教学风格模板

- **智能教案设计**:
  - 基于教学目标的教案结构
  - 时间分配智能建议
  - 教学方法个性化推荐
  - 差异化教学策略生成

- **教学资源整合**:
  - 全网优质资源智能搜索
  - 资源质量AI评估和筛选
  - 版权合规性自动检测
  - 资源与课程目标匹配度分析

**5.6.2.2 视频智能处理**
- **自动转录与字幕**:
  - 语音识别生成字幕(支持多种语言)
  - 字幕时间轴自动对齐
  - 关键词高亮标记
  - 字幕样式智能美化

- **内容理解与标记**:
  - 视频关键帧自动提取
  - 场景识别和分类
  - 重要知识点时间戳标记
  - 视频摘要自动生成

- **互动增强**:
  - 基于视频内容的问答生成
  - 观看进度智能提醒
  - 重点片段一键分享
  - 学习笔记视频关联

#### 5.6.3 智能学习支持系统

**5.6.3.1 AI学习导师**
- **24/7智能答疑**:
  - 自然语言问题理解
  - 多轮对话上下文保持
  - 答案准确性验证
  - 相关知识拓展推荐

- **个性化学习路径**:
  - 基于知识图谱的学习路径规划
  - 学习进度实时调整
  - 难度梯度智能控制
  - 学习效果动态评估

- **学习行为分析**:
  - 学习习惯模式识别
  - 注意力集中度分析
  - 知识掌握度评估
  - 学习困难点诊断

**5.6.3.2 智能作业与评估**
- **AI辅助批改**:
  - 客观题自动评分
  - 主观题智能点评
  - 错误类型自动分类
  - 个性化改进建议

- **智能出题系统**:
  - 基于知识点的题目生成
  - 难度自适应调整
  - 题目类型多样化
  - 避免重复和雷同

- **学习效果预测**:
  - 考试成绩预测模型
  - 学习风险早期预警
  - 个性化提升建议
  - 学习干预策略推荐

#### 5.6.4 实时AI交互系统

**5.6.4.1 多模态交互**
- **语音交互**:
  - 语音识别与合成
  - 自然语言理解
  - 情感识别与响应
  - 多方言支持

- **视觉交互**:
  - 手势识别控制
  - 面部表情分析
  - 视线追踪优化
  - 增强现实集成

**5.6.4.2 实时协作**
- **多人AI会话**:
  - 教师-学生-AI三方对话
  - 群组学习AI指导
  - 实时翻译支持
  - 讨论内容智能总结

#### 5.6.5 AI能力技术栈

**5.6.5.1 大语言模型集成**
- **模型选择**:
  - OpenAI GPT-4 (通用对话)
  - Claude 3 (教学分析)
  - 通义千问 (中文优化)
  - 本地部署模型 (数据安全)

**5.6.5.2 专用AI模型**
- **计算机视觉**:
  - 试卷扫描识别
  - 手写文字识别
  - 图表理解分析
  - 实验操作识别

- **自然语言处理**:
  - 文本摘要生成
  - 情感倾向分析
  - 知识实体提取
  - 语义相似度计算

**5.6.5.3 模型训练与优化**
- **持续学习机制**:
  - 用户反馈数据收集
  - 模型性能监控
  - A/B测试框架
  - 增量学习更新

- **隐私保护**:
  - 联邦学习框架
  - 差分隐私技术
  - 数据脱敏处理
  - 用户授权管理

### 5.7 教师端资源管理模块

#### 5.6.1 资源管理结构
- 课件管理（Courseware Management）
- 学习资料管理（Material Management）
- 章节关联资源
- 课程资源分类

#### 5.6.2 功能特性
- 资源上传与管理
- 资源类型分类（文档、视频、幻灯片等）
- 资源与章节关联
- 资源预览与下载

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

## 7. 部署架构 (云原生版)

### 7.1 部署架构演进

#### 7.1.1 开发环境 (当前)
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend:/app
  
  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_teaching
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./ai-service:/app

volumes:
  postgres_data:
```

#### 7.1.2 测试环境
- **Kubernetes集群**: 3节点集群
- **命名空间**: ai-teaching-test
- **资源限制**: CPU 4核, 内存 8GB
- **持久化存储**: 50GB SSD
- **监控**: Prometheus + Grafana

#### 7.1.3 生产环境
```yaml
# k8s-production/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-teaching-prod
  labels:
    istio-injection: enabled

# k8s-production/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-teaching-ingress
  namespace: ai-teaching-prod
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - teaching.ai-school.com
    secretName: ai-teaching-tls
  rules:
  - host: teaching.ai-school.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
```

### 7.2 容器化部署

#### 7.2.1 前端容器
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 7.2.2 AI服务容器
```dockerfile
# ai-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7.3 监控与运维

#### 7.3.1 监控体系
```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:9090']
  
  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:8000']
  
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

#### 7.3.2 日志聚合
- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **日志格式**: JSON结构化日志
- **保留策略**: 30天热存储, 90天冷存储
- **敏感信息**: 自动脱敏处理

#### 7.3.3 告警规则
```yaml
# alert-rules.yaml
groups:
- name: ai-teaching-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High error rate detected"
  
  - alert: AIServiceDown
    expr: up{job="ai-service"} == 0
    for: 1m
    annotations:
      summary: "AI service is down"
```

## 8. 性能优化 (全方位)

### 8.1 前端性能优化
- **代码分割**: 基于路由的代码分割
- **懒加载**: 图片、组件、路由懒加载
- **缓存策略**: Service Worker + HTTP缓存
- **CDN加速**: 全球CDN节点分发
- **图片优化**: WebP格式, 响应式图片

### 8.2 后端性能优化
- **数据库优化**:
  - 连接池配置(HikariCP)
  - 读写分离架构
  - 查询优化和索引策略
  - 分库分表方案

- **缓存策略**:
  - Redis集群缓存
  - 应用级缓存(Caffeine)
  - CDN边缘缓存
  - 浏览器缓存控制

- **API优化**:
  - 响应压缩(Gzip/Brotli)
  - 分页和游标分页
  - 批量操作接口
  - GraphQL查询优化

### 8.3 AI服务优化
- **模型优化**:
  - 模型量化压缩
  - 批处理推理
  - 模型缓存策略
  - GPU资源调度

- **异步处理**:
  - 任务队列(Celery)
  - 后台任务处理
  - 实时结果推送
  - 失败重试机制

## 9. 扩展性设计 (企业级)

### 9.1 微服务架构扩展
- **服务拆分策略**:
  - 按业务域拆分
  - 按数据一致性拆分
  - 按性能需求拆分
  - 按团队边界拆分

- **服务注册发现**:
  - Consul服务发现
  - Kubernetes DNS
  - 负载均衡策略
  - 健康检查机制

### 9.2 数据库扩展
- **水平扩展**:
  - 分库分表(ShardingSphere)
  - 读写分离架构
  - 主从复制集群
  - 分布式事务处理

- **垂直扩展**:
  - 存储容量扩展
  - 计算能力提升
  - 内存容量扩展
  - 网络带宽优化

### 9.3 AI能力扩展
- **模型管理**:
  - MLOps流水线
  - 模型版本管理
  - A/B测试框架
  - 模型性能监控

- **多模型集成**:
  - 模型路由策略
  - 负载均衡算法
  - 故障转移机制
  - 性能监控指标

### 9.4 多租户架构
- **数据隔离**:
  - 物理隔离模式
  - 逻辑隔离模式
  - 混合隔离模式
  - 权限控制策略

- **资源隔离**:
  - CPU资源限制
  - 内存资源限制
  - 存储资源限制
  - 网络资源限制

## 10. 安全与合规

### 10.1 数据安全
- **数据加密**:
  - 传输加密(TLS 1.3)
  - 存储加密(AES-256)
  - 数据库透明加密
  - 密钥管理服务

- **隐私保护**:
  - GDPR合规
  - 数据匿名化
  - 用户同意管理
  - 数据删除权

### 10.2 访问控制
- **身份认证**:
  - OAuth 2.0 + JWT
  - 多因子认证
  - SSO单点登录
  - 生物识别集成

- **权限管理**:
  - RBAC权限模型
  - 细粒度权限控制
  - 动态权限调整
  - 审计日志记录

### 10.3 内容安全
- **AI内容审核**:
  - 敏感词过滤
  - 图像内容审核
  - 视频内容审核
  - 用户举报处理

- **版权保护**:
  - 数字水印技术
  - 内容指纹检测
  - 版权合规检查
  - 侵权内容处理