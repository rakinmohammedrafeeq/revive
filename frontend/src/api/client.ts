import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { clearAuthState, getStoredToken } from '@/store/authStore'

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Validate that API URL is configured
if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not configured in environment variables')
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 180 seconds (3 minutes) for Render cold starts
})

// Request interceptor: Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Handle auth errors and provide clean error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (
      error.response?.status === 401 &&
      Boolean((error.config as InternalAxiosRequestConfig)?.headers?.Authorization)
    ) {
      clearAuthState()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    // Provide clean error messages (never expose internal details)
    if (error.response?.data) {
      // Backend provided an error message
      return Promise.reject(error)
    } else if (error.request) {
      // Request was made but no response received (timeout or network error)
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        const timeoutError = new Error('Server is taking longer than expected. The backend may be starting up. Please wait a moment and try again.')
        return Promise.reject(timeoutError)
      }
      const networkError = new Error('Unable to connect to server. Please check your connection.')
      return Promise.reject(networkError)
    } else {
      // Something else happened
      const genericError = new Error('An unexpected error occurred. Please try again.')
      return Promise.reject(genericError)
    }
  }
)

