import { apiClient } from './client';
import type {
  AdvisorChatRequest,
  AdvisorChatResponse,
  FinancialInsight,
} from '../types/advisor';

/**
 * Chat with AI financial advisor
 */
export const chatWithAdvisor = async (
  request: AdvisorChatRequest
): Promise<AdvisorChatResponse> => {
  const response = await apiClient.post<AdvisorChatResponse>(
    '/advisor/chat',
    request
  );
  return response.data;
};

/**
 * Generate proactive financial insights
 */
export const generateInsights = async (
  workspaceId?: number
): Promise<FinancialInsight[]> => {
  const params = workspaceId ? { workspaceId } : {};
  const response = await apiClient.post<FinancialInsight[]>(
    '/advisor/insights/generate',
    null,
    { params }
  );
  return response.data;
};

/**
 * Get active financial insights
 */
export const getActiveInsights = async (
  workspaceId?: number
): Promise<FinancialInsight[]> => {
  const params = workspaceId ? { workspaceId } : {};
  const response = await apiClient.get<FinancialInsight[]>(
    '/advisor/insights',
    { params }
  );
  return response.data;
};

/**
 * Clean up duplicate insights
 */
export const cleanupDuplicateInsights = async (
  workspaceId?: number
): Promise<{ message: string }> => {
  const params = workspaceId ? { workspaceId } : {};
  const response = await apiClient.post<{ message: string }>(
    '/advisor/insights/cleanup',
    null,
    { params }
  );
  return response.data;
};
