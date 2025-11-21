// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import multer from 'multer';

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

// 基本路由
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '欢迎使用简单登录系统API',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/profile (需要认证)'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});