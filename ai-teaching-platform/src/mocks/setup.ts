import { setupWorker } from 'msw/browser';
import handlers from './handlers';

// 创建Mock Service Worker实例
const worker = setupWorker(...handlers);

// 启动Mock服务
async function startMockService() {
  try {
    console.log('Attempting to register MSW Service Worker...');
    console.log('Service Worker file should be available at:', '/mockServiceWorker.js');
    
    await worker.start({
      // 允许外部请求
      allowExternalRequests: true,
      // 未处理的请求直接绕过
      onUnhandledRequest: 'bypass'
    });
    
    console.log('MSW mock service started successfully');
    console.log('Service Worker registered and ready to intercept requests');
  } catch (error) {
    console.error('Failed to start MSW mock service:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

export default startMockService;