import express from 'express';
import { registerUser, loginUser } from '../services/authService';

const router = express.Router();

// 注册路由
router.post('/register', async (req, res) => {
  try {
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
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码是必需的' });
      return;
    }

    // 用户登录
    const token = await loginUser(username, password);
    
    if (!token) {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }

    res.json({ 
      message: '登录成功',
      token,
      username
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;