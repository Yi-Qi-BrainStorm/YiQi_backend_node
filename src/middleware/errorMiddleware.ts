/**
 * Global Error Handling Middleware
 * Handles all errors in the application and returns standardized responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode, ErrorResponse } from '../types/chat';
import { getStatusCodeForError } from '../utils/errorHandler';
import { HTTP_STATUS } from '../utils/constants';

/**
 * Sanitize error message to remove sensitive information
 * Removes API keys, tokens, and other sensitive data from error messages
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential API keys (patterns like "Bearer xxx", "apiKey: xxx", etc.)
  let sanitized = message.replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]');
  sanitized = sanitized.replace(/apiKey[:\s]+[\w-]+/gi, 'apiKey: [REDACTED]');
  sanitized = sanitized.replace(/api[_-]?key[:\s]+[\w-]+/gi, 'api_key: [REDACTED]');
  sanitized = sanitized.replace(/token[:\s]+[\w-]+/gi, 'token: [REDACTED]');
  sanitized = sanitized.replace(/password[:\s]+[\w-]+/gi, 'password: [REDACTED]');
  
  return sanitized;
}

/**
 * Sanitize error stack to remove sensitive information
 */
function sanitizeErrorStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return sanitizeErrorMessage(stack);
}

/**
 * Log error with appropriate detail level based on status code
 */
function logError(error: Error | AppError, statusCode: number, req: Request): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const userId = (req as any).userId || 'anonymous';
  
  // Sanitize error message and stack
  const sanitizedMessage = sanitizeErrorMessage(error.message);
  const sanitizedStack = sanitizeErrorStack(error.stack);
  
  // Basic error info (always logged)
  const errorInfo = {
    timestamp,
    method,
    path,
    userId,
    statusCode,
    errorName: error.name,
    errorMessage: sanitizedMessage,
  };
  
  if (statusCode >= 500) {
    // Server errors - log with full details
    console.error('[ERROR] Server Error:', {
      ...errorInfo,
      errorCode: error instanceof AppError ? error.code : 'UNKNOWN',
      stack: sanitizedStack,
    });
  } else if (statusCode >= 400) {
    // Client errors - log with less detail
    console.warn('[WARN] Client Error:', errorInfo);
  } else {
    // Other errors
    console.log('[INFO] Error:', errorInfo);
  }
}

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Determine error code and status
  let errorCode: ErrorCode;
  let errorMessage: string;
  let statusCode: number;
  
  if (error instanceof AppError) {
    // Known application error
    errorCode = error.code;
    errorMessage = error.message;
    statusCode = error.statusCode;
  } else if (error.name === 'ValidationError') {
    // Validation errors
    errorCode = ErrorCode.INVALID_CONFIG;
    errorMessage = error.message;
    statusCode = HTTP_STATUS.BAD_REQUEST;
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON parsing errors
    errorCode = ErrorCode.INVALID_CONFIG;
    errorMessage = 'Invalid JSON in request body';
    statusCode = HTTP_STATUS.BAD_REQUEST;
  } else if (error.name === 'UnauthorizedError') {
    // JWT authentication errors
    errorCode = ErrorCode.INVALID_TOKEN;
    errorMessage = 'Invalid or expired token';
    statusCode = HTTP_STATUS.UNAUTHORIZED;
  } else {
    // Unknown errors
    errorCode = ErrorCode.INTERNAL_ERROR;
    errorMessage = 'An unexpected error occurred';
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
  
  // Log the error
  logError(error, statusCode, req);
  
  // Send standardized error response
  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message: errorMessage
    }
  };
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 Not Found errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: `Route ${req.method} ${req.path} not found`
    }
  };
  
  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
}

/**
 * Setup global error handlers for uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('[FATAL] Uncaught Exception:', {
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: sanitizeErrorMessage(error.message),
      stack: sanitizeErrorStack(error.stack),
    });
    
    // Give time for logs to flush, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const errorMessage = reason instanceof Error 
      ? sanitizeErrorMessage(reason.message)
      : String(reason);
    
    const stack = reason instanceof Error 
      ? sanitizeErrorStack(reason.stack)
      : undefined;
    
    console.error('[FATAL] Unhandled Promise Rejection:', {
      timestamp: new Date().toISOString(),
      reason: errorMessage,
      stack,
    });
    
    // Give time for logs to flush, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    console.log('[INFO] SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });
  
  // Handle SIGINT gracefully
  process.on('SIGINT', () => {
    console.log('[INFO] SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}
