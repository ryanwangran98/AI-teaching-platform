# AI教学平台后端系统

基于Node.js + Express + Prisma + PostgreSQL构建的现代化教学平台后端系统。

## 功能特性

- 🔐 **用户认证与授权** - JWT令牌认证，多角色权限管理
- 📚 **课程管理** - 完整的课程生命周期管理
- 📖 **章节管理** - 层级化内容组织
- 🎯 **知识点系统** - 智能知识点关联与追踪
- 📝 **作业系统** - 多样化作业类型支持
- ❓ **题库管理** - 丰富的题型支持
- 📊 **学习分析** - 学习进度与成绩统计
- 📧 **邮件通知** - 自动化邮件提醒
- 📁 **文件上传** - 支持多种文件类型
- 📱 **RESTful API** - 标准化接口设计

## 技术栈

- **运行环境**: Node.js 18+
- **框架**: Express.js
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer
- **邮件**: Nodemailer
- **验证**: Zod
- **日志**: Winston
- **文档**: Swagger

## 快速开始

### 环境要求

- Node.js 18.0.0 或更高版本
- PostgreSQL 12.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai-teaching-platform/backend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   复制 `.env.example` 为 `.env` 并配置相关参数：
   ```bash
   cp .env.example .env
   ```

4. **数据库设置**
   ```bash
   # 创建数据库
   createdb ai_teaching_platform
   
   # 运行迁移
   npm run db:migrate
   
   # 生成种子数据（可选）
   npm run db:seed
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 环境变量配置

```env
# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/ai_teaching_platform"

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# AI服务配置
OPENAI_API_KEY=your-openai-api-key
```

## 项目结构

```
src/
├── config/          # 配置文件
├── middleware/      # 中间件
│   ├── auth.ts      # 认证中间件
│   ├── errorHandler.ts  # 错误处理
│   └── notFound.ts  # 404处理
├── routes/          # API路由
│   ├── auth.ts      # 认证相关
│   ├── courses.ts   # 课程管理
│   ├── users.ts     # 用户管理
│   └── ...
├── utils/           # 工具函数
│   ├── fileUpload.ts   # 文件上传
│   ├── email.ts     # 邮件发送
│   ├── validation.ts # 数据验证
│   └── logger.ts    # 日志记录
└── scripts/         # 脚本文件
    └── seed.ts      # 种子数据
```

## API文档

启动开发服务器后，访问以下地址查看API文档：
- Swagger文档: http://localhost:3001/api-docs
- Prisma Studio: http://localhost:3001/studio

## 数据库模型

### 主要实体

- **User** - 用户（学生/教师/管理员）
- **Course** - 课程
- **Chapter** - 章节
- **KnowledgePoint** - 知识点
- **Assignment** - 作业
- **Question** - 题目
- **Submission** - 作业提交
- **Courseware** - 课件
- **Notification** - 通知

### 关系图

```
User ─┬─ Course (创建者)
      ├─ Enrollment (选课)
      ├─ Submission (作业提交)
      └─ Notification (通知)

Course ─┬─ Chapter (章节)
        ├─ Assignment (作业)
        ├─ KnowledgePoint (知识点)
        └─ Courseware (课件)
```

## 开发命令

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 生产运行
npm start

# 数据库操作
npm run db:generate    # 生成Prisma客户端
npm run db:migrate     # 运行数据库迁移
npm run db:push        # 推送schema到数据库
npm run db:studio      # 启动Prisma Studio
```

## 部署指南

### Docker部署

```bash
# 构建镜像
docker build -t ai-teaching-backend .

# 运行容器
docker run -p 3001:3001 --env-file .env ai-teaching-backend
```

### 生产环境

1. 设置生产环境变量
2. 运行数据库迁移
3. 构建项目
4. 使用PM2等进程管理器运行

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。