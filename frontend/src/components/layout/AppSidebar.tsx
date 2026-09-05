import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  TrendingUp,
  Brain,
  PlayCircle,
  ShieldCheck,
  ScrollText,
  Sparkles,
  Shield,
  Pin,
  PinOff
} from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/contexts/AuthContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItemDef {
  title: string
  href: string
  icon: any
  label: string
}

const mainNav: readonly NavItemDef[] = [
  { title: 'Command Center', href: '/app/dashboard', icon: LayoutDashboard, label: 'Recovery overview' },
  { title: 'Recovery Cases', href: '/app/recovery', icon: TrendingUp, label: 'Active cases' },
  { title: 'ML Performance', href: '/app/ml-performance', icon: Brain, label: 'Model accuracy' },
  { title: 'Batch Evaluation', href: '/app/batch-evaluation', icon: PlayCircle, label: 'Batch validation' },
  { title: 'Policies', href: '/app/policies', icon: ShieldCheck, label: 'Guardrails' },
  { title: 'Audit Trail', href: '/app/audit', icon: ScrollText, label: 'Activity log' },
]

interface AppSidebarProps {
  onClose?: () => void
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation()
  const { isCollapsed, isPinned, setIsCollapsed, togglePin } = useSidebar()
  const { user } = useAuth()

  // Strictly Admin-only
  const isAdmin = user?.role === 'ADMIN'

  const adminNav: NavItemDef[] = [
    ...(isAdmin ? [{ title: 'User Management', href: '/app/admin/users', icon: Shield, label: 'Platform users & demo seed' }] : []),
  ]

  const handleNavClick = () => {
    onClose?.()
  }

  const isActive = (href: string) =>
    location.pathname === href || (href !== '/app/dashboard' && location.pathname.startsWith(href))

  const renderNavList = (items: readonly { title: string; href: string; icon: any; label: string }[]) => (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.href)
        const navItem = (
          <Link
            key={item.href}
            to={item.href}
            onClick={(e) => {
              e.stopPropagation()
              handleNavClick()
            }}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-primary/15 text-foreground border border-primary/25 shadow-sm font-semibold'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground border border-transparent',
              isCollapsed && 'justify-center',
            )}
          >
            {/* Active glow */}
            {active && (
              <div className="absolute inset-0 rounded-xl bg-primary/5 blur-sm -z-10" />
            )}
            
            <item.icon
              className={cn(
                'h-[18px] w-[18px] flex-shrink-0 transition-all duration-200',
                active ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-primary group-hover:scale-105',
              )}
            />
            {!isCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="whitespace-nowrap font-semibold">{item.title}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            )}
            {!isCollapsed && active && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor] flex-shrink-0" />
            )}
          </Link>
        )

        return isCollapsed ? (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{navItem}</TooltipTrigger>
            <TooltipContent side="right" className="glass-card">
              <div className="font-semibold">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </TooltipContent>
          </Tooltip>
        ) : (
          navItem
        )
      })}
    </nav>
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={cn(
          "flex h-full flex-col rounded-2xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/40",
          "relative transition-all duration-300 overflow-hidden"
        )}
        onMouseEnter={() => !isPinned && setIsCollapsed(false)}
        onMouseLeave={() => !isPinned && setIsCollapsed(true)}
      >
        {/* Ambient emerald glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent" />
        
        <ScrollArea className="h-full flex-1" viewportClassName="scrollbar-none" scrollbarClassName="hidden">
          <div className="relative flex min-h-full flex-col pb-4">
            {/* ── Logo & Brand ────────────────────────────────── */}
            <div className={cn(
              "flex h-16 items-center gap-3 relative px-4 transition-all",
              isCollapsed ? "justify-center px-0" : "justify-between"
            )}>
              <div className={cn(
                "flex items-center gap-3 min-w-0 overflow-hidden",
                isCollapsed ? "justify-center" : "flex-1"
              )}>
                <div className="relative">
                  <img src={APP_LOGO_SRC} alt="Revive" className="h-8 w-8 flex-shrink-0" loading="eager" />
                  <div className="absolute -inset-1.5 rounded-full bg-primary/25 blur-md -z-10" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col transition-all duration-300">
                    <span className="text-base font-extrabold tracking-tight text-foreground">
                      REVIVE
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                      AI Revenue Recovery
                    </span>
                  </div>
                )}
              </div>
              
              {/* Pin/Lock Button */}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePin()
                  }}
                  className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-md border transition-all duration-200",
                    isPinned
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-background/50 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </button>
              )}
            </div>

            {/* Subtle Gradient Divider */}
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

            {/* ── Navigation ───────────────────────────────────── */}
            <div className="px-2.5 py-4 flex-1">
              <div className="space-y-5">
                {/* Section 1: Recovery Engine */}
                <div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 pb-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                        Recovery Engine
                      </p>
                    </div>
                  )}
                  {renderNavList(mainNav)}
                </div>

                {/* Section 2: Administration (Strictly Admin-only) */}
                {adminNav.length > 0 && (
                  <div>
                    {!isCollapsed && (
                      <div className="flex items-center gap-2 px-3 pb-2 pt-1">
                        <Shield className="h-3 w-3 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                          Administration
                        </p>
                      </div>
                    )}
                    {renderNavList(adminNav)}
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer status capsule ─────────────────────────── */}
            {!isCollapsed ? (
              <div className="px-3 pt-3 pb-2 border-t border-border/50">
                <div className="rounded-xl bg-background/60 border border-border/80 p-2.5 shadow-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">Razorpay Testnet</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Autonomous recovery active
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-3 flex justify-center border-t border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex h-2.5 w-2.5 cursor-pointer">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="glass-card">
                    <div className="font-semibold text-xs text-foreground">Razorpay Testnet</div>
                    <div className="text-[10px] text-emerald-400">Autonomous recovery active</div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
