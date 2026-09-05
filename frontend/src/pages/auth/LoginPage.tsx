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
  Sparkles,
} from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LedgeraSpinner } from '@/components/ui/fintrix-spinner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useLoginMutation()

  const handleFillDemo = () => {
    setValue('email', 'rakinmohammedrafeeq@gmail.com', { shouldValidate: true })
    setValue('password', 'Admin@123', { shouldValidate: true })
    toast.info('Demo credentials populated!')
  }

  const onSubmit = (data: LoginFormData) => {
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
    <div className="relative mx-auto w-full max-w-md animate-fade-in">
      {mutation.isPending && (
        <div className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-black/50 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <LedgeraSpinner size={48} className="mx-auto" alt="Signing you in" />
            <div className="mt-4 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Signing you in…
              </p>
              {showSlowMessage ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Taking longer than usual? The backend may be waking up (~3 min).
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This will only take a moment.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back link and Theme Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <ThemeToggle variant="ghost" className="h-9 w-9 rounded-xl" />
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-6 space-y-3 text-center">
        <img src={APP_LOGO_SRC} alt="Revive" className="mx-auto h-12 w-12" loading="eager" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to Revive
          </h1>
          <p className="text-xs text-muted-foreground">
            Access your revenue recovery command center
          </p>
        </div>

        {/* Demo Credentials Quick-Fill Pill */}
        <button
          type="button"
          onClick={handleFillDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Click to fill Demo Admin credentials</span>
        </button>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@business.com"
              autoComplete="email"
              className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 transition-colors rounded-xl text-sm"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-11 border-border bg-background pl-10 pr-11 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 transition-colors rounded-xl text-sm"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="inline-flex items-center gap-2">
              Sign In to Command Center
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
        </div>
      </div>

      {/* ── Google OAuth ──────────────────────────────────────── */}
      <Button
        type="button"
        variant="outline"
        onClick={redirectToGoogleOAuth}
        className="h-11 w-full border-border bg-background text-foreground text-sm font-semibold hover:bg-accent rounded-xl"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
        Sign in with Google
      </Button>

      {/* ── Footer ───────────────────────────────────────────── */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          to={buildAuthRoute('/register', 'VIEWER')}
          className="font-semibold text-primary hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  )
}
