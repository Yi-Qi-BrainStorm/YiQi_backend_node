"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const authService_1 = require("../services/authService");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({ message: '访问令牌缺失' });
        return;
    }
    const decoded = (0, authService_1.verifyToken)(token);
    if (!decoded) {
        res.status(403).json({ message: '无效或过期的令牌' });
        return;
    }
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
};
exports.authenticateToken = authenticateToken;
