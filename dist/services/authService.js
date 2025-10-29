"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fileUtils_1 = require("../utils/fileUtils");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// 注册新用户
const registerUser = async (username, password) => {
    const users = (0, fileUtils_1.readUsers)();
    // 检查用户名是否已存在
    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
        return null;
    }
    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
    // 创建新用户
    const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        password: hashedPassword,
        createdAt: new Date()
    };
    // 保存用户
    users.push(newUser);
    (0, fileUtils_1.writeUsers)(users);
    return newUser;
};
exports.registerUser = registerUser;
// 用户登录
const loginUser = async (username, password) => {
    const users = (0, fileUtils_1.readUsers)();
    // 查找用户
    const user = users.find((u) => u.username === username);
    if (!user) {
        return null;
    }
    // 验证密码
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        return null;
    }
    // 生成JWT令牌
    const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    return token;
};
exports.loginUser = loginUser;
// 验证JWT令牌
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
