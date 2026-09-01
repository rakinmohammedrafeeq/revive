import { apiClient } from './client';

export interface WorkspacePermission {
  OWNER: 'OWNER';
  EDITOR: 'EDITOR';
  VIEWER: 'VIEWER';
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  ownerId: number;
  ownerName: string;
  userPermission: 'OWNER' | 'EDITOR' | 'VIEWER';
  memberCount: number;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
}

export const workspaceApi = {
  // Get all workspaces for current user
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await apiClient.get<Workspace[]>('/workspaces');
    return response.data;
  },

  // Get workspace by ID
  getWorkspace: async (id: number): Promise<Workspace> => {
    const response = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return response.data;
  },

  // Create new workspace
  createWorkspace: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>('/workspaces', data);
    return response.data;
  },

  // Update workspace
  updateWorkspace: async (id: number, data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const response = await apiClient.put<Workspace>(`/workspaces/${id}`, data);
    return response.data;
  },

  // Delete workspace
  deleteWorkspace: async (id: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  // Switch to workspace
  switchWorkspace: async (id: number): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>(`/workspaces/${id}/switch`);
    return response.data;
  },
};
