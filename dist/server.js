"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const protectedRoutes_1 = __importDefault(require("./routes/protectedRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const multer_1 = __importDefault(require("multer"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const configService_1 = require("./services/configService");
const sessionService_1 = require("./services/sessionService");
// Setup global error handlers for uncaught exceptions and unhandled rejections
(0, errorMiddleware_1.setupGlobalErrorHandlers)();
// Initialize ConfigService on startup
console.log('Initializing configuration...');
const configService = (0, configService_1.getConfigService)();
try {
    configService.loadConfig();
    console.log('✓ Configuration validated successfully');
}
catch (error) {
    console.error('✗ Failed to load configuration:', error.message);
    process.exit(1);
}
// Initialize SessionService with expiration from config
const sessionConfig = configService.getSessionConfig();
const sessionService = (0, sessionService_1.getSessionService)(sessionConfig.expirationHours);
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
const upload = (0, multer_1.default)();
const app = (0, express_1.default)();
const PORT = 8080;
// 中间件
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 处理 multipart/form-data
app.use(upload.none());
// 路由
app.use('/api/auth', authRoutes_1.default);
app.use('/api', protectedRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
// 基本路由
app.get('/', (req, res) => {
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
app.use(errorMiddleware_1.notFoundHandler);
// Global error handler - must be last
app.use(errorMiddleware_1.errorHandler);
// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
