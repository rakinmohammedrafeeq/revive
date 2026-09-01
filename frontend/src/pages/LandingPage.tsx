import { APP_LOGO_SRC } from '@/config/brandAssets'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CreditCard,
  Lock,
  TrendingUp,
  Sparkles,
  Image,
  Shield,
  Brain,
} from 'lucide-react'
import { AppFooter } from '@/components/layout/AppFooter'
import { InteractiveShowcase } from '@/components/landing/InteractiveShowcase'

export function LandingPage() {
  const { isAuthenticated, isReady } = useAuth()

  // Redirect authenticated users to dashboard
  if (isReady && isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered',
      desc: 'Smart categorization, receipt scanning, and personalized financial insights.',
    },
    {
      icon: Brain,
      title: 'Financial Advisor',
      desc: 'Chat with AI for investment advice, portfolio tips, and wealth-building strategies.',
    },
    {
      icon: Sparkles,
      title: 'AI Agent',
      desc: 'Autonomous AI agent with tool-calling — query data, analyze trends, and create transactions by just asking.',
    },
    {
      icon: BarChart3,
      title: 'Team Workspaces',
      desc: 'Collaborate with your team using shared workspaces and role-based access.',
    },
    {
      icon: Shield,
      title: 'Secure & Fast',
      desc: 'Google sign-in, encrypted data, and enterprise-grade security.',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      desc: 'Interactive dashboards with spending trends and category breakdowns.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute -bottom-32 right-[-80px] h-[380px] w-[380px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative">
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="mx-auto flex max-w-6xl flex-col px-6 pb-10 pt-10 sm:px-10 lg:pt-12">
          {/* ── Nav ─────────────────────────────────────────── */}
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={APP_LOGO_SRC}
                alt="Ledgera"
                className="h-9 w-9"
                loading="eager"
              />
              <span className="text-lg font-semibold tracking-tight">Ledgera</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </header>

          {/* ── Hero ─────────────────────────────────────────── */}
          <main className="mt-32 grid gap-12 lg:mt-40 lg:grid-cols-12 lg:items-center" style={{ animation: 'slide-up 600ms ease-out both' }}>
            <div className="space-y-7 lg:col-span-7">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
                AI-powered finance tracking,
                <span className="block bg-gradient-to-r from-primary/80 via-primary to-primary/80 bg-clip-text text-transparent">
                  built for modern teams.
                </span>
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-white/45">
                Smart categorization, receipt scanning, AI Agent with tool-calling, RAG financial advisor, and team workspaces. 
                Track expenses, get insights, and collaborate seamlessly.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* ── Interactive Showcase ──────────────────────────────── */}
            <div className="lg:col-span-5">
              <InteractiveShowcase />
            </div>
          </main>

          {/* ── Features ─────────────────────────────────────── */}
          <section className="mt-40 lg:mt-48">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">AI Agent, RAG Advisor & Enterprise Security</h2>
              <p className="mt-1 text-sm text-white/40">Autonomous AI tools, intelligent insights, and secure collaboration.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:border-primary/20 hover:bg-white/[0.035]"
                >
                  <div className="mb-3.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/40 transition-colors group-hover:border-primary/20 group-hover:text-primary/70">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium text-white/80">{title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-white/40">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ──────────────────────────────────────────── */}
          <section className="mt-16 lg:mt-24">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold">Start tracking today</h3>
                  <p className="mt-1 text-sm text-white/40">Create your workspace in seconds.</p>
                </div>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                >
                  Create account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        <AppFooter />
      </div>
    </div>
  )
}
