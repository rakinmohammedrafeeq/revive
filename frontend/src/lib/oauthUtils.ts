/**
 * OAuth utility functions
 */

/**
 * Get the backend URL from environment variable
 * Falls back to localhost for development if not set
 */
const getBackendUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  
  if (!apiBaseUrl) {
    console.warn('VITE_API_BASE_URL not configured, using localhost')
    return 'http://localhost:8080'
  }
  
  // Remove /api suffix if present to get base backend URL
  return apiBaseUrl.replace(/\/api$/, '')
}

/**
 * Get the Google OAuth authorization URL
 */
export const getGoogleOAuthUrl = (): string => {
  const backendUrl = getBackendUrl()
  return `${backendUrl}/oauth2/authorization/google`
}

/**
 * Redirect to Google OAuth
 */
export const redirectToGoogleOAuth = (): void => {
  window.location.href = getGoogleOAuthUrl()
}
