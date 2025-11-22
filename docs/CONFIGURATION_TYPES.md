# Configuration and Type Definitions

## Overview

This document describes the configuration structure and type definitions implemented for the AI Chat API system.

## Type Definitions

### Core Types (`src/types/chat.ts`)

#### Agent Configuration
```typescript
interface AgentConfig {
  name: string;            // Agent name
  model: string;           // Model name (e.g., "deepseek-chat")
  temperature: number;     // Temperature parameter (0-1)
  systemPrompt: string;    // System prompt
}
```

#### Message Types
```typescript
type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}
```

#### Session Types
```typescript
interface Session {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
```

#### Request/Response Types
- `ChatRequest` - Non-stream chat request
- `StreamChatRequest` - Stream chat request
- `ChatResponse` - Non-stream response with messageId, content, timestamp, model, usage
- `SSEChunk` - SSE data chunk with delta, done, messageId, error

#### Provider Configuration
```typescript
interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  models: string[];
}

interface ProvidersConfig {
  providers: { [providerName: string]: ProviderConfig };
  rateLimits: {
    requestsPerMinute: number;
    maxMessageLength: number;
    maxSystemPromptLength: number;
  };
  session: {
    expirationHours: number;
  };
}
```

#### Error Types
- `ErrorCode` enum - All error codes (MISSING_PARAMETER, INVALID_CONFIG, etc.)
- `ErrorResponse` - Standardized error response structure
- `AppError` class - Custom error class with code and statusCode

## Configuration Service

### ConfigService (`src/services/configService.ts`)

The ConfigService manages AI provider configurations with environment variable support.

#### Key Features:
1. **Configuration Loading**: Loads from `config/ai-providers.json`
2. **Environment Variable Override**: Environment variables take precedence over config file
3. **Validation**: Validates configuration structure on startup
4. **Provider Routing**: Maps models to providers automatically

#### Methods:
- `loadConfig()` - Load and validate configuration
- `getProviderConfig(providerName)` - Get provider configuration
- `getProviderByModel(modelName)` - Get provider name for a model
- `getSupportedModels()` - Get all supported models
- `getRateLimits()` - Get rate limit configuration
- `getSessionConfig()` - Get session configuration

#### Environment Variable Precedence:
1. Direct environment variable (e.g., `DEEPSEEK_API_KEY`)
2. Placeholder in config file (e.g., `${DEEPSEEK_API_KEY}`)
3. Default value in config file

## Utility Functions

### Validation (`src/utils/validation.ts`)
- `validateAgentConfig()` - Validate agent configuration
- `validateMessage()` - Validate message content
- `validateRequiredParams()` - Validate required parameters
- `validateSessionId()` - Validate session ID format
- `validateAgentId()` - Validate agent ID format

### Error Handling (`src/utils/errorHandler.ts`)
- `getStatusCodeForError()` - Map error codes to HTTP status codes
- `sendErrorResponse()` - Send standardized error response
- `createErrorResponse()` - Create error response object
- `asyncHandler()` - Wrap async handlers for error catching

### ID Generation (`src/utils/idGenerator.ts`)
- `generateAgentId()` - Generate unique agent ID
- `generateSessionId()` - Generate unique session ID
- `generateMessageId()` - Generate unique message ID

### Constants (`src/utils/constants.ts`)
- Default configuration values
- Temperature constraints
- HTTP status codes
- SSE headers

### Initialization (`src/utils/initConfig.ts`)
- `initializeConfig()` - Initialize and validate configuration on startup

## Configuration File Structure

### `config/ai-providers.json`
```json
{
  "providers": {
    "deepseek": {
      "baseURL": "https://api.deepseek.com/v1/chat/completions",
      "apiKey": "${DEEPSEEK_API_KEY}",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    },
    "kimi": { ... },
    "qwen": { ... },
    "openrouter": { ... }
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

### `.env` File
```env
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here

DEEPSEEK_API_KEY=sk-xxxxx
KIMI_API_KEY=sk-xxxxx
QWEN_API_KEY=sk-xxxxx
OPENROUTER_API_KEY=sk-xxxxx
```

## Usage Examples

### Loading Configuration
```typescript
import { getConfigService } from './services/configService';

// Initialize on startup
const configService = getConfigService();
configService.loadConfig();

// Get provider for a model
const provider = configService.getProviderByModel('deepseek-chat');
const providerConfig = configService.getProviderConfig(provider);
```

### Validating Agent Config
```typescript
import { validateAgentConfig } from './utils/validation';
import { getConfigService } from './services/configService';

const configService = getConfigService();
const supportedModels = configService.getSupportedModels();
const rateLimits = configService.getRateLimits();

const result = validateAgentConfig(
  agentConfig,
  supportedModels,
  rateLimits.maxSystemPromptLength
);

if (!result.valid) {
  // Handle validation error
  console.error(result.error);
}
```

### Error Handling
```typescript
import { AppError, ErrorCode } from './types/chat';
import { sendErrorResponse } from './utils/errorHandler';

try {
  // Some operation
  throw new AppError(
    ErrorCode.INVALID_MODEL,
    'Model not supported',
    400
  );
} catch (error) {
  sendErrorResponse(res, error);
}
```

## Adding New Providers

To add a new AI provider:

1. Add provider configuration to `config/ai-providers.json`:
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

2. Add API key to `.env`:
```env
NEW_PROVIDER_API_KEY=your_api_key_here
```

3. Restart the service - the new provider will be automatically available

## Type Safety

All types are exported from `src/types/index.ts` for easy importing:

```typescript
import {
  AgentConfig,
  ChatMessage,
  Session,
  ChatRequest,
  ChatResponse,
  ErrorCode,
  AppError
} from './types';
```

## Validation Rules

### AgentConfig Validation
- `name`: Required, non-empty string
- `model`: Required, must be in supported models list
- `temperature`: Required, number between 0 and 1
- `systemPrompt`: Required, max 2000 characters (configurable)

### Message Validation
- Required, non-empty string
- Max 4000 characters (configurable)

### Session/Agent ID Validation
- Required, non-empty string
- Format validation (basic)

## Error Codes

### Client Errors (400)
- `MISSING_PARAMETER` - Required parameter missing
- `INVALID_CONFIG` - Invalid configuration
- `INVALID_MODEL` - Model not supported
- `INVALID_TEMPERATURE` - Temperature out of range
- `MESSAGE_TOO_LONG` - Message exceeds max length
- `SYSTEM_PROMPT_TOO_LONG` - System prompt exceeds max length

### Authentication Errors (401)
- `INVALID_TOKEN` - Invalid JWT token
- `TOKEN_EXPIRED` - JWT token expired

### Authorization Errors (403)
- `FORBIDDEN_SESSION` - User cannot access session

### Rate Limit Errors (429)
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Server Errors (500)
- `CONFIG_MISSING` - Configuration missing or invalid
- `AI_API_ERROR` - AI provider API error
- `DATABASE_ERROR` - Database operation error
- `INTERNAL_ERROR` - Internal server error

## Best Practices

1. **Always validate input** using the validation utilities
2. **Use AppError** for throwing errors with proper error codes
3. **Use asyncHandler** to wrap async route handlers
4. **Load configuration once** on startup using singleton pattern
5. **Never log API keys** in error messages or logs
6. **Use environment variables** for sensitive configuration
7. **Validate configuration** on startup to fail fast
