/**
 * Validation Utilities
 * Helper functions for validating requests and configurations
 */

import { AgentConfig, ErrorCode, ValidationResult } from '../types/chat';
import { 
  MIN_TEMPERATURE, 
  MAX_TEMPERATURE,
  DEFAULT_MAX_MESSAGE_LENGTH,
  DEFAULT_MAX_SYSTEM_PROMPT_LENGTH 
} from './constants';

/**
 * Validate AgentConfig structure and values
 */
export function validateAgentConfig(
  config: AgentConfig,
  supportedModels: string[],
  maxSystemPromptLength: number = DEFAULT_MAX_SYSTEM_PROMPT_LENGTH
): ValidationResult {
  // Check if config exists
  if (!config) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_CONFIG,
        message: 'AgentConfig is required'
      }
    };
  }

  // Validate name
  if (!config.name || typeof config.name !== 'string' || config.name.trim().length === 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_CONFIG,
        message: 'Agent name is required and must be a non-empty string'
      }
    };
  }

  // Validate model
  if (!config.model || typeof config.model !== 'string') {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_MODEL,
        message: 'Model is required and must be a string'
      }
    };
  }

  if (!supportedModels.includes(config.model)) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_MODEL,
        message: `Model "${config.model}" is not supported. Supported models: ${supportedModels.join(', ')}`
      }
    };
  }

  // Validate temperature
  if (typeof config.temperature !== 'number') {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_TEMPERATURE,
        message: 'Temperature must be a number'
      }
    };
  }

  if (config.temperature < MIN_TEMPERATURE || config.temperature > MAX_TEMPERATURE) {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_TEMPERATURE,
        message: `Temperature must be between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}`
      }
    };
  }

  // Validate systemPrompt
  if (!config.systemPrompt || typeof config.systemPrompt !== 'string') {
    return {
      valid: false,
      error: {
        code: ErrorCode.INVALID_CONFIG,
        message: 'System prompt is required and must be a string'
      }
    };
  }

  if (config.systemPrompt.length > maxSystemPromptLength) {
    return {
      valid: false,
      error: {
        code: ErrorCode.SYSTEM_PROMPT_TOO_LONG,
        message: `System prompt exceeds maximum length of ${maxSystemPromptLength} characters`
      }
    };
  }

  return { valid: true };
}

/**
 * Validate message content
 */
export function validateMessage(
  message: string,
  maxLength: number = DEFAULT_MAX_MESSAGE_LENGTH
): ValidationResult {
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: {
        code: ErrorCode.MISSING_PARAMETER,
        message: 'Message is required and must be a string'
      }
    };
  }

  if (message.trim().length === 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.MISSING_PARAMETER,
        message: 'Message cannot be empty'
      }
    };
  }

  if (message.length > maxLength) {
    return {
      valid: false,
      error: {
        code: ErrorCode.MESSAGE_TOO_LONG,
        message: `Message exceeds maximum length of ${maxLength} characters`
      }
    };
  }

  return { valid: true };
}

/**
 * Validate required parameters
 */
export function validateRequiredParams(params: Record<string, any>, requiredFields: string[]): ValidationResult {
  for (const field of requiredFields) {
    if (params[field] === undefined || params[field] === null) {
      return {
        valid: false,
        error: {
          code: ErrorCode.MISSING_PARAMETER,
          message: `Required parameter "${field}" is missing`
        }
      };
    }
  }

  return { valid: true };
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): ValidationResult {
  if (!sessionId || typeof sessionId !== 'string') {
    return {
      valid: false,
      error: {
        code: ErrorCode.MISSING_PARAMETER,
        message: 'Session ID is required and must be a string'
      }
    };
  }

  // Basic format validation (can be enhanced based on actual format requirements)
  if (sessionId.trim().length === 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.MISSING_PARAMETER,
        message: 'Session ID cannot be empty'
      }
    };
  }

  return { valid: true };
}

/**
 * Validate agent ID format
 */
export function validateAgentId(agentId: string): ValidationResult {
  if (!agentId || typeof agentId !== 'string') {
    return {
      valid: false,
      error: {
        code: ErrorCode.MISSING_PARAMETER,
        message: 'Agent ID is required and must be a string'
      }
    };
  }

  if (agentId.trim().length === 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.MISSING_PARAMETER,
        message: 'Agent ID cannot be empty'
      }
    };
  }

  return { valid: true };
}
