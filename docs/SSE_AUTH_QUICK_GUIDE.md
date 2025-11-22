# SSE 认证快速指南

## 🎯 问题

EventSource 不支持自定义请求头，导致 SSE 请求无法携带 JWT token，返回 401 错误。

## ✅ 解决方案

后端现在支持从 **URL 查询参数** 读取 token（专为 SSE 设计）。

## 📝 前端使用方法

### 方式 1：POST 请求（非流式）- 使用 Authorization 头

```typescript
const response = await fetch('/api/chat/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: 'agent_123',
    sessionId: 'session_456',
    message: '你好',
    agentConfig: {...}
  })
});
```

### 方式 2：GET 请求（SSE 流式）- 使用 URL 参数

```typescript
// 1. 获取 token
const token = localStorage.getItem('auth_token');

// 2. 构建 URL 参数
const params = new URLSearchParams({
  agentId: request.agentId,
  sessionId: request.sessionId,
  message: request.message,
  agentConfig: JSON.stringify(request.agentConfig),
  token: token  // ✅ 添加 token
});

// 3. 创建 EventSource
const eventSource = new EventSource(
  `/api/chat/stream?${params.toString()}`
);

// 4. 监听事件
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

eventSource.onerror = (error) => {
  console.error('连接错误:', error);
  eventSource.close();
};
```

## 🔧 后端实现

认证中间件会按以下顺序查找 token：

1. **Authorization 头** → `Bearer <token>`
2. **URL 参数** → `?token=<token>`

```typescript
// src/middleware/authMiddleware.ts
export const authMiddleware = (req, res, next) => {
  let token;
  
  // 1. 从 Authorization 头获取
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }
  
  // 2. 从 URL 参数获取
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  // 3. 验证 token
  // ...
};
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 测试结果：46/46 passed ✅
```

## 🔒 安全提示

1. **使用 HTTPS**：确保 token 传输加密
2. **短期过期**：设置 token 有效期为 1 小时或更短
3. **仅用于 SSE**：POST 请求继续使用 Authorization 头

## 📊 完整示例

```typescript
// chatService.ts
export async function streamChat(request: ChatRequest) {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('未登录');
  }
  
  const params = new URLSearchParams({
    agentId: request.agentId,
    sessionId: request.sessionId,
    message: request.message,
    agentConfig: JSON.stringify(request.agentConfig),
    token: token
  });
  
  const eventSource = new EventSource(
    `${API_BASE_URL}/api/chat/stream?${params.toString()}`
  );
  
  return new Promise((resolve, reject) => {
    let fullContent = '';
    
    eventSource.onmessage = (event) => {
      const chunk = JSON.parse(event.data);
      
      if (chunk.error) {
        eventSource.close();
        reject(new Error(chunk.error));
        return;
      }
      
      if (chunk.done) {
        eventSource.close();
        resolve(fullContent);
        return;
      }
      
      fullContent += chunk.delta;
      // 触发 UI 更新
      onChunk?.(chunk.delta);
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      reject(error);
    };
  });
}
```

## ❓ 常见问题

### Q: 为什么不在 Authorization 头传递 token？
A: EventSource API 不支持自定义请求头，这是浏览器的限制。

### Q: URL 参数传递 token 安全吗？
A: 在 HTTPS 下是安全的，但建议：
- 使用短期 token
- 配置服务器不记录包含 token 的 URL
- 仅用于 SSE，其他请求使用 Authorization 头

### Q: 如果需要更高安全性怎么办？
A: 可以使用 `fetch` + `ReadableStream` 替代 EventSource，这样可以使用 Authorization 头。

## 📚 相关文档

- [完整实现说明](./SSE_AUTH_IMPLEMENTATION.md)
- [API 文档](./AI_CHAT_API_SETUP.md)
