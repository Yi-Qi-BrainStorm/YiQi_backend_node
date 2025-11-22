/**
 * Rate Limiting Middleware
 * Implements sliding window algorithm to limit requests per user
 * Requirements: 5.5
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorCode, ErrorResponse } from '../types/chat';
import { HTTP_STATUS, DEFAULT_RATE_LIMIT_PER_MINUTE } from '../utils/constants';

/**
 * Rate limit tracking structure
 * Maps userId to array of request timestamps
 */
const rateLimitMap = new Map<string, number[]>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = DEFAULT_RATE_LIMIT_PER_MINUTE; // 10 requests per minute

/**
 * Cleanup interval for old timestamps (run every 5 minutes)
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Start periodic cleanup of old timestamps
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startRateLimitCleanup(): void {
  if (cleanupInterval) {
    return; // Already started
  }

  cleanupInterval = setInterval(() => {
    cleanupOldTimestamps();
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Stop periodic cleanup (useful for testing)
 */
export function stopRateLimitCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Clean up old timestamps from all users
 * Removes timestamps older than the rate limit window
 */
function cleanupOldTimestamps(): void {
  const now = Date.now();
  const cutoffTime = now - RATE_LIMIT_WINDOW_MS;

  for (const [userId, timestamps] of rateLimitMap.entries()) {
    const recentTimestamps = timestamps.filter(t => t > cutoffTime);
    
    if (recentTimestamps.length === 0) {
      // No recent requests, remove user from map
      rateLimitMap.delete(userId);
    } else {
      // Update with only recent timestamps
      rateLimitMap.set(userId, recentTimestamps);
    }
  }
}

/**
 * Check if user has exceeded rate limit
 * @param userId - User identifier
 * @returns true if rate limit is exceeded, false otherwise
 */
function isRateLimitExceeded(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Get user's request timestamps
  const timestamps = rateLimitMap.get(userId) || [];

  // Filter to only recent timestamps within the window
  const recentTimestamps = timestamps.filter(t => t > windowStart);

  // Check if limit is exceeded
  return recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Record a request timestamp for a user
 * @param userId - User identifier
 */
function recordRequest(userId: string): void {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Get existing timestamps
  const timestamps = rateLimitMap.get(userId) || [];

  // Filter to only recent timestamps and add current request
  const recentTimestamps = timestamps.filter(t => t > windowStart);
  recentTimestamps.push(now);

  // Update map
  rateLimitMap.set(userId, recentTimestamps);
}

/**
 * Rate limiting middleware
 * Tracks requests per userId using sliding window algorithm
 * Returns 429 error when limit exceeded (10 requests per minute)
 * 
 * Requirements: 5.5
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.userId;

  if (!userId) {
    // This should not happen if authMiddleware is applied first
    const errorResponse: ErrorResponse = {
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'User not authenticated'
      }
    };
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
    return;
  }

  // Check if rate limit is exceeded
  if (isRateLimitExceeded(userId)) {
    const errorResponse: ErrorResponse = {
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.`
      }
    };
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(errorResponse);
    return;
  }

  // Record this request
  recordRequest(userId);

  // Allow request to proceed
  next();
};

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimitData(): void {
  rateLimitMap.clear();
}

/**
 * Get current rate limit data for a user (useful for testing)
 */
export function getRateLimitData(userId: string): number[] {
  return rateLimitMap.get(userId) || [];
}
