import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResetPasswordMutation } from '@/hooks'
import { useState } from 'react'

const schema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: tokenFromQuery,
    },
  })

  const mutation = useResetPasswordMutation()
  const password = watch('newPassword')

  // Calculate password strength
  useState(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    setPasswordStrength(Math.min(strength, 4))
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(
      { token: data.token, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success('Password updated successfully!', {
            description: 'You can now sign in with your new password.',
          })
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 1500)
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? 'Failed to reset password'
          toast.error('Reset failed', {
            description: message,
          })
        },
      },
    )
  }

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-600'
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength === 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength === 3) return 'Good'
    return 'Strong'
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>

      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50">
          <KeyRound className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Set new password</h1>
          <p className="text-sm text-white/50">
            Choose a strong password to secure your account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {!tokenFromQuery && (
          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium text-white/70">
              Reset token
            </Label>
            <Input
              id="token"
              placeholder="Enter your reset token"
              className="h-11 border-white/[0.08] bg-white/[0.03] font-mono text-sm text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
              {...register('token')}
            />
            {errors.token && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />
                {errors.token.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-sm font-medium text-white/70">
            New password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus={!!tokenFromQuery}
              placeholder="Enter a strong password"
              className="h-11 border-white/[0.08] bg-white/[0.03] pr-10 text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/60"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
                {passwordStrength > 0 && (
                  <span className="text-xs font-medium text-white/60">{getStrengthText()}</span>
                )}
              </div>
              
              <div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-medium text-white/60">Password requirements:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className={`h-3 w-3 ${password.length >= 8 ? 'text-green-400' : 'text-white/20'}`} />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className={`h-3 w-3 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-400' : 'text-white/20'}`} />
                    Upper and lowercase letters
                  </li>
                  <li className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className={`h-3 w-3 ${/\d/.test(password) ? 'text-green-400' : 'text-white/20'}`} />
                    At least one number
                  </li>
                  <li className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className={`h-3 w-3 ${/[^a-zA-Z0-9]/.test(password) ? 'text-green-400' : 'text-white/20'}`} />
                    Special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {errors.newPassword && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password…
            </>
          ) : (
            'Update password'
          )}
        </Button>
      </form>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs text-white/40">
          <span className="font-medium text-white/60">Security tip:</span> Use a unique password 
          that you don't use for other accounts. Consider using a password manager.
        </p>
      </div>
    </div>
  )
}
