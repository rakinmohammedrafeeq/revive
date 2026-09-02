import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LedgeraSpinner } from '@/components/ui/fintrix-spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useLoginMutation } from '@/hooks'
import { buildAuthRoute } from '@/lib/authRoleFlow'
import { getDefaultRouteByRole } from '@/lib/routeUtils'
import { getRoleLabel } from '@/lib/roleUtils'
import { redirectToGoogleOAuth } from '@/lib/oauthUtils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showSlowMessage, setShowSlowMessage] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useLoginMutation()

  const onSubmit = (data: LoginFormData) => {
    // Show extended message after 5 seconds if still loading
    const slowTimer = setTimeout(() => {
      setShowSlowMessage(true)
    }, 5000)

    mutation.mutate(data, {
      onSuccess: (authResponse) => {
        clearTimeout(slowTimer)
        setShowSlowMessage(false)
        login(authResponse)
        toast.success(`Welcome back, ${getRoleLabel(authResponse.role)}!`)

        const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
        const safeReturnPath = fromPath && fromPath.startsWith('/app/') ? fromPath : null

        navigate(safeReturnPath ?? getDefaultRouteByRole(), { replace: true })
      },
      onError: () => {
        clearTimeout(slowTimer)
        setShowSlowMessage(false)
        toast.error('Invalid email or password')
      },
    })
  }

  return (
    <div className="relative mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      {mutation.isPending && (
        <div className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-black/50 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-black/70 p-6 text-center shadow-2xl">
            <LedgeraSpinner size={48} className="mx-auto" alt="Signing you in" />
            <div className="mt-4 space-y-1.5">
              <p className="text-sm font-medium text-white">
                Signing you in…
              </p>
              {showSlowMessage ? (
                <p className="text-xs leading-relaxed text-white/50">
                  Taking longer than usual? The backend may be waking up (~3 min).
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-white/50">
                  This will only take a moment.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-8 space-y-4 text-center">
        <img src={APP_LOGO_SRC} alt="Revive" className="mx-auto h-14 w-14" loading="eager" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-sm text-white/40">
            Sign in to see what Revive caught
          </p>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-white/60">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11 border-white/[0.08] bg-white/[0.03] pl-10 text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30 transition-colors"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-white/60">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-white/35 transition-colors hover:text-white/60"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-11 border-white/[0.08] bg-white/[0.03] pl-10 pr-11 text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30 transition-colors"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/25 transition-colors hover:text-white/60"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-xs text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/15"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="inline-flex items-center gap-2">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-black px-2 text-white/35">Or continue with</span>
        </div>
      </div>

      {/* ── Google OAuth ──────────────────────────────────────── */}
      <Button
        type="button"
        variant="outline"
        onClick={redirectToGoogleOAuth}
        className="h-11 w-full border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.06] hover:border-white/15"
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      {/* ── Footer ───────────────────────────────────────────── */}
      <p className="mt-6 text-center text-sm text-white/35">
        Don&apos;t have an account?{' '}
        <Link
          to={buildAuthRoute('/register', 'VIEWER')}
          className="font-medium text-primary/80 transition-colors hover:text-primary"
        >
          Create account
        </Link>
      </p>
    </div>
  )
}
