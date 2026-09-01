import { apiClient } from '@/api/client'
import type { FinancialRecordRequest, FinancialRecordResponse, Page } from '@/types/record'

export interface RecordsQueryParams {
  startDate?: string
  endDate?: string
  category?: string
  type?: 'INCOME' | 'EXPENSE'
  page?: number
  size?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
}

export const recordsApi = {
  async list(params: RecordsQueryParams): Promise<Page<FinancialRecordResponse>> {
    const response = await apiClient.get<Page<FinancialRecordResponse>>('/records', { params })
    return response.data
  },

  async getById(id: number): Promise<FinancialRecordResponse> {
    const response = await apiClient.get<FinancialRecordResponse>(`/records/${id}`)
    return response.data
  },

  async create(body: FinancialRecordRequest): Promise<FinancialRecordResponse> {
    const response = await apiClient.post<FinancialRecordResponse>('/records', body)
    return response.data
  },

  async update(id: number, body: FinancialRecordRequest): Promise<FinancialRecordResponse> {
    const response = await apiClient.put<FinancialRecordResponse>(`/records/${id}`, body)
    return response.data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/records/${id}`)
  },
}
