# AI Chat API

一个支持多个 AI 模型提供商的聊天 API 服务，提供流式和非流式两种对话模式。

## ✨ 特性

- 🤖 **多模型支持**：集成 DeepSeek、Kimi、Qwen、OpenRouter 等多个 AI 提供商
- 💬 **双模式对话**：支持流式（SSE）和非流式响应
- 🔐 **安全认证**：JWT token 认证和会话权限控制
- 🚦 **速率限制**：防止 API 滥用，保护后端资源
- 📝 **会话管理**：自动维护对话历史，支持多轮对话
- ⚙️ **灵活配置**：通过配置文件轻松添加新的 AI 提供商

## 📋 目录

- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API 使用](#api-使用)
- [支持的模型](#支持的模型)
- [添加新提供商](#添加新提供商)
- [开发指南](#开发指南)
- [故障排查](#故障排查)

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Keys：

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_strong_secret_here

# AI Provider API Keys
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

### 3. 获取 API Keys

访问以下网站注册并获取 API Key：

- **DeepSeek**: https://platform.deepseek.com/
- **Kimi**: https://platform.moonshot.cn/
- **Qwen (SiliconFlow)**: https://siliconflow.cn/
- **OpenRouter**: https://openrouter.ai/

### 4. 启动服务

```bash
# 开发模式（支持热重载）
pnpm dev

# 生产模式
pnpm build
pnpm start
```

服务将在 `http://localhost:8080` 启动。

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 服务端口 | 8080 | 否 |
| `NODE_ENV` | 运行环境 | development | 否 |
| `JWT_SECRET` | JWT 密钥 | - | 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | - | 是* |
| `KIMI_API_KEY` | Kimi API Key | - | 是* |
| `QWEN_API_KEY` | Qwen API Key | - | 是* |
| `OPENROUTER_API_KEY` | OpenRouter API Key | - | 是* |

*至少需要配置一个 AI 提供商的 API Key

### 配置文件结构

配置文件位于 `config/ai-providers.json`：

```json
{
  "providers": {
    "provider-name": {
      "baseURL": "https://api.provider.com/v1/chat/completions",
      "apiKey": "${ENV_VAR_NAME}",
      "models": ["model-1", "model-2"]
    }
  },
  "rateLimits": {
    "requestsPerMinute": 10,
    "maxMessageLength": 4000,
    "maxSystemPromptLength": 2000
  },
  "session": {
    "expirationHours": 24
  }
}
```

**字段说明**：

- `providers`: AI 提供商配置
  - `baseURL`: API 端点地址
  - `apiKey`: 使用 `${ENV_VAR}` 格式引用环境变量
  - `models`: 该提供商支持的模型列表
- `rateLimits`: 速率限制配置
  - `requestsPerMinute`: 每分钟最大请求数
  - `maxMessageLength`: 用户消息最大长度
  - `maxSystemPromptLength`: 系统提示词最大长度
- `session`: 会话配置
  - `expirationHours`: 会话过期时间（小时）

### 配置优先级

系统按以下优先级加载配置：

1. **环境变量**（最高优先级）
2. `.env` 文件
3. `config/ai-providers.json` 文件（默认值）

## 📡 API 使用

### 认证

所有 API 请求都需要在 Header 中包含 JWT token：

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 1. 非流式对话

**端点**: `POST /api/chat/send`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "agent_123",
    "sessionId": "session_456",
    "message": "你好，请介绍一下你自己",
    "agentConfig": {
      "name": "AI助手",
      "model": "deepseek-chat",
      "temperature": 0.7,
      "systemPrompt": "你是一个友好的AI助手"
    },
    "stream": false
  }'
```

**请求参数**:

| 参数 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `agentId` | string | Agent 唯一标识 | 是 |
| `sessionId` | string | 会话唯一标识 | 是 |
| `message` | string | 用户消息内容 | 是 |
| `agentConfig` | object | Agent 配置 | 是 |
| `agentConfig.name` | string | Agent 名称 | 是 |
| `agentConfig.model` | string | 模型名称 | 是 |
| `agentConfig.temperature` | number | 温度参数 (0-1) | 是 |
| `agentConfig.systemPrompt` | string | 系统提示词 | 是 |
| `stream` | boolean | 是否流式响应 | 否 |

**响应示例**:

```json
{
  "messageId": "msg_1234567890",
  "content": "你好！我是一个AI助手...",
  "timestamp": 1234567890000,
  "model": "deepseek-chat",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 100,
    "totalTokens": 150
  }
}
```

### 2. 流式对话 (SSE)

**端点**: `GET /api/chat/stream`

**请求示例**:

```bash
curl -N "http://localhost:8080/api/chat/stream?agentId=agent_123&sessionId=session_456&message=你好&agentConfig=%7B%22name%22%3A%22AI%E5%8A%A9%E6%89%8B%22%2C%22model%22%3A%22deepseek-chat%22%2C%22temperature%22%3A0.7%2C%22systemPrompt%22%3A%22%E4%BD%A0%E6%98%AF%E4%B8%80%E4%B8%AA%E5%8F%8B%E5%A5%BD%E7%9A%84AI%E5%8A%A9%E6%89%8B%22%7D" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**查询参数**:

所有参数需要进行 URL 编码，特别是 `agentConfig` 需要将 JSON 对象编码为字符串。

**响应格式** (Server-Sent Events):

```
data: {"delta":"你","done":false}

data: {"delta":"好","done":false}

data: {"delta":"！","done":false}

data: {"delta":"","done":true,"messageId":"msg_1234567890"}
```

### 错误响应

所有错误响应遵循统一格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

**常见错误码**:

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `MISSING_PARAMETER` | 400 | 缺少必填参数 |
| `INVALID_CONFIG` | 400 | Agent 配置无效 |
| `INVALID_MODEL` | 400 | 不支持的模型 |
| `MESSAGE_TOO_LONG` | 400 | 消息长度超限 |
| `INVALID_TOKEN` | 401 | JWT token 无效 |
| `TOKEN_EXPIRED` | 401 | JWT token 已过期 |
| `FORBIDDEN_SESSION` | 403 | 无权访问该会话 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `AI_API_ERROR` | 500 | AI API 调用失败 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

## 🤖 支持的模型

### DeepSeek

| 模型名称 | 说明 | 特点 |
|---------|------|------|
| `deepseek-chat` | 标准对话模型 | 快速响应，适合日常对话 |
| `deepseek-reasoner` | 推理模型 | 深度思考，适合复杂问题 |

### Kimi (Moonshot)

| 模型名称 | 说明 | 特点 |
|---------|------|------|
| `kimi-k2-0905-preview` | K2 标准版 | 平衡性能和质量 |
| `kimi-k2-turbo-preview` | K2 高速版 | 快速响应 |
| `kimi-k2-thinking-turbo` | K2 思考高速版 | 推理能力强 |
| `kimi-latest` | 最新版本 | 自动使用最新模型 |

### Qwen (通过 SiliconFlow)

| 模型名称 | 说明 | 特点 |
|---------|------|------|
| `Qwen/QwQ-32B` | 推理模型 | 强大的推理能力 |
| `Qwen/Qwen3-235B-A22B-Instruct-2507` | 旗舰模型 | 最强性能 |

### OpenRouter (免费模型)

| 模型名称 | 说明 | 特点 |
|---------|------|------|
| `z-ai/glm-4.5-air:free` | GLM-4.5 免费版 | 中文友好 |
| `tngtech/deepseek-r1t2-chimera:free` | DeepSeek R1 免费版 | 推理能力强 |
| `deepseek/deepseek-chat-v3-0324:free` | DeepSeek V3 免费版 | 综合性能好 |
| `meta-llama/llama-3.3-70b-instruct:free` | Llama 3.3 免费版 | 开源模型 |

## ➕ 添加新提供商

### 步骤 1: 更新配置文件

编辑 `config/ai-providers.json`，添加新的提供商配置：

```json
{
  "providers": {
    "new-provider": {
      "baseURL": "https://api.new-provider.com/v1/chat/completions",
      "apiKey": "${NEW_PROVIDER_API_KEY}",
      "models": ["model-1", "model-2", "model-3"]
    }
  }
}
```

**要求**:
- `baseURL` 必须是 OpenAI 兼容的 API 端点
- `apiKey` 使用 `${ENV_VAR}` 格式引用环境变量
- `models` 列出该提供商支持的所有模型名称

### 步骤 2: 添加环境变量

在 `.env` 文件中添加对应的 API Key：

```env
NEW_PROVIDER_API_KEY=your_api_key_here
```

同时更新 `.env.example` 文件，方便其他开发者配置：

```env
# New Provider API Key
# 官网：https://new-provider.com/
# 支持模型：model-1, model-2, model-3
NEW_PROVIDER_API_KEY=your_new_provider_api_key_here
```

### 步骤 3: 重启服务

```bash
pnpm dev
```

新的提供商和模型将自动可用，无需修改代码！

### 兼容性要求

新添加的 AI 提供商必须满足以下要求：

1. **API 格式**: 兼容 OpenAI Chat Completions API
2. **请求格式**:
   ```json
   {
     "model": "model-name",
     "messages": [
       {"role": "system", "content": "..."},
       {"role": "user", "content": "..."}
     ],
     "temperature": 0.7,
     "stream": false
   }
   ```
3. **响应格式**: 
   - 非流式: 返回 `choices[0].message.content`
   - 流式: 返回 SSE 格式的 `choices[0].delta.content`

## 🛠️ 开发指南

### 项目结构

```
.
├── config/                 # 配置文件
│   └── ai-providers.json  # AI 提供商配置
├── src/
│   ├── middleware/        # 中间件
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts
│   │   └── rateLimitMiddleware.ts
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   │   └── chatRoutes.ts
│   ├── services/          # 业务逻辑
│   │   ├── aiProviderService.ts
│   │   ├── chatService.ts
│   │   ├── configService.ts
│   │   └── sessionService.ts
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   └── server.ts          # 服务入口
├── .env                   # 环境变量（不提交）
├── .env.example           # 环境变量模板
└── README.md              # 本文档
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 所有 API 错误必须返回统一格式
- 敏感信息不得记录到日志

## 🐛 故障排查

### 问题 1: 启动时报错 "Missing API Key"

**原因**: 环境变量未配置或配置错误

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认所有 API Key 都已填写
3. 确认环境变量名称与 `config/ai-providers.json` 中的引用一致
4. 重启服务

### 问题 2: API 返回 401 "INVALID_TOKEN"

**原因**: JWT token 无效或过期

**解决方案**:
1. 检查 Authorization header 格式：`Bearer YOUR_TOKEN`
2. 确认 token 未过期
3. 确认 JWT_SECRET 配置正确

### 问题 3: API 返回 400 "INVALID_MODEL"

**原因**: 请求的模型不在支持列表中

**解决方案**:
1. 检查模型名称拼写
2. 查看 `config/ai-providers.json` 中的 models 列表
3. 确认该提供商的 API Key 已配置

### 问题 4: API 返回 429 "RATE_LIMIT_EXCEEDED"

**原因**: 请求频率超过限制

**解决方案**:
1. 降低请求频率
2. 在 `config/ai-providers.json` 中调整 `rateLimits.requestsPerMinute`
3. 等待一分钟后重试

### 问题 5: 流式响应中断或不完整

**原因**: 网络问题或 AI API 超时

**解决方案**:
1. 检查网络连接
2. 确认 AI 提供商服务状态
3. 尝试使用非流式模式
4. 尝试其他模型

### 问题 6: 会话历史丢失

**原因**: 服务重启导致内存数据丢失

**解决方案**:
- 当前版本使用内存存储，重启会丢失数据
- 生产环境建议使用 Redis 或数据库存储会话

## 📚 相关文档

- [详细配置指南](./docs/AI_CHAT_API_SETUP.md)
- [架构设计文档](./.kiro/specs/ai-chat-api/design.md)
- [需求文档](./.kiro/specs/ai-chat-api/requirements.md)
- [任务列表](./.kiro/specs/ai-chat-api/tasks.md)

## 🔗 外部资源

- [DeepSeek 文档](https://platform.deepseek.com/docs)
- [Kimi 文档](https://platform.moonshot.cn/docs)
- [SiliconFlow 文档](https://docs.siliconflow.cn/)
- [OpenRouter 文档](https://openrouter.ai/docs)
- [OpenAI API 参考](https://platform.openai.com/docs/api-reference)

## ⚠️ 注意事项

### 安全性

1. **API Key 保护**
   - 不要在代码中硬编码 API Key
   - 不要将 `.env` 文件提交到版本控制
   - 生产环境使用密钥管理服务（如 AWS Secrets Manager）

2. **JWT Secret**
   - 生产环境必须使用强密码
   - 建议使用 32 字符以上的随机字符串
   - 定期轮换密钥

3. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 保护 token 和 API 通信安全

### 性能

1. **会话存储**
   - 当前使用内存存储，适合开发和小规模部署
   - 生产环境建议使用 Redis
   - 定期清理过期会话

2. **并发限制**
   - 根据服务器性能调整速率限制
   - 考虑使用负载均衡

3. **日志管理**
   - 避免记录敏感信息
   - 使用日志聚合服务
   - 定期清理旧日志

### 成本控制

1. **API 调用**
   - 监控各提供商的 API 使用量
   - 设置合理的速率限制
   - 优先使用免费模型进行测试

2. **会话管理**
   - 设置合理的会话过期时间
   - 避免存储过长的对话历史

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Happy Coding! 🎉**
