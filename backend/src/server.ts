import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import chapterRoutes from './routes/chapters';
import assignmentRoutes from './routes/assignments';
import questionRoutes from './routes/questions';
import knowledgePointRoutes from './routes/knowledgePoints';
import coursewareRoutes from './routes/coursewares';
import materialRoutes from './routes/materials';
import submissionRoutes from './routes/submissions';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import learningRecordRoutes from './routes/learningRecords';
import { specs, swaggerUi } from './utils/swagger';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 开发模式下的请求日志
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('请求体:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 500, // 限制每个IP 15分钟内最多500个请求
  message: '请求过于频繁，请稍后再试',
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/knowledge-points', knowledgePointRoutes);
app.use('/api/coursewares', coursewareRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/learning-records', learningRecordRoutes);
app.use('/api/upload', uploadRoutes);

// 文件上传服务
app.use('/uploads', express.static('uploads'));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 服务器启动成功!`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`📚 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API文档: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔧 开发模式启用 - 错误日志已开启`);
    console.log(`📁 文件上传目录: ${process.cwd()}/uploads`);
  }
  console.log(`===================================\n`);
});

export default app;