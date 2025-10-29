"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const protectedRoutes_1 = __importDefault(require("./routes/protectedRoutes"));
const app = (0, express_1.default)();
const PORT = 8080;
// 中间件
app.use(express_1.default.json());
// 路由
app.use('/api/auth', authRoutes_1.default);
app.use('/api', protectedRoutes_1.default);
// 基本路由
app.get('/', (req, res) => {
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
