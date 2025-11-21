/**
 * Session Service Tests
 * Basic unit tests for SessionService functionality
 */

import { SessionService } from './sessionService';
import { ChatMessage } from '../types/chat';

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    // Create a fresh instance for each test
    sessionService = new SessionService(24);
  });

  describe('createSession', () => {
    it('should create a new session with empty message list', () => {
      const sessionId = 'session_test_123';
      const userId = 'user_123';

      const session = sessionService.createSession(sessionId, userId);

      expect(session.sessionId).toBe(sessionId);
      expect(session.userId).toBe(userId);
      expect(session.messages).toEqual([]);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      const sessionId = 'session_test_123';
      const userId = 'user_123';

      sessionService.createSession(sessionId, userId);
      const retrieved = sessionService.getSession(sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.sessionId).toBe(sessionId);
      expect(retrieved?.userId).toBe(userId);
    });

    it('should return null for non-existent session', () => {
      const retrieved = sessionService.getSession('non_existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add a message to session history', () => {
      const sessionId = 'session_test_123';
      const userId = 'user_123';

      sessionService.createSession(sessionId, userId);

      const message: ChatMessage = {
        role: 'user',
        content: 'Hello, AI!',
        timestamp: Date.now()
      };

      sessionService.addMessage(sessionId, message);

      const messages = sessionService.getMessages(sessionId);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('should throw error when adding message to non-existent session', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now()
      };

      expect(() => {
        sessionService.addMessage('non_existent', message);
      }).toThrow();
    });
  });

  describe('getMessages', () => {
    it('should retrieve all messages from a session', () => {
      const sessionId = 'session_test_123';
      const userId = 'user_123';

      sessionService.createSession(sessionId, userId);

      const message1: ChatMessage = {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now()
      };

      const message2: ChatMessage = {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now()
      };

      sessionService.addMessage(sessionId, message1);
      sessionService.addMessage(sessionId, message2);

      const messages = sessionService.getMessages(sessionId);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(message1);
      expect(messages[1]).toEqual(message2);
    });

    it('should return empty array for non-existent session', () => {
      const messages = sessionService.getMessages('non_existent');
      expect(messages).toEqual([]);
    });
  });

  describe('cleanExpiredSessions', () => {
    it('should remove sessions older than expiration time', () => {
      // Create service with 1 hour expiration for testing
      const shortExpirationService = new SessionService(1);

      const sessionId = 'session_test_123';
      const userId = 'user_123';

      const session = shortExpirationService.createSession(sessionId, userId);

      // Manually set updatedAt to 2 hours ago
      session.updatedAt = Date.now() - (2 * 60 * 60 * 1000);

      expect(shortExpirationService.hasSession(sessionId)).toBe(true);

      shortExpirationService.cleanExpiredSessions();

      expect(shortExpirationService.hasSession(sessionId)).toBe(false);
    });

    it('should not remove sessions within expiration time', () => {
      const sessionId = 'session_test_123';
      const userId = 'user_123';

      sessionService.createSession(sessionId, userId);

      expect(sessionService.hasSession(sessionId)).toBe(true);

      sessionService.cleanExpiredSessions();

      expect(sessionService.hasSession(sessionId)).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should return correct session count', () => {
      expect(sessionService.getSessionCount()).toBe(0);

      sessionService.createSession('session_1', 'user_1');
      expect(sessionService.getSessionCount()).toBe(1);

      sessionService.createSession('session_2', 'user_2');
      expect(sessionService.getSessionCount()).toBe(2);
    });

    it('should check if session exists', () => {
      const sessionId = 'session_test_123';
      
      expect(sessionService.hasSession(sessionId)).toBe(false);

      sessionService.createSession(sessionId, 'user_123');
      
      expect(sessionService.hasSession(sessionId)).toBe(true);
    });

    it('should delete a session', () => {
      const sessionId = 'session_test_123';
      
      sessionService.createSession(sessionId, 'user_123');
      expect(sessionService.hasSession(sessionId)).toBe(true);

      const deleted = sessionService.deleteSession(sessionId);
      expect(deleted).toBe(true);
      expect(sessionService.hasSession(sessionId)).toBe(false);
    });
  });
});
