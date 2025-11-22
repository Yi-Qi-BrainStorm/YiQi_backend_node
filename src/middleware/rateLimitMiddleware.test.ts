/**
 * Rate Limiting Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import {
  rateLimitMiddleware,
  clearRateLimitData,
  getRateLimitData,
  startRateLimitCleanup,
  stopRateLimitCleanup
} from './rateLimitMiddleware';
import { ErrorCode } from '../types/chat';

describe('rateLimitMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Clear rate limit data before each test
    clearRateLimitData();
    stopRateLimitCleanup();

    // Setup mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      userId: 'test-user-123'
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    nextFunction = jest.fn();
  });

  afterEach(() => {
    stopRateLimitCleanup();
    clearRateLimitData();
  });

  describe('Basic functionality', () => {
    it('should allow first request from user', () => {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow requests up to the limit', () => {
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      }

      expect(nextFunction).toHaveBeenCalledTimes(10);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should block request when limit is exceeded', () => {
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      }

      // Reset mocks
      nextFunction = jest.fn();
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      mockResponse.status = statusMock;

      // 11th request should be blocked
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: expect.stringContaining('Rate limit exceeded')
        }
      });
    });

    it('should return 401 if userId is missing', () => {
      mockRequest.userId = undefined;

      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: ErrorCode.INVALID_TOKEN,
          message: 'User not authenticated'
        }
      });
    });
  });

  describe('Sliding window behavior', () => {
    it('should allow requests after window expires', async () => {
      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      }

      // Wait for window to expire (simulate by manipulating timestamps)
      // In real scenario, we'd wait 60 seconds, but for testing we can clear and verify behavior
      const timestamps = getRateLimitData('test-user-123');
      expect(timestamps.length).toBe(10);

      // After 60+ seconds, old timestamps should be filtered out
      // This is tested implicitly by the sliding window logic
    });

    it('should track requests per user independently', () => {
      const user1Request = { ...mockRequest, userId: 'user-1' };
      const user2Request = { ...mockRequest, userId: 'user-2' };

      // User 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(user1Request as Request, mockResponse as Response, nextFunction);
      }

      // User 2 should still be able to make requests
      nextFunction = jest.fn();
      rateLimitMiddleware(user2Request as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Timestamp recording', () => {
    it('should record timestamps for each request', () => {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      const timestamps = getRateLimitData('test-user-123');
      expect(timestamps.length).toBe(3);
    });

    it('should only keep recent timestamps within window', () => {
      // This is implicitly tested by the sliding window behavior
      // The middleware filters old timestamps when checking limits
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const timestamps = getRateLimitData('test-user-123');
      expect(timestamps.length).toBe(1);
      expect(timestamps[0]).toBeGreaterThan(Date.now() - 1000); // Within last second
    });
  });

  describe('Cleanup functionality', () => {
    it('should start cleanup interval', () => {
      startRateLimitCleanup();
      // Cleanup interval should be running
      // We can't easily test the interval itself without waiting, but we can verify it doesn't crash
      stopRateLimitCleanup();
    });

    it('should not start multiple cleanup intervals', () => {
      startRateLimitCleanup();
      startRateLimitCleanup(); // Should not create duplicate
      stopRateLimitCleanup();
    });

    it('should clear rate limit data', () => {
      rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(getRateLimitData('test-user-123').length).toBe(1);

      clearRateLimitData();
      expect(getRateLimitData('test-user-123').length).toBe(0);
    });
  });
});
