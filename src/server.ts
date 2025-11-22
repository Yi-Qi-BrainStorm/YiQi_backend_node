// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import chatRoutes from './routes/chatRoutes';
import multer from 'multer';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/errorMiddleware';
import { getConfigService } from './services/configService';
import { getSessionService } from './services/sessionService';

// Setup global error handlers for uncaught exceptions and unhandled rejections
setupGlobalErrorHandlers();

// Initialize ConfigService on startup
console.log('Initializing configuration...');
const configService = getConfigService();
try {
  configService.loadConfig();
  console.log('✓ Configuration validated successfully');
} catch (error) {
  console.error('✗ Failed to load configuration:', (error as Error).message);
  process.exit(1);
}

// Initialize SessionService with expiration from config
const sessionConfig = configService.getSessionConfig();
const sessionService = getSessionService(sessionConfig.expirationHours);
console.log(`✓ Session service initialized (expiration: ${sessionConfig.expirationHours} hours)`);

// Start session cleanup interval (every hour)
const cleanupInterval = setInterval(() => {
  sessionService.cleanExpiredSessions();
}, 60 * 60 * 1000); // Run every hour

// Cleanup on process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  clearInterval(cleanupInterval);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, cleaning up...');
  clearInterval(cleanupInterval);
  process.exit(0);
});

// 配置 multer
const upload = multer();

const app: Application = express();
const PORT = 8080;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 处理 multipart/form-data
app.use(upload.none());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/chat', chatRoutes);

// 基本路由
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '欢迎使用 AI 聊天 API 系统',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/profile (需要认证)',
      chatSend: 'POST /api/chat/send (需要认证)',
      chatStream: 'GET /api/chat/stream (需要认证)'
    }
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});