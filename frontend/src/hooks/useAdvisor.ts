import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chatWithAdvisor,
  generateInsights,
  getActiveInsights,
} from '../api/advisorApi';
import type { AdvisorChatRequest } from '../types/advisor';

export const ADVISOR_KEYS = {
  chat: ['advisor', 'chat'] as const,
  insights: (workspaceId?: number) =>
    ['advisor', 'insights', workspaceId] as const,
  all: ['advisor'] as const,
};

/**
 * Hook for chatting with AI advisor
 */
export const useAdvisorChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AdvisorChatRequest) => chatWithAdvisor(request),
    onSuccess: (_, variables) => {
      // Invalidate insights for the specific workspace
      queryClient.invalidateQueries({ 
        queryKey: ADVISOR_KEYS.insights(variables.workspaceId) 
      });
    },
  });
};

/**
 * Hook for generating insights
 */
export const useGenerateInsights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId?: number) => generateInsights(workspaceId),
    onSuccess: (_, workspaceId) => {
      // Invalidate insights query to show new insights
      queryClient.invalidateQueries({
        queryKey: ADVISOR_KEYS.insights(workspaceId),
      });
    },
  });
};

/**
 * Hook for fetching active insights
 */
export const useActiveInsights = (workspaceId?: number) => {
  return useQuery({
    queryKey: ADVISOR_KEYS.insights(workspaceId),
    queryFn: () => getActiveInsights(workspaceId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
