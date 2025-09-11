import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // 在开发模式下显示详细的错误信息
  if (process.env.NODE_ENV === 'development') {
    console.error('\n=== 错误详情 ===');
    console.error('时间:', new Date().toISOString());
    console.error('请求路径:', req.method, req.originalUrl);
    console.error('错误信息:', err.message);
    console.error('错误代码:', err.code);
    console.error('错误名称:', err.name);
    console.error('堆栈跟踪:', err.stack);
    console.error('==================\n');
  } else {
    console.error(err);
  }

  // Prisma错误处理
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = { ...error, message, statusCode: 400 };
  }

  if (err.code === 'P2014') {
    const message = 'Invalid ID provided';
    error = { ...error, message, statusCode: 400 };
  }

  if (err.code === 'P2003') {
    const message = 'Invalid input data';
    error = { ...error, message, statusCode: 400 };
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { ...error, message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { ...error, message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};