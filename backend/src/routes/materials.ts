import express from 'express';
import prisma from '../config/database';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一的文件名，避免冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

// 创建multer实例
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB的大小限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件扩展名
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|mp3|zip|rar|txt/;
    // 允许的MIME类型
    const allowedMimeTypes = [
      // 图片
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // 文档
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      // 视频
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      // 音频
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/mp4',
      // 压缩文件
      'application/zip',
      'application/x-rar-compressed',
      'application/x-zip-compressed',
      'application/x-7z-compressed'
    ];
    
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 生成文件URL
const getFileUrl = (filename: string): string => {
  return `/uploads/${filename}`;
}

// 获取资料列表
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    const where = courseId ? { 
      chapter: {
        courseId: courseId as string
      }
    } : {};

    const materials = await prisma.material.findMany({
      where,
      include: {
        chapter: {
          include: {
            course: true
          }
        },
        uploadedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个资料详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: true
          }
        },
        uploadedBy: true
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建资料（仅教师或管理员）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), upload.single('file'), async (req: any, res) => {
  console.log('=== MATERIALS POST ROUTE HIT ===');
  try {
    console.log('Creating material with data:', req.body);
    console.log('User info:', req.user);
    console.log('Uploaded file:', req.file);
    
    // 将title声明为let，以便在未提供时可以修改
    let title = req.body.title;
    const {
      description,
      type,
      chapterId
    } = req.body;

    // 如果上传了文件
    let fileUrl = '';
    let fileSize = 0;
    
    if (req.file) {
      // 从上传的文件中获取URL和文件大小
      fileUrl = getFileUrl(req.file.filename);
      fileSize = req.file.size;
      
      // 如果未提供标题，使用文件名作为标题
      if (!title) {
        title = path.basename(req.file.originalname, path.extname(req.file.originalname));
      }
    } else {
      // 如果没有上传文件，获取url和fileSize参数
      fileUrl = req.body.fileUrl;
      fileSize = req.body.fileSize || 0;
    }

    if (!title || !type || !fileUrl) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // 验证type字段是否有效（大小写不敏感）
    const validTypes = ['VIDEO', 'PDF', 'DOC', 'IMAGE', 'AUDIO', 'ZIP', 'OTHER'];
    const upperCaseType = type.toUpperCase();
    if (!validTypes.includes(upperCaseType)) {
      return res.status(400).json({ error: 'Invalid material type' });
    }

    // 如果提供了chapterId，验证章节是否存在且课程属于当前教师
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          course: {
            select: { teacherId: true }
          }
        }
      });

      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      if (req.user!.role !== 'ADMIN' && chapter.course.teacherId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to add materials to this course' });
      }
    }

    const material = await prisma.material.create({
      data: {
        title,
        description,
        type: upperCaseType,
        fileUrl,
        fileSize: fileSize || 0,
        chapterId: chapterId || (await prisma.chapter.findFirst({ 
          where: { courseId: req.body.courseId }
        }))?.id || '',
        uploadedById: req.user!.id
      },
      include: {
        chapter: {
          include: {
            course: true
          }
        },
        uploadedBy: true
      }
    });

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    // 如果上传文件时出错，移除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error creating material:', error);
    // Log the actual error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // 处理文件类型错误
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the limit of 50MB' });
      }
    } else if (error instanceof Error && error.message === '不支持的文件类型') {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新资料（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 验证type字段是否有效（大小写不敏感）
    if (updateData.type) {
      const validTypes = ['VIDEO', 'PDF', 'DOC', 'IMAGE', 'AUDIO', 'ZIP', 'OTHER'];
      const upperCaseType = updateData.type.toUpperCase();
      if (!validTypes.includes(upperCaseType)) {
        return res.status(400).json({ error: 'Invalid material type' });
      }
      // 更新数据使用大写类型
      updateData.type = upperCaseType;
    }

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              select: { teacherId: true }
            }
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (req.user!.role !== 'ADMIN' && material.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this material' });
    }

    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        chapter: {
          include: {
            course: true
          }
        },
        uploadedBy: true
      }
    });

    res.json({
      success: true,
      data: updatedMaterial
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除资料（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: any, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              select: { teacherId: true }
            }
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (req.user!.role !== 'ADMIN' && material.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this material' });
    }

    await prisma.material.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;