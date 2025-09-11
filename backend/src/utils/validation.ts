import { z } from 'zod';

// 用户验证模式
export const userSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(3, '用户名至少需要3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少需要6个字符'),
  firstName: z.string().min(1, '请输入名字'),
  lastName: z.string().min(1, '请输入姓氏'),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
});

// 登录验证模式
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

// 课程验证模式
export const courseSchema = z.object({
  code: z.string().min(3, '课程代码至少需要3个字符').max(10, '课程代码最多10个字符'),
  name: z.string().min(1, '请输入课程名称').max(100, '课程名称最多100个字符'),
  description: z.string().optional(),
  credits: z.number().int().min(1, '学分至少为1').max(10, '学分最多为10').optional(),
  department: z.string().min(1, '请输入所属院系'),
  category: z.string().min(1, '请输入课程分类'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
});

// 作业验证模式
export const assignmentSchema = z.object({
  title: z.string().min(1, '请输入作业标题').max(100, '作业标题最多100个字符'),
  description: z.string().optional(),
  type: z.enum(['HOMEWORK', 'QUIZ', 'EXAM', 'PROJECT']),
  totalPoints: z.number().int().min(1, '总分至少为1').max(1000, '总分最多为1000').optional(),
  dueDate: z.string().datetime(),
});

// 题目验证模式
export const questionSchema = z.object({
  title: z.string().min(1, '请输入题目标题').max(200, '题目标题最多200个字符'),
  content: z.string().min(1, '请输入题目内容'),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'ESSAY']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  points: z.number().int().min(1, '分值至少为1').max(100, '分值最多为100').optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// 知识点验证模式
export const knowledgePointSchema = z.object({
  title: z.string().min(1, '请输入知识点标题').max(100, '知识点标题最多100个字符'),
  description: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  importance: z.number().int().min(1, '重要性至少为1').max(5, '重要性最多为5').optional(),
  estimatedTime: z.number().int().min(1, '预计时间至少为1分钟').max(480, '预计时间最多为8小时').optional(),
  tags: z.array(z.string()).optional(),
});

// 分页验证模式
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1).optional()),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100).optional()),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// 错误处理函数
export const handleValidationError = (error: z.ZodError) => {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
};

// 验证中间件
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: handleValidationError(error),
        });
      }
      next(error);
    }
  };
};

// 验证查询参数
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.query);
      req.query = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: '查询参数验证失败',
          errors: handleValidationError(error),
        });
      }
      next(error);
    }
  };
};