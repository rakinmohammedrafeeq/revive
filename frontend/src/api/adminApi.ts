import { apiClient } from './client';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  currentWorkspaceId: number | null;
  currentWorkspaceName: string | null;
  workspaceCount: number;
}

export interface AdminUsersPage {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AdminUsersQueryParams {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export const adminApi = {
  // Get all users (admin only)
  getUsers: async (params: AdminUsersQueryParams): Promise<AdminUsersPage> => {
    const response = await apiClient.get<AdminUsersPage>('/admin/users', { params });
    return response.data;
  },

  // Get user by ID (admin only)
  getUserById: async (id: number): Promise<AdminUser> => {
    const response = await apiClient.get<AdminUser>(`/admin/users/${id}`);
    return response.data;
  },

  // Update user status (admin only)
  updateUserStatus: async (id: number, active: boolean): Promise<AdminUser> => {
    const response = await apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { active });
    return response.data;
  },
};
