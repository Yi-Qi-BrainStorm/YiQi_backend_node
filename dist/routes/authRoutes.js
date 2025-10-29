"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authService_1 = require("../services/authService");
const router = express_1.default.Router();
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
        const newUser = await (0, authService_1.registerUser)(username, password);
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
    }
    catch (error) {
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
        const token = await (0, authService_1.loginUser)(username, password);
        if (!token) {
            res.status(401).json({ message: '用户名或密码错误' });
            return;
        }
        res.json({
            message: '登录成功',
            token,
            username
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});
exports.default = router;
