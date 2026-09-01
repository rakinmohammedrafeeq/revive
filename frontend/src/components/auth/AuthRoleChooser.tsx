import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, TrendingUp, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

const roleOptions = [
  {
    role: 'VIEWER' as const satisfies Role,
    icon: Wallet,
    title: 'Viewer',
    description: 'Track expenses and manage borrow/lend activity.',
    features: ['Expenses', 'Borrow/Lend', 'Private'],
    iconColor: 'bg-primary/10 border-primary/20 text-primary',
    hoverBorder: 'hover:border-primary/30',
    ctaColor: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  {
    role: 'ANALYST' as const satisfies Role,
    icon: TrendingUp,
    title: 'Analyst',
    description: 'Deeper reporting and analytics across your finances.',
    features: ['Reports', 'Analytics', 'Power tools'],
    iconColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    hoverBorder: 'hover:border-blue-500/30',
    ctaColor: 'bg-blue-500 hover:bg-blue-400 text-white',
  },
  {
    role: 'ADMIN' as const satisfies Role,
    icon: ShieldCheck,
    title: 'Administrator',
    description: 'Full workspace control — users, monitoring, oversight.',
    features: ['Users', 'Monitoring', 'Oversight'],
    iconColor: 'bg-primary/10 border-primary/20 text-primary',
    hoverBorder: 'hover:border-primary/30',
    ctaColor: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
]

export function AuthRoleChooser() {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Choose access level
        </h1>
        <p className="text-sm text-white/40">
          Sign in or create an account — you can switch later.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {roleOptions.map((option) => {
          const Icon = option.icon

          return (
            <div
              key={option.role}
              className={cn(
                'group relative flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200',
                'hover:bg-white/[0.04]',
                option.hoverBorder,
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                    option.iconColor,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{option.title}</p>
                  <p className="text-xs text-white/40">{option.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150',
                    option.ctaColor,
                  )}
                >
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/[0.08] bg-transparent px-3.5 py-2 text-sm font-medium text-white/55 transition-all duration-150 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/80"
                >
                  Create account
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
