import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { LedgeraSpinner } from '@/components/ui/fintrix-spinner'
import { useAuth } from '@/contexts/AuthContext'
import { AuthResponse, Role } from '@/types/auth'

export function OAuth2CallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    // Extract token and user info from URL
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const name = searchParams.get('name')
    const role = searchParams.get('role')
    const error = searchParams.get('error')

    // Handle error case
    if (error) {
      let errorMessage = 'Authentication failed'
      
      if (error === 'account_disabled') {
        errorMessage = 'Your account has been disabled. Please contact support.'
      }
      
      toast.error(errorMessage)
      navigate('/login', { replace: true })
      return
    }

    // Handle success case
    if (token && email) {
      // Create auth response object (similar to regular login)
      const authResponse: AuthResponse = {
        token,
        email,
        name: name || email.split('@')[0],
        role: (role as Role) || 'VIEWER', // Use role from backend, default to VIEWER if not provided
      }

      // Login user (stores token in localStorage)
      login(authResponse)
      
      toast.success(`Welcome ${name || 'back'}!`)
      
      // Redirect to dashboard
      navigate('/app/dashboard', { replace: true })
    } else {
      // Missing required parameters
      toast.error('Authentication failed. Please try again.')
      navigate('/login', { replace: true })
    }
  }, [searchParams, login, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <img 
          src={APP_LOGO_SRC} 
          alt="Revive" 
          className="mx-auto h-16 w-16 animate-pulse" 
        />
        
        <div className="space-y-3">
          <LedgeraSpinner size={48} className="mx-auto" alt="Completing sign-in" />
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Completing sign-in...
            </h2>
            <p className="text-sm text-white/40">
              Please wait while we log you in
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-xs text-white/25">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Processing authentication</span>
        </div>
      </div>
    </div>
  )
}
