import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api'

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  })
}
