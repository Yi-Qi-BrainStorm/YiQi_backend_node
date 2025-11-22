/**
 * Authentication and Authorization Middleware
 * Handles JWT token verification and session ownership validation
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { ErrorCode, ErrorResponse } from '../types/chat';
import { getSessionService } from '../services/sessionService';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 * Returns 401 error for invalid or expired tokens
 * Extracts userId from token and attaches to request object
 * 
 * Supports token from:
 * 1. Authorization header (Bearer token) - for POST requests
 * 2. URL query parameter (token) - for SSE GET requests
 * 
 * Requirements: 5.1, 5.2
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  // 1. Try to get token from Authorization header (POST requests)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // 2. If not in header, try to get from URL query parameter (SSE GET requests)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    const errorResponse: ErrorResponse = {
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Missing authentication token'
      }
    };
    res.status(401).json(errorResponse);
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    const errorResponse: ErrorResponse = {
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Invalid or expired token'
      }
    };
    res.status(401).json(errorResponse);
    return;
  }

  // Attach userId to request for downstream use
  req.userId = decoded.id;
  req.username = decoded.username;
  next();
};

/**
 * Session authorization middleware - verifies session ownership
 * Returns 403 error if user tries to access another user's session
 * Must be used after authMiddleware
 * 
 * Requirements: 5.3
 */
export const sessionAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Extract sessionId from request (could be in body or query params)
  const sessionId = req.body?.sessionId || req.query?.sessionId as string;
  const userId = req.userId;

  if (!userId) {
    // This should not happen if authMiddleware is applied first
    const errorResponse: ErrorResponse = {
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'User not authenticated'
      }
    };
    res.status(401).json(errorResponse);
    return;
  }

  if (!sessionId) {
    // No sessionId to check - let the route handler deal with validation
    next();
    return;
  }

  // Check if session exists and belongs to the user
  const sessionService = getSessionService();
  const session = sessionService.getSession(sessionId);

  if (session && session.userId !== userId) {
    const errorResponse: ErrorResponse = {
      error: {
        code: ErrorCode.FORBIDDEN_SESSION,
        message: 'Access denied: session belongs to another user'
      }
    };
    res.status(403).json(errorResponse);
    return;
  }

  // Session doesn't exist yet or belongs to the user - allow access
  next();
};

// Export legacy name for backward compatibility
export const authenticateToken = authMiddleware;