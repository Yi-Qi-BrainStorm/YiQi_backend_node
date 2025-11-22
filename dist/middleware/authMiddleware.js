"use strict";
/**
 * Authentication and Authorization Middleware
 * Handles JWT token verification and session ownership validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.sessionAuthMiddleware = exports.authMiddleware = void 0;
const authService_1 = require("../services/authService");
const chat_1 = require("../types/chat");
const sessionService_1 = require("../services/sessionService");
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
const authMiddleware = (req, res, next) => {
    let token;
    // 1. Try to get token from Authorization header (POST requests)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    // 2. If not in header, try to get from URL query parameter (SSE GET requests)
    if (!token && req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        const errorResponse = {
            error: {
                code: chat_1.ErrorCode.INVALID_TOKEN,
                message: 'Missing authentication token'
            }
        };
        res.status(401).json(errorResponse);
        return;
    }
    const decoded = (0, authService_1.verifyToken)(token);
    if (!decoded) {
        const errorResponse = {
            error: {
                code: chat_1.ErrorCode.TOKEN_EXPIRED,
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
exports.authMiddleware = authMiddleware;
/**
 * Session authorization middleware - verifies session ownership
 * Returns 403 error if user tries to access another user's session
 * Must be used after authMiddleware
 *
 * Requirements: 5.3
 */
const sessionAuthMiddleware = (req, res, next) => {
    // Extract sessionId from request (could be in body or query params)
    const sessionId = req.body?.sessionId || req.query?.sessionId;
    const userId = req.userId;
    if (!userId) {
        // This should not happen if authMiddleware is applied first
        const errorResponse = {
            error: {
                code: chat_1.ErrorCode.INVALID_TOKEN,
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
    const sessionService = (0, sessionService_1.getSessionService)();
    const session = sessionService.getSession(sessionId);
    if (session && session.userId !== userId) {
        const errorResponse = {
            error: {
                code: chat_1.ErrorCode.FORBIDDEN_SESSION,
                message: 'Access denied: session belongs to another user'
            }
        };
        res.status(403).json(errorResponse);
        return;
    }
    // Session doesn't exist yet or belongs to the user - allow access
    next();
};
exports.sessionAuthMiddleware = sessionAuthMiddleware;
// Export legacy name for backward compatibility
exports.authenticateToken = exports.authMiddleware;
