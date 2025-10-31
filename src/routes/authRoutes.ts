import express from 'express';
import { registerUser, loginUser, verifyToken } from '../services/authService';

const router = express.Router();

// 注册路由
router.post('/register', async (req, res) => {
  try {
    // 调试信息
    console.log('Received request body:', req.body);
    console.log('Content-Type header:', req.headers['content-type']);
    
    // 检查请求体是否存在
    if (!req.body) {
      res.status(400).json({ message: '请求体不能为空' });
      return;
    }
    
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码是必需的' });
      return;
    }

    // 注册用户
    const newUser = await registerUser(username, password);
    
    if (!newUser) {
      res.status(409).json({ message: '用户名已存在' });
      return;
    }

    res.status(201).json({ 
      message: '用户注册成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    // 调试信息
    console.log('Received request body:', req.body);
    console.log('Content-Type header:', req.headers['content-type']);
    
    // 检查请求体是否存在
    if (!req.body) {
      res.status(400).json({ message: '请求体不能为空' });
      return;
    }
    
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码是必需的' });
      return;
    }

    // 用户登录
    const result = await loginUser(username, password);
    
    if (!result) {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }

    res.json({ 
      message: '登录成功',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 检查token是否有效的路由
router.post('/check', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        message: '访问令牌缺失',
        valid: false 
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(403).json({ 
        message: '无效或过期的令牌',
        valid: false 
      });
      return;
    }

    res.json({ 
      message: '令牌有效',
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username
      }
    });
  } catch (error) {
    console.error('检查令牌错误:', error);
    res.status(500).json({ 
      message: '服务器内部错误',
      valid: false 
    });
  }
});

export default router;