import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// 受保护的路由示例
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ 
    message: '获取用户资料成功',
    user: {
      id: req.userId,
      username: req.username
    }
  });
});

export default router;