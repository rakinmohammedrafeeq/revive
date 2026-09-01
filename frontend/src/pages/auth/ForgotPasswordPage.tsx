import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LedgeraSpinner } from '@/components/ui/fintrix-spinner'
import { useForgotPasswordMutation } from '@/hooks'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const mutation = useForgotPasswordMutation()
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data, {
      onSuccess: () => {
        setEmailSent(true)
        setSubmittedEmail(data.email)
        toast.success('Password reset email sent!', {
          description: 'Check your inbox for reset instructions.',
        })
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Could not process request'
        toast.error('Request failed', {
          description: message,
        })
      },
    })
  }

  if (emailSent) {
    return (
      <div className="relative mx-auto w-full max-w-md space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Check your email</h1>
            <p className="text-sm text-white/60">
              We've sent password reset instructions to
            </p>
            <p className="text-sm font-medium text-primary">{submittedEmail}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/80">Check your inbox</p>
              <p className="text-xs text-white/40">
                Look for an email from Ledgera with reset instructions
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/80">Click the reset link</p>
              <p className="text-xs text-white/40">
                The link expires in 15 minutes for security
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/80">Set your new password</p>
              <p className="text-xs text-white/40">
                Choose a strong, unique password
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-yellow-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-200">Didn't receive the email?</p>
              <p className="text-xs text-yellow-200/60">
                Check your spam folder or{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="font-medium text-yellow-300 underline hover:text-yellow-200"
                >
                  try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-md space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {mutation.isPending && (
        <div className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-black/50 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-black/70 p-6 text-center shadow-2xl">
            <LedgeraSpinner size={48} className="mx-auto" alt="Sending reset email" />
            <p className="mt-4 text-sm font-medium text-white">Sending reset email</p>
            <p className="mt-1 text-xs text-white/50">This will only take a moment…</p>
          </div>
        </div>
      )}

      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50">
          <Mail className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
          <p className="text-sm text-white/50">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-white/70">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="h-11 border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-primary/30"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
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
              Sending…
            </>
          ) : (
            'Send reset instructions'
          )}
        </Button>

        <div className="space-y-3 pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0a0a12] px-2 text-white/30">or</span>
            </div>
          </div>

          <p className="text-center text-xs text-white/40">
            Already have a reset token?{' '}
            <Link to="/reset-password" className="font-medium text-primary/80 hover:text-primary">
              Enter it here
            </Link>
          </p>
        </div>
      </form>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs text-white/40">
          <span className="font-medium text-white/60">Security note:</span> For your protection, 
          reset links expire after 15 minutes and can only be used once.
        </p>
      </div>
    </div>
  )
}
