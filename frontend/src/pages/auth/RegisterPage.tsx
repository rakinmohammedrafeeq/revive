import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LedgeraSpinner } from '@/components/ui/fintrix-spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useRegisterMutation } from '@/hooks'
import { redirectToGoogleOAuth } from '@/lib/oauthUtils'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and privacy policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreedToTerms: false,
    },
  })

  const agreedToTerms = watch('agreedToTerms')

  const mutation = useRegisterMutation()

  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: (authResponse) => {
          login(authResponse)
          toast.success('Account created successfully!')
          navigate('/app/dashboard', { replace: true })
        },
        onError: () => {
          toast.error('Failed to create account. Please try again.')
        },
      },
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-md space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {mutation.isPending && (
        <div className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-black/50 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-black/70 p-6 text-center shadow-2xl">
            <LedgeraSpinner size={48} className="mx-auto" alt="Creating your account" />
            <div className="mt-4 space-y-1.5">
              <p className="text-sm font-medium text-white">
                Creating your account…
              </p>
              <p className="text-xs leading-relaxed text-white/50">
                If the backend is cold-starting, this may take a moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="space-y-3 text-center">
        <img src={APP_LOGO_SRC} alt="Revive" className="mx-auto h-12 w-12" loading="eager" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Join Revive</h1>
          <p className="text-sm text-white/40">
            Start recovering revenue. Sign up with Google or email.
          </p>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-white/60">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              className="h-11 border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
              {...registerField('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-white/60">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11 border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
              {...registerField('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-white/60">Password</Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="inline-flex items-center gap-1 text-xs text-white/35 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="h-11 border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/60">Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="h-11 border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
              {...registerField('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Terms and Privacy Checkbox */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreedToTerms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setValue('agreedToTerms', checked === true)}
              className="mt-0.5 border-white/[0.08] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="agreedToTerms"
              className="text-xs leading-relaxed text-white/50 cursor-pointer"
            >
              I agree to the{' '}
              <Link
                to="/terms-and-privacy"
                className="text-primary/80 hover:text-primary underline"
                target="_blank"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/terms-and-privacy"
                className="text-primary/80 hover:text-primary underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-xs text-red-400">{errors.agreedToTerms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/15 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={mutation.isPending || !agreedToTerms}
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Let's go
        </Button>
      </form>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="relative">
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

      <p className="text-center text-sm text-white/35">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary/80 transition-colors hover:text-primary"
        >
          Sign in instead
        </Link>
      </p>
    </div>
  )
}
