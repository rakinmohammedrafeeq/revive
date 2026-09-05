import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LedgeraSpinner } from '@/components/ui/fintrix-spinner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useRegisterMutation } from '@/hooks'
import { redirectToGoogleOAuth } from '@/lib/oauthUtils'
import { otpApi } from '@/api/otpApi'

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Email OTP verification state
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

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
  const emailValue = watch('email')
  const mutation = useRegisterMutation()

  // Handler: Send OTP verification code
  const handleSendVerificationCode = async () => {
    const trimmedEmail = emailValue?.trim()
    if (!trimmedEmail || !z.string().email().safeParse(trimmedEmail).success) {
      toast.error('Please enter a valid work email address first.')
      return
    }

    try {
      setIsSendingOtp(true)
      const res = await otpApi.sendRegistrationOtp({ email: trimmedEmail })
      setOtpSent(true)
      setResendCooldown(30)
      toast.success(res.message || 'Verification code sent! Please check your inbox.')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Failed to send verification code. Please check your email and try again.'
      toast.error(msg)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Handler: Verify OTP code
  const handleVerifyOtp = async () => {
    const trimmedEmail = emailValue?.trim()
    const trimmedCode = otpCode.trim()

    if (trimmedCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code.')
      return
    }

    try {
      setIsVerifyingOtp(true)
      const res = await otpApi.verifyRegistrationOtp({
        email: trimmedEmail,
        otp: trimmedCode,
      })

      if (res.verified) {
        setIsEmailVerified(true)
        setVerificationToken(res.verificationToken)
        setVerifiedEmail(trimmedEmail)
        toast.success('Email verified successfully! You can now create your password.')
      } else {
        toast.error(res.message || 'Invalid or expired verification code.')
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Invalid or expired verification code. Please try again.'
      toast.error(msg)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Handler: Reset email verification if user wants to change email
  const handleResetVerification = () => {
    setIsEmailVerified(false)
    setVerificationToken('')
    setVerifiedEmail('')
    setOtpSent(false)
    setOtpCode('')
    setValue('password', '')
    setValue('confirmPassword', '')
  }

  // Handler: Final Registration
  const onSubmit = (data: RegisterFormData) => {
    if (!isEmailVerified || !verificationToken) {
      toast.error('Please verify your work email address before creating an account.')
      return
    }

    if (data.email.trim().toLowerCase() !== verifiedEmail.trim().toLowerCase()) {
      toast.error('The verified email does not match the entered email. Please verify again.')
      handleResetVerification()
      return
    }

    mutation.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        verificationToken,
      },
      {
        onSuccess: (authResponse) => {
          login(authResponse)
          toast.success('Account created successfully!')
          navigate('/app/dashboard', { replace: true })
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message || 'Failed to create account. Please try again.'
          toast.error(msg)
        },
      },
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-md animate-fade-in">
      {mutation.isPending && (
        <div className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-black/50 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <LedgeraSpinner size={48} className="mx-auto" alt="Creating your account" />
            <div className="mt-4 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Creating your account…
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Setting up your merchant recovery workspace.
              </p>
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
            Get Started with Revive
          </h1>
          <p className="text-xs text-muted-foreground">
            Start recovering failed payments with automated AI workflows
          </p>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-foreground">
            Full name
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              autoComplete="name"
              className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 transition-colors rounded-xl text-sm"
              {...registerField('name')}
            />
          </div>
          {errors.name && (
            <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Work email
            </Label>
            {isEmailVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Email Verified
              </span>
            )}
          </div>

          {/* Email input + prominent separate button in a flex row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="rahul@company.com"
                autoComplete="email"
                readOnly={isEmailVerified}
                className={`h-11 border-border pl-10 pr-3 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 transition-colors rounded-xl text-sm ${
                  isEmailVerified
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'bg-background'
                }`}
                {...registerField('email')}
              />
            </div>

            {/* Separate, High-Contrast Action Button */}
            {isEmailVerified ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetVerification}
                className="h-11 px-3.5 rounded-xl border-border bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                Change
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={isSendingOtp || resendCooldown > 0 || !emailValue}
                className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1.5"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Resend ({resendCooldown}s)</span>
                ) : otpSent ? (
                  <span>Resend Code</span>
                ) : (
                  <span>Verify Email</span>
                )}
              </Button>
            )}
          </div>

          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ── OTP Verification Box (Appears when code is sent and not yet verified) ── */}
        {otpSent && !isEmailVerified && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <KeyRound className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">
                  Enter 6-digit verification code
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Sent to <span className="font-semibold text-foreground">{emailValue}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="h-11 text-center font-mono text-lg font-bold tracking-widest bg-background border-border rounded-xl text-foreground placeholder:text-muted-foreground/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleVerifyOtp()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                className="h-11 px-5 rounded-xl font-bold text-xs whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>

            {/* High-visibility resend footer */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
              <span className="text-muted-foreground font-medium text-[11px]">Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={isSendingOtp || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code now'}
              </button>
            </div>
          </div>
        )}

        {/* ── Password Fields (Locked until email is verified) ── */}
        {!isEmailVerified ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center transition-all">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-semibold text-foreground">Password creation locked</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Verify your work email address above to create your password and finalize your account.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Create password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="h-11 border-border bg-background pl-10 pr-11 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 transition-colors rounded-xl text-sm"
                  {...registerField('password')}
                />
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                  Confirm password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="h-11 border-border bg-background pl-10 pr-11 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 transition-colors rounded-xl text-sm"
                  {...registerField('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Terms and Privacy Checkbox */}
        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreedToTerms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setValue('agreedToTerms', checked === true)}
              className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="agreedToTerms"
              className="text-xs leading-relaxed text-muted-foreground cursor-pointer font-normal"
            >
              I agree to the{' '}
              <Link
                to="/terms-and-privacy?tab=terms"
                className="text-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/terms-and-privacy?tab=privacy"
                className="text-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.agreedToTerms.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={mutation.isPending || !agreedToTerms || !isEmailVerified}
          className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Create Account
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

      {/* ── Google OAuth (Unchanged, no OTP required as requested) ────────────────────────────────── */}
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
        Sign up with Google
      </Button>

      {/* ── Footer ───────────────────────────────────────────── */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in instead
        </Link>
      </p>
    </div>
  )
}
