# SSE 认证实现说明

## 问题背景

在使用 Server-Sent Events (SSE) 进行流式聊天时，遇到了 401 Unauthorized 错误。

### 根本原因

EventSource API 的限制：
- ❌ 不支持自定义请求头（无法添加 `Authorization` 头）
- ❌ 只支持 GET 请求
- ❌ 无法通过 `new EventSource(url, { headers: {...} })` 添加头部

这导致 SSE 请求无法携带 JWT token，后端认证失败。

## 解决方案

### 后端修改（已完成）✅

修改了 `src/middleware/authMiddleware.ts`，使其支持从两个位置读取 token：

1. **Authorization 头**（用于 POST 请求）
   ```
   Authorization: Bearer <token>
   ```

2. **URL 查询参数**（用于 SSE GET 请求）
   ```
   /api/chat/stream?token=<token>&...
   ```

#### 实现细节

```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  // 1. 优先从 Authorization 头获取（POST 请求）
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. 如果没有，从 URL 参数获取（SSE GET 请求）
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  // 3. 验证 token
  if (!token) {
    return res.status(401).json({
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Missing authentication token'
      }
    });
  }

  // ... 验证逻辑
};
```

### 前端修改（需要确认）

前端需要在 SSE 请求的 URL 中添加 token 参数：

```typescript
// 获取 token
const token = localStorage.getItem('auth_token');

// 构建 URL 参数
const params = new URLSearchParams({
  agentId: request.agentId,
  sessionId: request.sessionId,
  message: request.message,
  agentConfig: JSON.stringify(request.agentConfig),
});

// ✅ 添加 token 到 URL 参数
if (token) {
  params.append('token', token);
}

// 创建 EventSource
const eventSource = new EventSource(
  `/api/chat/stream?${params.toString()}`
);
```

## 测试覆盖

新增了以下测试用例：

1. ✅ 从 URL 查询参数读取有效 token
2. ✅ Authorization 头优先于查询参数
3. ✅ 查询参数中的无效 token 返回 401

所有测试通过：**46/46 passed**

## 安全性考虑

### URL 参数传递 Token 的风险

⚠️ **潜在风险**：
- Token 会出现在 URL 中，可能被记录在服务器日志、浏览器历史等
- 相比 HTTP 头，URL 参数更容易被泄露

✅ **缓解措施**：
1. **使用 HTTPS**：确保传输加密
2. **短期 Token**：设置较短的 token 过期时间
3. **日志过滤**：配置服务器不记录包含 token 的 URL
4. **仅用于 SSE**：POST 请求仍使用 Authorization 头

### 推荐配置

```typescript
// JWT token 配置
{
  expiresIn: '1h',  // 短期过期
  algorithm: 'HS256'
}
```

## API 使用示例

### POST 请求（非流式）

```bash
curl -X POST http://localhost:8080/api/chat/send \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_123",
    "sessionId": "session_456",
    "message": "你好",
    "agentConfig": {...}
  }'
```

### GET 请求（SSE 流式）

```bash
curl -N http://localhost:8080/api/chat/stream?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&agentId=agent_123&sessionId=session_456&message=你好&agentConfig=%7B...%7D
```

## 调试技巧

### 1. 检查 token 是否正确传递

```typescript
// 在 authMiddleware 中添加日志
console.log('Token from header:', authHeader);
console.log('Token from query:', req.query.token);
```

### 2. 验证 token 有效性

```bash
# 使用 jwt.io 解码 token
# 检查 exp (过期时间) 字段
```

### 3. 测试 SSE 连接

```javascript
const eventSource = new EventSource('/api/chat/stream?token=YOUR_TOKEN&...');

eventSource.onopen = () => {
  console.log('✅ SSE 连接成功');
};

eventSource.onerror = (error) => {
  console.error('❌ SSE 连接失败:', error);
};
```

## 备选方案

如果安全性要求更高，可以考虑使用 `fetch` + `ReadableStream` 替代 EventSource：

```typescript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // 处理 SSE 数据
}
```

这种方式可以使用 Authorization 头，但需要手动处理 SSE 协议。

## 总结

✅ **已完成**：
- 后端认证中间件支持 URL 参数 token
- 添加了完整的测试覆盖
- 所有测试通过（46/46）
- TypeScript 编译成功

📋 **待确认**：
- 前端是否已添加 token 到 URL 参数
- 测试 SSE 连接是否正常工作

🔒 **安全建议**：
- 使用 HTTPS
- 设置短期 token 过期时间
- 配置日志过滤，避免记录 token
