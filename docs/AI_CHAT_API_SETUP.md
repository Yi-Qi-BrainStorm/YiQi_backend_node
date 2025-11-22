# AI Chat API 配置指南

## 📋 概述

本项目实现了一个支持多个 AI 模型提供商的聊天 API 服务，支持流式和非流式两种对话模式。

## 🔧 配置步骤

### 1. 安装依赖

首先需要安装 dotenv 包来支持环境变量加载：

```bash
pnpm add dotenv
```

### 2. 配置 API Keys

项目需要 4 个 AI 提供商的 API Keys：

#### DeepSeek
- 官网：https://platform.deepseek.com/
- 注册并获取 API Key
- 支持模型：
  - `deepseek-chat` - 非思考模式
  - `deepseek-reasoner` - 思考模式

#### Kimi (Moonshot)
- 官网：https://platform.moonshot.cn/
- 注册并获取 API Key
- 支持模型：
  - `kimi-k2-0905-preview`
  - `kimi-k2-turbo-preview`
  - `kimi-k2-thinking-turbo`
  - `kimi-latest`

#### Qwen (通过 SiliconFlow)
- 官网：https://siliconflow.cn/
- 注册并获取 API Key
- 支持模型：
  - `Qwen/QwQ-32B`
  - `Qwen/Qwen3-235B-A22B-Instruct-2507`

#### OpenRouter (免费模型)
- 官网：https://openrouter.ai/
- 注册并获取 API Key
- 支持模型：
  - `z-ai/glm-4.5-air:free`
  - `tngtech/deepseek-r1t2-chimera:free`
  - `deepseek/deepseek-chat-v3-0324:free`
  - `meta-llama/llama-3.3-70b-instruct:free`

### 3. 填写环境变量

编辑项目根目录的 `.env` 文件，填入你获取的 API Keys：

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Secret (用于用户认证)
JWT_SECRET=your_jwt_secret_here_change_in_production

# AI Provider API Keys
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

**重要提示**：
- 请将 `JWT_SECRET` 修改为一个强密码（生产环境必须）
- 不要将 `.env` 文件提交到 Git 仓库
- `.env` 文件已在 `.gitignore` 中

### 4. 配置文件说明

配置文件位于 `config/ai-providers.json`，包含：

```json
{
  "providers": {
    "deepseek": {
      "baseURL": "https://api.deepseek.com/v1/chat/completions",
      "apiKey": "${DEEPSEEK_API_KEY}",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    },
    // ... 其他提供商
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

**配置说明**：
- `baseURL`: AI 提供商的 API 端点
- `apiKey`: 使用 `${ENV_VAR}` 格式引用环境变量
- `models`: 该提供商支持的模型列表
- `rateLimits`: 速率限制配置
- `session`: 会话过期时间配置

## 🚀 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

服务将在 `http://localhost:8080` 启动。

## 📡 API 使用示例

### 1. 非流式对话

```bash
curl -X POST http://localhost:8080/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "agent_123",
    "sessionId": "session_456",
    "message": "你好",
    "agentConfig": {
      "name": "AI助手",
      "model": "deepseek-chat",
      "temperature": 0.7,
      "systemPrompt": "你是一个友好的AI助手"
    },
    "stream": false
  }'
```

### 2. 流式对话 (SSE)

```bash
curl -N "http://localhost:8080/api/chat/stream?agentId=agent_123&sessionId=session_456&message=你好&agentConfig=%7B%22name%22%3A%22AI%E5%8A%A9%E6%89%8B%22%2C%22model%22%3A%22deepseek-chat%22%2C%22temperature%22%3A0.7%2C%22systemPrompt%22%3A%22%E4%BD%A0%E6%98%AF%E4%B8%80%E4%B8%AA%E5%8F%8B%E5%A5%BD%E7%9A%84AI%E5%8A%A9%E6%89%8B%22%7D" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 支持的模型列表

| 提供商 | 模型名称 | 说明 |
|--------|---------|------|
| DeepSeek | `deepseek-chat` | 非思考模式 |
| DeepSeek | `deepseek-reasoner` | 思考模式 |
| Kimi | `kimi-k2-0905-preview` | K2 标准版 |
| Kimi | `kimi-k2-turbo-preview` | K2 高速版 |
| Kimi | `kimi-k2-thinking-turbo` | K2 思考高速版 |
| Kimi | `kimi-latest` | 最新版本 |
| Qwen | `Qwen/QwQ-32B` | 推理模型 |
| Qwen | `Qwen/Qwen3-235B-A22B-Instruct-2507` | 旗舰模型 |
| OpenRouter | `z-ai/glm-4.5-air:free` | GLM-4.5 免费版 |
| OpenRouter | `tngtech/deepseek-r1t2-chimera:free` | DeepSeek R1 免费版 |
| OpenRouter | `deepseek/deepseek-chat-v3-0324:free` | DeepSeek V3 免费版 |
| OpenRouter | `meta-llama/llama-3.3-70b-instruct:free` | Llama 3.3 免费版 |

## 🛠️ 添加新的模型提供商

如果需要添加新的 AI 提供商：

1. 在 `config/ai-providers.json` 中添加新的提供商配置：

```json
{
  "providers": {
    "new-provider": {
      "baseURL": "https://api.new-provider.com/v1/chat/completions",
      "apiKey": "${NEW_PROVIDER_API_KEY}",
      "models": ["model-1", "model-2"]
    }
  }
}
```

2. 在 `.env` 文件中添加对应的 API Key：

```env
NEW_PROVIDER_API_KEY=your_api_key_here
```

3. 重启服务，新模型将自动可用

## ⚠️ 注意事项

1. **API Key 安全**
   - 不要在代码中硬编码 API Key
   - 不要将 `.env` 文件提交到版本控制
   - 生产环境使用密钥管理服务

2. **速率限制**
   - 默认限制：每分钟 10 次请求
   - 可在 `config/ai-providers.json` 中调整

3. **消息长度限制**
   - 用户消息：最大 4000 字符
   - 系统提示词：最大 2000 字符

4. **会话管理**
   - 会话默认 24 小时后过期
   - 当前使用内存存储，重启服务会丢失会话
   - 生产环境建议使用 Redis

## 🐛 故障排查

### 问题：启动时报错 "Missing API Key"

**解决方案**：
- 检查 `.env` 文件是否存在
- 确认所有 API Key 都已填写
- 确认环境变量名称正确

### 问题：调用 API 返回 401 错误

**解决方案**：
- 检查 JWT token 是否有效
- 确认 Authorization 头格式正确：`Bearer YOUR_TOKEN`

### 问题：调用 API 返回 400 "INVALID_MODEL"

**解决方案**：
- 检查模型名称是否正确
- 确认该模型在 `config/ai-providers.json` 中已配置
- 查看支持的模型列表

### 问题：AI 响应很慢或超时

**解决方案**：
- 检查网络连接
- 确认 AI 提供商服务状态
- 尝试使用其他模型

## 📚 相关文档

- [API 对接文档](./API_INTEGRATION.md)
- [架构设计文档](../.kiro/specs/ai-chat-api/design.md)
- [需求文档](../.kiro/specs/ai-chat-api/requirements.md)

## 🤝 技术支持

如有问题，请查看：
- DeepSeek 文档：https://platform.deepseek.com/docs
- Kimi 文档：https://platform.moonshot.cn/docs
- SiliconFlow 文档：https://docs.siliconflow.cn/
- OpenRouter 文档：https://openrouter.ai/docs
