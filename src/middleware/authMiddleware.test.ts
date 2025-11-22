/**
 * Authentication and Authorization Middleware Tests
 * Tests for JWT token verification and session ownership validation
 */

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, sessionAuthMiddleware } from './authMiddleware';
import { verifyToken } from '../services/authService';
import { getSessionService } from '../services/sessionService';
import { ErrorCode } from '../types/chat';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('../services/sessionService');

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
      query: {}
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
    
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 error when token is missing', () => {
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Missing authentication token'
      }
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 error when token is invalid', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid_token'
    };
    
    (verifyToken as jest.Mock).mockReturnValue(null);

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Invalid or expired token'
      }
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should extract userId from valid token and call next()', () => {
    mockRequest.headers = {
      authorization: 'Bearer valid_token'
    };
    
    const decodedToken = {
      id: 'user123',
      username: 'testuser'
    };
    
    (verifyToken as jest.Mock).mockReturnValue(decodedToken);

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.userId).toBe('user123');
    expect(mockRequest.username).toBe('testuser');
    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should accept token from URL query parameter (for SSE)', () => {
    mockRequest.query = {
      token: 'valid_token_from_query'
    };
    
    const decodedToken = {
      id: 'user456',
      username: 'sseuser'
    };
    
    (verifyToken as jest.Mock).mockReturnValue(decodedToken);

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.userId).toBe('user456');
    expect(mockRequest.username).toBe('sseuser');
    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should prioritize Authorization header over query parameter', () => {
    mockRequest.headers = {
      authorization: 'Bearer header_token'
    };
    mockRequest.query = {
      token: 'query_token'
    };
    
    const decodedToken = {
      id: 'user789',
      username: 'headeruser'
    };
    
    (verifyToken as jest.Mock).mockReturnValue(decodedToken);

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(verifyToken).toHaveBeenCalledWith('header_token');
    expect(mockRequest.userId).toBe('user789');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 when query token is invalid', () => {
    mockRequest.query = {
      token: 'invalid_query_token'
    };
    
    (verifyToken as jest.Mock).mockReturnValue(null);

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Invalid or expired token'
      }
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('sessionAuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockSessionService: any;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
      query: {},
      userId: 'user123'
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
    
    nextFunction = jest.fn();

    mockSessionService = {
      getSession: jest.fn()
    };
    
    (getSessionService as jest.Mock).mockReturnValue(mockSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if userId is not present', () => {
    mockRequest.userId = undefined;
    mockRequest.body = { sessionId: 'session123' };

    sessionAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'User not authenticated'
      }
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if no sessionId is provided', () => {
    sessionAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 403 if session belongs to another user', () => {
    mockRequest.body = { sessionId: 'session123' };
    
    mockSessionService.getSession.mockReturnValue({
      sessionId: 'session123',
      userId: 'different_user',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    sessionAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.FORBIDDEN_SESSION,
        message: 'Access denied: session belongs to another user'
      }
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if session belongs to the user', () => {
    mockRequest.body = { sessionId: 'session123' };
    
    mockSessionService.getSession.mockReturnValue({
      sessionId: 'session123',
      userId: 'user123',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    sessionAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should call next() if session does not exist yet', () => {
    mockRequest.body = { sessionId: 'new_session' };
    
    mockSessionService.getSession.mockReturnValue(null);

    sessionAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should check sessionId from query params if not in body', () => {
    mockRequest.query = { sessionId: 'session123' };
    
    mockSessionService.getSession.mockReturnValue({
      sessionId: 'session123',
      userId: 'user123',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    sessionAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSessionService.getSession).toHaveBeenCalledWith('session123');
    expect(nextFunction).toHaveBeenCalled();
  });
});
