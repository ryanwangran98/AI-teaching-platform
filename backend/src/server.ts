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
import studentStatsRoutes from './routes/studentStats';
import chapterProgressRoutes from './routes/chapterProgress';
import videoSegmentRoutes from './routes/videoSegments';
import { specs, swaggerUi } from './utils/swagger';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());

// 全局CORS配置
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://192.168.110.241:5173', 'http://192.168.204.1:5173', 'http://192.168.59.1:5173', 'http://172.19.128.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range']
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
  max: 5000, // 限制每个IP 15分钟内最多5000个请求
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
app.use('/api/student-stats', studentStatsRoutes);
app.use('/api/chapter-progress', chapterProgressRoutes);
app.use('/api/video-segments', videoSegmentRoutes);
app.use('/api/upload', uploadRoutes);

// 文件上传服务
// 配置静态文件服务，设置适当的Content-Type和Content-Disposition头信息

// 为可在浏览器中预览的文件类型设置Content-Disposition: inline
// 这会告诉浏览器尝试以内联方式显示文件而不是下载它
const previewableExtensions = [
  // 图片类型
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp',
  // 文档类型
  'pdf', 'html', 'htm', 'txt', 'md', 'css', 'js',
  // Office文档
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // 视频类型
  'mp4', 'webm', 'ogg', 'mp3', 'wav'
];

// 使用express.static提供更好的静态文件服务，包括范围请求支持
const path = require('path');
const uploadsPath = path.join(__dirname, '..', 'uploads');

// 配置静态文件服务，设置适当的头信息
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // 获取文件扩展名
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    // 检查是否是可预览的文件类型
    const isPreviewable = previewableExtensions.includes(extension);
    
    if (isPreviewable) {
      // 对于可预览的文件，显式设置Content-Disposition为inline
      res.setHeader('Content-Disposition', 'inline');
      
      // 为不同类型的文件设置适当的Content-Type
      const contentTypeMap = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'css': 'text/css',
        'js': 'application/javascript',
        'html': 'text/html',
        'htm': 'text/html',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav'
        // 对于Office文档，我们不设置特定的Content-Type，让浏览器自己处理
      };
      
      // 如果文件类型在contentTypeMap中，设置对应的Content-Type
      if (contentTypeMap[extension]) {
        res.setHeader('Content-Type', contentTypeMap[extension]);
      }
    } else {
      // 对于其他文件类型，设置nosniff头以确保安全
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // 为视频文件添加额外的头信息以支持流式播放
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// 处理OPTIONS预检请求
app.use('/uploads', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`\n🚀 服务器启动成功!`);
  console.log(`� 端口: ${PORT}`);
  console.log(`📚 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`� API文档: http://localhost:${PORT}/api-docs`);
  console.log(`� 健康检查: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔧 开发模式启用 - 错误日志已开启`);
    console.log(`📁 文件上传目录: ${process.cwd()}/uploads`);
  }
  console.log(`===================================\n`);
});

// 设置服务器超时时间（5分钟），解决大文件上传超时问题
server.setTimeout(5 * 60 * 1000); // 5分钟超时

// 设置keep-alive超时时间
server.keepAliveTimeout = 120000; // 2分钟
server.headersTimeout = 120000; // 2分钟

export default app;