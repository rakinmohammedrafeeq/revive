import { apiClient } from './client';

export interface RequestOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordWithOtpRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export const otpApi = {
  // Request OTP
  requestOtp: async (data: RequestOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/request', data);
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (data: VerifyOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/verify', data);
    return response.data;
  },

  // Reset password with OTP
  resetPasswordWithOtp: async (data: ResetPasswordWithOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/reset-password', data);
    return response.data;
  },
};
