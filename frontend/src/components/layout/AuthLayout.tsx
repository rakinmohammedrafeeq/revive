import { Outlet, Navigate, useLocation, Link } from 'react-router-dom'
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
    title: 'Real-time detection',
    desc: 'Captures every failed payment instantly.',
  },
  {
    icon: BarChart3,
    title: 'AI diagnosis',
    desc: 'Understands why payments fail.',
  },
  {
    icon: TrendingUp,
    title: 'Smart recovery',
    desc: 'Brings revenue back intelligently.',
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
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center pt-8 sm:pt-12 lg:pt-14 pb-10">
          <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-14">
            <div className="grid w-full items-center gap-12 lg:grid-cols-2">

              {/* ── LEFT: Branding & Value Proposition ───────────────── */}
              <div className="flex flex-col justify-center gap-8 lg:gap-9">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity w-fit">
                  <img src={APP_LOGO_SRC} alt="Revive" className="h-10 w-10" loading="eager" />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight text-foreground">REVIVE</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      AI Revenue Recovery
                    </span>
                  </div>
                </Link>

                {/* Headline */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-foreground">
                    Recover your lost revenue,{' '}
                    <span className="text-gradient-emerald">
                      completely on autopilot
                    </span>
                  </h2>
                  <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
                    Stop losing 15% of checkout sales to bank timeouts and OTP drops. Revive automatically recovers your payments with zero manual hassle.
                  </p>
                </div>

                {/* Feature list */}
                <div className="grid grid-cols-1 gap-3.5">
                  {features.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3.5 group">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                        <Icon className="h-4 w-4 text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social Proof Metric Pill */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 max-w-md flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm">
                    72%
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Average Recovery Success Rate</p>
                    <p className="text-muted-foreground mt-0.5">Tested across 60+ failed checkout scenarios with Razorpay.</p>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Form Container ─────────────────────────────── */}
              <div className="flex w-full items-center justify-center">
                <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
                  <Outlet />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="mt-auto">
            <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-14">
              <div className="h-px w-full bg-border" />
            </div>
            <AppFooter />
          </div>
        )}
      </div>
    </div>
  )
}
