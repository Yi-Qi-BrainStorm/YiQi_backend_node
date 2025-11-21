/**
 * AI Chat API Type Definitions
 * Comprehensive type definitions for the chat system
 */

// ============================================================================
// Agent Configuration Types
// ============================================================================

/**
 * Agent configuration passed from frontend on each request
 */
export interface AgentConfig {
  name: string;            // Agent name
  model: string;           // Model name (e.g., "deepseek-chat")
  temperature: number;     // Temperature parameter (0-1)
  systemPrompt: string;    // System prompt
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Chat message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Chat session containing message history
 */
export interface Session {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Non-stream chat request
 */
export interface ChatRequest {
  agentId: string;
  sessionId: string;
  message: string;
  agentConfig: AgentConfig;
  stream: false;
}

/**
 * Stream chat request (via SSE)
 */
export interface StreamChatRequest {
  agentId: string;
  sessionId: string;
  message: string;
  agentConfig: AgentConfig;
  stream: true;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Non-stream chat response
 */
export interface ChatResponse {
  messageId: string;
  content: string;
  timestamp: number;
  model: string;
  usage?: TokenUsage;
}

/**
 * SSE chunk data structure
 */
export interface SSEChunk {
  delta: string;
  done: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Provider Configuration Types
// ============================================================================

/**
 * AI provider configuration
 */
export interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  models: string[];
}

/**
 * Complete providers configuration structure
 */
export interface ProvidersConfig {
  providers: {
    [providerName: string]: ProviderConfig;
  };
  rateLimits: {
    requestsPerMinute: number;
    maxMessageLength: number;
    maxSystemPromptLength: number;
  };
  session: {
    expirationHours: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for the system
 */
export enum ErrorCode {
  // 400 - Client Errors
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_MODEL = 'INVALID_MODEL',
  INVALID_TEMPERATURE = 'INVALID_TEMPERATURE',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  SYSTEM_PROMPT_TOO_LONG = 'SYSTEM_PROMPT_TOO_LONG',
  
  // 401 - Authentication Errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 403 - Authorization Errors
  FORBIDDEN_SESSION = 'FORBIDDEN_SESSION',
  
  // 429 - Rate Limit Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 500 - Server Errors
  CONFIG_MISSING = 'CONFIG_MISSING',
  AI_API_ERROR = 'AI_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: {
    code: ErrorCode;
    message: string;
  };
}

// ============================================================================
// AI Provider Interface Types
// ============================================================================

/**
 * AI Provider interface for implementing different providers
 */
export interface AIProvider {
  /**
   * Non-stream chat completion
   */
  chat(messages: ChatMessage[], config: AgentConfig): Promise<string>;
  
  /**
   * Stream chat completion
   */
  chatStream(
    messages: ChatMessage[],
    config: AgentConfig,
    onChunk: (text: string) => void
  ): Promise<void>;
}

// ============================================================================
// Express Request Extension Types
// ============================================================================

/**
 * Extended Express Request with user information
 */
export interface AuthenticatedRequest {
  userId?: string;
  user?: {
    id: string;
    username: string;
  };
}
