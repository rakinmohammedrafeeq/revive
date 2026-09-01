import { apiClient } from './client';

export interface WorkspaceMember {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  permission: 'OWNER' | 'EDITOR' | 'VIEWER';
  invitedById: number | null;
  invitedByName: string | null;
  joinedAt: string;
  isActive: boolean;
}

export interface InviteMemberRequest {
  email: string;
  permission: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface UpdatePermissionRequest {
  permission: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export const workspaceMemberApi = {
  // Get all members of a workspace
  getMembers: async (workspaceId: number): Promise<WorkspaceMember[]> => {
    const response = await apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return response.data;
  },

  // Invite member to workspace
  inviteMember: async (workspaceId: number, data: InviteMemberRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/workspaces/${workspaceId}/members/invite`, data);
    return response.data;
  },

  // Remove member from workspace
  removeMember: async (workspaceId: number, userId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  },

  // Update member permission
  updatePermission: async (workspaceId: number, userId: number, data: UpdatePermissionRequest): Promise<WorkspaceMember> => {
    const response = await apiClient.put<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}/permission`, data);
    return response.data;
  },

  // Accept workspace invitation
  acceptInvitation: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/workspaces/members/accept-invitation?token=${token}`);
    return response.data;
  },
};
