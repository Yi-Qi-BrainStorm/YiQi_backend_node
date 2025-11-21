/**
 * Chat Service
 * Core business logic for handling chat messages and AI interactions
 */

import {
  AgentConfig,
  ChatMessage,
  ChatResponse,
  SSEChunk,
  ValidationResult,
  ErrorCode,
  AppError
} from '../types/chat';
import { getAIProviderService } from './aiProviderService';
import { getSessionService } from './sessionService';
import { getConfigService } from './configService';
import { generateMessageId } from '../utils/idGenerator';

export class ChatService {
  private aiProviderService = getAIProviderService();
  private sessionService = getSessionService();
  private configService = getConfigService();

  /**
   * Validate Agent configuration
   * Checks model support, temperature range, and systemPrompt length
   */
  public validateAgentConfig(config: AgentConfig): ValidationResult {
    // Check if model is supported
    if (!this.aiProviderService.isModelSupported(config.model)) {
      return {
        valid: false,
        error: {
          code: ErrorCode.INVALID_MODEL,
          message: `Model ${config.model} is not supported`
        }
      };
    }

    // Check temperature range (0-1)
    if (config.temperature < 0 || config.temperature > 1) {
      return {
        valid: false,
        error: {
          code: ErrorCode.INVALID_TEMPERATURE,
          message: `Temperature must be between 0 and 1, got ${config.temperature}`
        }
      };
    }

    // Check systemPrompt length
    const rateLimits = this.configService.getRateLimits();
    if (config.systemPrompt.length > rateLimits.maxSystemPromptLength) {
      return {
        valid: false,
        error: {
          code: ErrorCode.SYSTEM_PROMPT_TOO_LONG,
          message: `System prompt exceeds maximum length of ${rateLimits.maxSystemPromptLength} characters`
        }
      };
    }

    return { valid: true };
  }

  /**
   * Send non-stream message
   * Retrieves session, builds message array, calls AI provider, saves response
   */
  public async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    agentConfig: AgentConfig
  ): Promise<ChatResponse> {
    // Validate agent config
    const validation = this.validateAgentConfig(agentConfig);
    if (!validation.valid) {
      throw new AppError(
        validation.error!.code,
        validation.error!.message,
        400
      );
    }

    // Validate message length
    const rateLimits = this.configService.getRateLimits();
    if (message.length > rateLimits.maxMessageLength) {
      throw new AppError(
        ErrorCode.MESSAGE_TOO_LONG,
        `Message exceeds maximum length of ${rateLimits.maxMessageLength} characters`,
        400
      );
    }

    // Get or create session
    let session = this.sessionService.getSession(sessionId);
    if (!session) {
      session = this.sessionService.createSession(sessionId, userId);
    }

    // Build message array: system prompt, then history, then current user message
    const messages: ChatMessage[] = [];
    
    // Add system prompt
    if (agentConfig.systemPrompt) {
      messages.push({
        role: 'system',
        content: agentConfig.systemPrompt,
        timestamp: Date.now()
      });
    }

    // Add history messages
    messages.push(...session.messages);

    // Add current user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    messages.push(userMessage);

    try {
      // Get AI provider and call chat API
      const provider = this.aiProviderService.getProvider(agentConfig.model);
      const aiResponse = await provider.chat(messages, agentConfig);

      // Generate message ID and timestamp
      const messageId = generateMessageId();
      const timestamp = Date.now();

      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp
      };

      // Save both user and assistant messages to session
      this.sessionService.addMessage(sessionId, userMessage);
      this.sessionService.addMessage(sessionId, assistantMessage);

      // Return response
      return {
        messageId,
        content: aiResponse,
        timestamp,
        model: agentConfig.model
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.AI_API_ERROR,
        `Failed to send message: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Send stream message via SSE
   * Retrieves session, builds message array, calls AI provider stream, emits chunks
   */
  public async streamMessage(
    userId: string,
    sessionId: string,
    message: string,
    agentConfig: AgentConfig,
    onChunk: (chunk: SSEChunk) => void
  ): Promise<void> {
    // Validate agent config
    const validation = this.validateAgentConfig(agentConfig);
    if (!validation.valid) {
      throw new AppError(
        validation.error!.code,
        validation.error!.message,
        400
      );
    }

    // Validate message length
    const rateLimits = this.configService.getRateLimits();
    if (message.length > rateLimits.maxMessageLength) {
      throw new AppError(
        ErrorCode.MESSAGE_TOO_LONG,
        `Message exceeds maximum length of ${rateLimits.maxMessageLength} characters`,
        400
      );
    }

    // Get or create session
    let session = this.sessionService.getSession(sessionId);
    if (!session) {
      session = this.sessionService.createSession(sessionId, userId);
    }

    // Build message array: system prompt, then history, then current user message
    const messages: ChatMessage[] = [];
    
    // Add system prompt
    if (agentConfig.systemPrompt) {
      messages.push({
        role: 'system',
        content: agentConfig.systemPrompt,
        timestamp: Date.now()
      });
    }

    // Add history messages
    messages.push(...session.messages);

    // Add current user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    messages.push(userMessage);

    // Generate message ID
    const messageId = generateMessageId();
    let fullResponse = '';

    try {
      // Get AI provider and call stream API
      const provider = this.aiProviderService.getProvider(agentConfig.model);
      
      await provider.chatStream(messages, agentConfig, (delta: string) => {
        fullResponse += delta;
        
        // Emit chunk
        onChunk({
          delta,
          done: false,
          messageId
        });
      });

      // Emit final chunk
      onChunk({
        delta: '',
        done: true,
        messageId
      });

      // Save both user and assistant messages to session
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      };

      this.sessionService.addMessage(sessionId, userMessage);
      this.sessionService.addMessage(sessionId, assistantMessage);
    } catch (error) {
      // Emit error chunk
      const errorMessage = error instanceof AppError 
        ? error.message 
        : `Failed to stream message: ${(error as Error).message}`;
      
      onChunk({
        delta: '',
        done: true,
        error: errorMessage
      });

      throw error;
    }
  }
}

// Singleton instance
let chatServiceInstance: ChatService | null = null;

/**
 * Get singleton instance of ChatService
 */
export function getChatService(): ChatService {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService();
  }
  return chatServiceInstance;
}
