/**
 * Session Service
 * Manages chat sessions and message history with in-memory storage
 */

import { Session, ChatMessage, ErrorCode, AppError } from '../types/chat';

export class SessionService {
  private sessions: Map<string, Session>;
  private expirationHours: number;

  constructor(expirationHours: number = 24) {
    this.sessions = new Map();
    this.expirationHours = expirationHours;
  }

  /**
   * Get an existing session by sessionId
   * Returns null if session doesn't exist
   */
  public getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    return session;
  }

  /**
   * Create a new session with empty message list
   */
  public createSession(sessionId: string, userId: string): Session {
    const now = Date.now();
    
    const session: Session = {
      sessionId,
      userId,
      messages: [],
      createdAt: now,
      updatedAt: now
    };

    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * Add a message to a session's history
   * Creates the session if it doesn't exist
   */
  public addMessage(sessionId: string, message: ChatMessage): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        `Session ${sessionId} not found`,
        500
      );
    }

    session.messages.push(message);
    session.updatedAt = Date.now();
  }

  /**
   * Get all messages from a session
   * Returns empty array if session doesn't exist
   */
  public getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return [];
    }

    return session.messages;
  }

  /**
   * Clean up sessions older than the expiration time
   * Removes sessions that haven't been updated in expirationHours
   */
  public cleanExpiredSessions(): void {
    const now = Date.now();
    const expirationMs = this.expirationHours * 60 * 60 * 1000;
    
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.updatedAt;
      
      if (age > expirationMs) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`✓ Cleaned ${cleanedCount} expired session(s)`);
    }
  }

  /**
   * Get total number of active sessions (for monitoring)
   */
  public getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if a session exists
   */
  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Delete a specific session (for testing or manual cleanup)
   */
  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

// Singleton instance
let sessionServiceInstance: SessionService | null = null;

/**
 * Get singleton instance of SessionService
 */
export function getSessionService(expirationHours?: number): SessionService {
  if (!sessionServiceInstance) {
    sessionServiceInstance = new SessionService(expirationHours);
  }
  return sessionServiceInstance;
}
