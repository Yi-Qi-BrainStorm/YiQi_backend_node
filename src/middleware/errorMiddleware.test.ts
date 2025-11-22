/**
 * Error Middleware Tests
 * Tests for global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from './errorMiddleware';
import { AppError, ErrorCode } from '../types/chat';
import { HTTP_STATUS } from '../utils/constants';

// Mock console methods to avoid cluttering test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      method: 'POST',
      path: '/api/test',
      userId: 'test-user-123'
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
    
    mockNext = jest.fn();
    
    // Clear mock calls
    jest.clearAllMocks();
  });

  test('should handle AppError with correct status code and error response', () => {
    const error = new AppError(
      ErrorCode.INVALID_CONFIG,
      'Invalid configuration provided',
      HTTP_STATUS.BAD_REQUEST
    );

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_CONFIG,
        message: 'Invalid configuration provided'
      }
    });
  });

  test('should handle generic Error as internal server error', () => {
    const error = new Error('Something went wrong');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred'
      }
    });
  });

  test('should handle ValidationError as bad request', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_CONFIG,
        message: 'Validation failed'
      }
    });
  });

  test('should handle SyntaxError (JSON parsing) as bad request', () => {
    const error = new SyntaxError('Unexpected token in JSON');
    (error as any).body = true; // Mark as body parsing error

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_CONFIG,
        message: 'Invalid JSON in request body'
      }
    });
  });

  test('should handle UnauthorizedError as unauthorized', () => {
    const error = new Error('Token expired');
    error.name = 'UnauthorizedError';

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid or expired token'
      }
    });
  });

  test('should log client errors (4xx) with warn level', () => {
    const error = new AppError(
      ErrorCode.MISSING_PARAMETER,
      'Missing required parameter',
      HTTP_STATUS.BAD_REQUEST
    );

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(console.warn).toHaveBeenCalled();
  });

  test('should log server errors (5xx) with error level and stack trace', () => {
    const error = new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(console.error).toHaveBeenCalled();
  });

  test('should sanitize API keys in error messages', () => {
    const error = new Error('API call failed with Bearer abc123xyz');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify the error was logged (sanitization happens in logging)
    expect(console.error).toHaveBeenCalled();
    
    // Verify response doesn't contain sensitive info
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred'
      }
    });
  });

  test('should handle errors for anonymous users', () => {
    mockRequest.userId = undefined;
    
    const error = new AppError(
      ErrorCode.INVALID_TOKEN,
      'Token required',
      HTTP_STATUS.UNAUTHORIZED
    );

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Token required'
      }
    });
  });
});

describe('notFoundHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      method: 'GET',
      path: '/api/nonexistent'
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
  });

  test('should return 404 with appropriate error message', () => {
    notFoundHandler(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Route GET /api/nonexistent not found'
      }
    });
  });

  test('should handle POST requests', () => {
    const postRequest = {
      method: 'POST',
      path: '/api/unknown'
    };

    notFoundHandler(
      postRequest as Request,
      mockResponse as Response
    );

    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Route POST /api/unknown not found'
      }
    });
  });
});
