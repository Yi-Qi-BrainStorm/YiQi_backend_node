/**
 * Application Constants
 */

// Default configuration values
export const DEFAULT_PORT = 8080;
export const DEFAULT_SESSION_EXPIRATION_HOURS = 24;
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 10;
export const DEFAULT_MAX_MESSAGE_LENGTH = 4000;
export const DEFAULT_MAX_SYSTEM_PROMPT_LENGTH = 2000;

// Temperature constraints
export const MIN_TEMPERATURE = 0;
export const MAX_TEMPERATURE = 1;

// Session ID format
export const SESSION_ID_PREFIX = 'session_';
export const AGENT_ID_PREFIX = 'agent_';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// SSE Configuration
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // Disable Nginx buffering
} as const;
