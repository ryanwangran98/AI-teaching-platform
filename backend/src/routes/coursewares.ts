import express = require('express');
import prisma from '../config/database';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
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
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|mp3|zip|rar/;
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
      cb(new Error('不支持的文件类型！'));
    }
  }
});

// 获取课件列表
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type, courseId, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {
      // 基础过滤：只返回当前用户上传的课件
      uploadedById: req.user!.id
    };

    if (type) where.type = type as string;

    // 如果提供了courseId，添加课程过滤逻辑
    if (courseId) {
      // 简化逻辑：对于没有关联章节的课件，如果上传者是该课程的教师，则显示
      // 先检查当前用户是否是该课程的教师
      const course = await prisma.course.findUnique({
        where: { id: courseId as string },
        select: { teacherId: true }
      });

      if (course && course.teacherId === req.user!.id) {
        // 当前用户是该课程的教师，显示所有相关课件
        where.OR = [
          // 情况1：课件属于该课程的某个章节
          {
            chapter: {
              courseId: courseId as string
            }
          },
          // 情况2：课件没有关联章节（由该教师上传）
          {
            chapterId: null
          }
        ];
      } else {
        // 当前用户不是该课程的教师，只显示属于该课程章节的课件
        where.chapter = {
          courseId: courseId as string
        };
      }
    }

    const coursewares = await prisma.courseware.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                name: true,
                teacherId: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.courseware.count({ where });

    res.json({
      success: true,
      data: {
        coursewares,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching coursewares:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个课件详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const courseware = await prisma.courseware.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              select: { teacherId: true }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!courseware) {
      return res.status(404).json({ error: 'Courseware not found' });
    }

    res.json({
      success: true,
      data: courseware
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 创建课件（仅教师）
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    console.log('Creating courseware with data:', req.body);
    console.log('User info:', req.user);
    console.log('Uploaded file:', req.file);
    
    // 将title声明为let，以便在未提供时可以修改
    let title = req.body.title;
    const { description, type, chapterId } = req.body;
    
    // 如果没有上传文件，获取url和fileSize参数
    const url = req.body.url;
    const fileSize = req.body.fileSize;
    
    // 如果有上传文件，使用文件信息
    let fileUrl = url;
    let fileSizeNumber = fileSize ? Number(fileSize) : undefined;
    
    if (req.file) {
      // 生成文件的URL路径（相对路径或绝对路径，根据实际情况调整）
      fileUrl = `/uploads/${req.file.filename}`;
      fileSizeNumber = req.file.size;
      
      // 如果没有提供title，使用文件名作为标题
      if (!title) {
        const originalName = req.file.originalname;
        const titleWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        title = titleWithoutExt;
      }
    }
    
    console.log('Extracted fields:', { title, description, type, fileUrl, fileSizeNumber, chapterId });
    
    if (!title || !type || !fileUrl) {
      console.log('Missing required fields:', { title: !!title, type: !!type, fileUrl: !!fileUrl });
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    // 验证type字段是否有效
    const validTypes = ['SLIDES', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid courseware type' });
    }
    
    // 如果提供了chapterId，验证章节是否存在且属于当前教师
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
        return res.status(403).json({ error: 'Not authorized to add courseware to this chapter' });
      }
    }
    
    const courseware = await prisma.courseware.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        fileSize: fileSizeNumber,
        chapterId: chapterId || null,
        uploadedById: req.user!.id
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: courseware
    });
  } catch (error) {
    // 如果上传文件时出错，移除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error creating courseware:', error);
    
    // 处理文件类型错误
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the limit (50MB)' });
      }
    } else if (error.message === '不支持的文件类型！') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// 更新课件（仅教师或管理员）
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, chapterId, status } = req.body;

    // 验证type字段是否有效
    if (type) {
      const validTypes = ['SLIDES', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid courseware type' });
      }
    }

    const courseware = await prisma.courseware.findUnique({
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

    if (!courseware) {
      return res.status(404).json({ error: 'Courseware not found' });
    }

    if (req.user!.role !== 'ADMIN' && courseware.chapter.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this courseware' });
    }

    // 如果提供了chapterId，验证章节是否存在且属于当前教师
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
        return res.status(403).json({ error: 'Not authorized to assign to this chapter' });
      }
    }

    // 构建更新数据，避免包含未提供的字段
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (chapterId !== undefined) updateData.chapterId = chapterId;
    if (status !== undefined) updateData.status = status;

    const updatedCourseware = await prisma.courseware.update({
        where: { id },
        data: updateData,
        include: {
          chapter: {
            select: {
              id: true,
              title: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

    res.json({
      success: true,
      data: updatedCourseware
    });
  } catch (error) {
    console.error('更新课件失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 删除课件（仅教师或管理员）
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const courseware = await prisma.courseware.findUnique({
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

    if (!courseware) {
      return res.status(404).json({ error: 'Courseware not found' });
    }

    // 检查权限：管理员可以删除任何课件，教师只能删除自己上传的课件
    if (req.user!.role !== 'ADMIN') {
      // 如果课件关联了章节，检查是否是该课程的教师
      if (courseware.chapter && courseware.chapter.course.teacherId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to delete this courseware' });
      }
      // 如果课件没有关联章节，检查是否是上传者
      if (!courseware.chapter && courseware.uploadedById !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to delete this courseware' });
      }
    }

    await prisma.courseware.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Courseware deleted successfully'
    });
  } catch (error) {
    console.error('删除课件失败:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;