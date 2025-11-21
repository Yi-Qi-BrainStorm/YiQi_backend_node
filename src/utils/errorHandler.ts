/**
 * Error Handler Utilities
 * Centralized error handling and response formatting
 */

import { Response } from 'express';
import { AppError, ErrorCode, ErrorResponse } from '../types/chat';
import { HTTP_STATUS } from './constants';

/**
 * Map error codes to HTTP status codes
 */
export function getStatusCodeForError(errorCode: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    // 400 - Client Errors
    [ErrorCode.MISSING_PARAMETER]: HTTP_STATUS.BAD_REQUEST,
    [ErrorCode.INVALID_CONFIG]: HTTP_STATUS.BAD_REQUEST,
    [ErrorCode.INVALID_MODEL]: HTTP_STATUS.BAD_REQUEST,
    [ErrorCode.INVALID_TEMPERATURE]: HTTP_STATUS.BAD_REQUEST,
    [ErrorCode.MESSAGE_TOO_LONG]: HTTP_STATUS.BAD_REQUEST,
    [ErrorCode.SYSTEM_PROMPT_TOO_LONG]: HTTP_STATUS.BAD_REQUEST,
    
    // 401 - Authentication Errors
    [ErrorCode.INVALID_TOKEN]: HTTP_STATUS.UNAUTHORIZED,
    [ErrorCode.TOKEN_EXPIRED]: HTTP_STATUS.UNAUTHORIZED,
    
    // 403 - Authorization Errors
    [ErrorCode.FORBIDDEN_SESSION]: HTTP_STATUS.FORBIDDEN,
    
    // 429 - Rate Limit Errors
    [ErrorCode.RATE_LIMIT_EXCEEDED]: HTTP_STATUS.TOO_MANY_REQUESTS,
    
    // 500 - Server Errors
    [ErrorCode.CONFIG_MISSING]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    [ErrorCode.AI_API_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    [ErrorCode.DATABASE_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    [ErrorCode.INTERNAL_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };

  return statusMap[errorCode] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

/**
 * Send error response
 */
export function sendErrorResponse(
  res: Response,
  error: AppError | Error,
  defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR
): void {
  let errorCode: ErrorCode;
  let errorMessage: string;
  let statusCode: number;

  if (error instanceof AppError) {
    errorCode = error.code;
    errorMessage = error.message;
    statusCode = error.statusCode;
  } else {
    errorCode = defaultCode;
    errorMessage = error.message || 'An unexpected error occurred';
    statusCode = getStatusCodeForError(defaultCode);
  }

  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message: errorMessage
    }
  };

  // Log error (but don't log sensitive information like API keys)
  console.error(`[Error] ${errorCode}: ${errorMessage}`);
  if (statusCode >= 500) {
    console.error(error.stack);
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(code: ErrorCode, message: string): ErrorResponse {
  return {
    error: {
      code,
      message
    }
  };
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: any, res: Response, next?: any) => Promise<any>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      sendErrorResponse(res, error);
    });
  };
}
