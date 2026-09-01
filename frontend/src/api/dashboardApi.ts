import { apiClient } from '@/api/client'
import type { DashboardResponse } from '@/types/dashboard'

export const dashboardApi = {
  async get(): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardResponse>('/dashboard')
    return response.data
  },
}
