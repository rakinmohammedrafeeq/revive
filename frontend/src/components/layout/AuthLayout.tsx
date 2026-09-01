import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { useAuth } from '@/contexts/AuthContext'
import {
  BarChart3,
  CreditCard,
  Lock,
  TrendingUp,
} from 'lucide-react'
import { getDefaultRouteByRole } from '@/lib/routeUtils'
import { AuthBackdrop } from '@/components/auth/AuthBackdrop'
import { AppFooter } from '@/components/layout/AppFooter'

const features = [
  {
    icon: CreditCard,
    title: 'Expense tracking',
    desc: 'Log and categorise every transaction instantly.',
  },
  {
    icon: BarChart3,
    title: 'Borrow & lend ledger',
    desc: 'Track money owed with full history.',
  },
  {
    icon: TrendingUp,
    title: 'Insights & reports',
    desc: 'Visual trends across your finances.',
  },
  {
    icon: Lock,
    title: 'Private by default',
    desc: 'Your data never leaves your workspace.',
  },
]

export function AuthLayout() {
  const { isAuthenticated, isReady } = useAuth()
  const location = useLocation()

  const showFooter = location.pathname === '/login' || location.pathname === '/register'
  const isForgotPasswordPage = location.pathname === '/forgot-password'

  if (!isReady) {
    return null
  }

  // Allow authenticated users to access forgot password page
  if (isAuthenticated && !isForgotPasswordPage) {
    return <Navigate to={getDefaultRouteByRole()} replace />
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a12] text-white">
      <AuthBackdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center pt-10 sm:pt-12 lg:pt-14">
        <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-14">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2">

            {/* ── LEFT: Branding ───────────────────────────────── */}
            <div className="flex flex-col justify-center gap-8 lg:gap-9">

              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <img src={APP_LOGO_SRC} alt="Ledgera" className="h-10 w-10" loading="eager" />
                <span className="text-xl font-semibold tracking-tight">Ledgera</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Your finances,{' '}
                  <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                    finally organised
                  </span>
                </h2>
                <p className="max-w-sm text-[15px] leading-relaxed text-white/45">
                  Track expenses, manage debts, and stay in control of your finances — all in one workspace.
                </p>
              </div>

              {/* Feature list */}
              <div className="grid grid-cols-1 gap-3.5">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 group">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-colors group-hover:border-primary/25 group-hover:bg-primary/[0.08]">
                      <Icon className="h-4 w-4 text-white/35 transition-colors group-hover:text-primary/80" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/75">{title}</p>
                      <p className="text-xs text-white/35">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Form ──────────────────────────────────── */}
            <div className="flex w-full items-center justify-center py-10 lg:py-0">
              <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
                <Outlet />
              </div>
            </div>

          </div>
        </div>
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="mt-16 sm:mt-20 lg:mt-24">
            <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-14">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
            <AppFooter />
          </div>
        )}
      </div>
    </div>
  )
}
