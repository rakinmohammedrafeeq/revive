/**
 * Types for AI Financial Advisor feature (RAG-powered)
 */

export interface AdvisorChatRequest {
  message: string;
  sessionId?: string;
  workspaceId?: number;
}

export interface AdvisorChatResponse {
  success: boolean;
  response: string;
  sessionId: string;
  contextUsed?: string[];
  error?: string;
  tokensUsed?: number;
}

export interface FinancialInsight {
  id: number;
  insightType: 'budget' | 'investment' | 'savings' | 'spending';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'dismissed' | 'completed';
  createdAt: string;
  expiresAt?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  contextUsed?: string[];
}
