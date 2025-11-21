/**
 * ID Generation Utilities
 * Helper functions for generating unique identifiers
 */

import { AGENT_ID_PREFIX, SESSION_ID_PREFIX } from './constants';

/**
 * Generate a random string
 */
function generateRandomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique agent ID
 * Format: agent_{timestamp}_{random}
 */
export function generateAgentId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `${AGENT_ID_PREFIX}${timestamp}_${random}`;
}

/**
 * Generate a unique session ID
 * Format: session_{agentId}_{timestamp}
 */
export function generateSessionId(agentId: string): string {
  const timestamp = Date.now();
  return `${SESSION_ID_PREFIX}${agentId}_${timestamp}`;
}

/**
 * Generate a unique message ID
 * Format: msg_{timestamp}_{random}
 */
export function generateMessageId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `msg_${timestamp}_${random}`;
}
