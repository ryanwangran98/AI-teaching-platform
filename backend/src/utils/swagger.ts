import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI教学平台API',
      version: '1.0.0',
      description: 'AI融合教学平台后端API文档',
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: '开发服务器',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // 指定包含API注释的文件路径
  ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };