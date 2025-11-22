/**
 * Chat Routes
 * Handles HTTP and SSE endpoints for AI chat interactions
 * Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
 */

import express, { Request, Response } from 'express';
import { getChatService } from '../services/chatService';
import { authMiddleware, sessionAuthMiddleware } from '../middleware/authMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';
import { AgentConfig, ErrorCode, ErrorResponse, AppError } from '../types/chat';

const router = express.Router();

/**
 * POST /api/chat/send - Non-stream chat endpoint
 * Requirements: 1.1, 1.5
 * 
 * Validates required parameters (agentId, sessionId, message, agentConfig)
 * Returns 400 error for missing parameters or validation failures
 * Calls ChatService.sendMessage() and returns response
 */
router.post(
  '/send',
  authMiddleware,
  sessionAuthMiddleware,
  rateLimitMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const chatService = getChatService();
      const { agentId, sessionId, message, agentConfig } = req.body;
      const userId = req.userId!; // Guaranteed by authMiddleware

      // Validate required parameters
      if (!agentId) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: agentId'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!sessionId) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: sessionId'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!message) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: message'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!agentConfig) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: agentConfig'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate agentConfig structure
      if (!agentConfig.name || !agentConfig.model || 
          agentConfig.temperature === undefined || 
          agentConfig.systemPrompt === undefined) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.INVALID_CONFIG,
            message: 'Invalid agentConfig: must contain name, model, temperature, and systemPrompt'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Call chat service
      const response = await chatService.sendMessage(
        userId,
        sessionId,
        message,
        agentConfig as AgentConfig
      );

      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        const errorResponse: ErrorResponse = {
          error: {
            code: error.code,
            message: error.message
          }
        };
        res.status(error.statusCode).json(errorResponse);
        return;
      }

      console.error('Chat send error:', error);
      const errorResponse: ErrorResponse = {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error'
        }
      };
      res.status(500).json(errorResponse);
    }
  }
);

/**
 * GET /api/chat/stream - SSE stream chat endpoint
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * Decodes URL-encoded parameters (especially agentConfig JSON string)
 * Sets SSE response headers (Content-Type, Cache-Control, Connection)
 * Calls ChatService.streamMessage() and emits SSE chunks
 * Handles client disconnect and cleanup resources
 */
router.get(
  '/stream',
  authMiddleware,
  sessionAuthMiddleware,
  rateLimitMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const chatService = getChatService();
      // Extract and decode URL-encoded parameters
      const agentId = req.query.agentId as string;
      const sessionId = req.query.sessionId as string;
      const message = req.query.message as string;
      const agentConfigStr = req.query.agentConfig as string;
      const userId = req.userId!; // Guaranteed by authMiddleware

      // Validate required parameters
      if (!agentId) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: agentId'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!sessionId) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: sessionId'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!message) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: message'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!agentConfigStr) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.MISSING_PARAMETER,
            message: 'Missing required parameter: agentConfig'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Decode and parse agentConfig
      let agentConfig: AgentConfig;
      try {
        const decodedConfig = decodeURIComponent(agentConfigStr);
        agentConfig = JSON.parse(decodedConfig);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.INVALID_CONFIG,
            message: 'Invalid agentConfig: must be valid JSON'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate agentConfig structure
      if (!agentConfig.name || !agentConfig.model || 
          agentConfig.temperature === undefined || 
          agentConfig.systemPrompt === undefined) {
        const errorResponse: ErrorResponse = {
          error: {
            code: ErrorCode.INVALID_CONFIG,
            message: 'Invalid agentConfig: must contain name, model, temperature, and systemPrompt'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Set SSE response headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

      // Track if client disconnected
      let clientDisconnected = false;

      // Handle client disconnect
      req.on('close', () => {
        clientDisconnected = true;
        console.log(`Client disconnected from SSE stream: sessionId=${sessionId}`);
      });

      // Call chat service with streaming
      await chatService.streamMessage(
        userId,
        sessionId,
        message,
        agentConfig,
        (chunk) => {
          // Don't send if client disconnected
          if (clientDisconnected) {
            return;
          }

          // Send SSE chunk
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      );

      // End the response if not already disconnected
      if (!clientDisconnected) {
        res.end();
      }
    } catch (error) {
      if (error instanceof AppError) {
        // Send error as SSE chunk
        const errorChunk = {
          delta: '',
          done: true,
          error: error.message
        };
        res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
        res.end();
        return;
      }

      console.error('Chat stream error:', error);
      const errorChunk = {
        delta: '',
        done: true,
        error: 'Internal server error'
      };
      res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
      res.end();
    }
  }
);

export default router;
