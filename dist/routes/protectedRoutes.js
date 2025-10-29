"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// 受保护的路由示例
router.get('/profile', authMiddleware_1.authenticateToken, (req, res) => {
    res.json({
        message: '获取用户资料成功',
        user: {
            id: req.userId,
            username: req.username
        }
    });
});
exports.default = router;
