import { setupServer } from 'msw/node';
import handlers from './handlers';

// 创建MSW服务器实例
const server = setupServer(...handlers);

// 导出服务器控制函数
export const startServer = () => {
  console.log('Starting MSW server...');
  server.listen({
    onUnhandledRequest: 'bypass'
  });
};

export const stopServer = () => {
  server.close();
};

export const resetServer = () => {
  server.resetHandlers();
};

export default server;