import { apiClient } from '@/api/client'
import type { UserListItem } from '@/types/userList'

export interface UpdateNameRequest {
  name: string
}

export const usersApi = {
  async list(): Promise<UserListItem[]> {
    const response = await apiClient.get<UserListItem[]>('/users')
    return response.data
  },

  async assignable(): Promise<UserListItem[]> {
    const response = await apiClient.get<UserListItem[]>('/users/assignable')
    return response.data
  },

  async toggleStatus(id: number): Promise<UserListItem> {
    const response = await apiClient.put<UserListItem>(`/users/${id}/toggle-status`)
    return response.data
  },

  async getCurrentUser(): Promise<UserListItem> {
    const response = await apiClient.get<UserListItem>('/users/me')
    return response.data
  },

  async updateName(name: string): Promise<UserListItem> {
    const response = await apiClient.put<UserListItem>('/users/me/name', { name })
    return response.data
  },
}
