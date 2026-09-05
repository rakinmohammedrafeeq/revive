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

export interface VerifyRegistrationOtpResponse {
  verified: boolean;
  message: string;
  verificationToken: string;
}

export const otpApi = {
  // Request OTP for password reset
  requestOtp: async (data: RequestOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/request', data);
    return response.data;
  },

  // Verify OTP for password reset
  verifyOtp: async (data: VerifyOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/verify', data);
    return response.data;
  },

  // Send OTP for new account registration
  sendRegistrationOtp: async (data: RequestOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/send-registration-otp', data);
    return response.data;
  },

  // Verify OTP for new account registration
  verifyRegistrationOtp: async (data: VerifyOtpRequest): Promise<VerifyRegistrationOtpResponse> => {
    const response = await apiClient.post<VerifyRegistrationOtpResponse>('/auth/otp/verify-registration-otp', data);
    return response.data;
  },

  // Reset password with OTP
  resetPasswordWithOtp: async (data: ResetPasswordWithOtpRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/otp/reset-password', data);
    return response.data;
  },
};
