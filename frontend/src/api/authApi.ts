import { apiClient } from '@/api/client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const authApi = {
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload)
    return response.data
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    return response.data
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', payload)
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', payload)
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await apiClient.put('/users/me/password', payload)
  },
}
