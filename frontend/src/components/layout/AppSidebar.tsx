import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  ChevronsLeft, 
  Shield, 
  TrendingUp,
  FileBarChart,
  ShieldCheck,
  ScrollText,
  Sparkles
} from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal'
import { useState } from 'react'

const mainNav = [
  { title: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, label: 'Command center' },
  { title: 'Recovery', href: '/app/recovery', icon: TrendingUp, label: 'Active cases' },
  { title: 'Payments', href: '/app/records', icon: Receipt, label: 'All payments' },
  { title: 'Insights', href: '/app/insights', icon: FileBarChart, label: 'Analytics' },
  { title: 'Policies', href: '/app/policies', icon: ShieldCheck, label: 'Guardrails' },
  { title: 'Audit', href: '/app/audit', icon: ScrollText, label: 'Activity log' },
] as const

const teamNav = [{ title: 'Members', href: '/app/members', icon: Users, label: 'Team access' }] as const

const adminNav = [{ title: 'User Management', href: '/app/admin/users', icon: Shield, label: 'Platform admin' }] as const

interface AppSidebarProps {
  onClose?: () => void
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const showTeam = user?.role === 'ANALYST' || user?.role === 'ADMIN'
  const showAdmin = user?.role === 'ADMIN'
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)

  const handleNavClick = () => {
    onClose?.()
  }

  const isActive = (href: string) =>
    location.pathname === href || (href !== '/app/dashboard' && location.pathname.startsWith(href))

  const handleSidebarClick = (e: React.MouseEvent) => {
    // If sidebar is collapsed, expand it on any click
    if (isCollapsed) {
      toggleSidebar()
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={cn(
          "flex h-full min-h-screen flex-col glass-subtle",
          "border-r border-white/10",
          "relative",
          isCollapsed && "cursor-pointer"
        )}
        onClick={handleSidebarClick}
      >
        {/* Ambient emerald glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/5 to-transparent" />
        
        {/* Expand arrow button - appears when collapsed */}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              toggleSidebar()
            }}
            className="absolute top-1/2 -right-3 z-50 h-6 w-6 rounded-full glass-emerald-strong border border-primary/30 hover:scale-110 hover:glow-emerald-soft transition-all duration-200 shadow-lg"
          >
            <ChevronsLeft className="h-3.5 w-3.5 rotate-180 text-primary" />
          </Button>
        )}
        
        <ScrollArea className="h-full flex-1" viewportClassName="scrollbar-none" scrollbarClassName="hidden">
          <div className="relative flex min-h-screen flex-col pb-6 sm:pb-8">
            {/* ── Logo & Brand ────────────────────────────────── */}
            <div className={cn(
              "flex h-16 items-center gap-3 relative px-4",
              isCollapsed ? "justify-center px-0" : "justify-start"
            )}>
              <div className={cn(
                "flex items-center gap-3 min-w-0 overflow-hidden",
                isCollapsed ? "justify-center pl-6" : "flex-1"
              )}>
                <div className="relative">
                  <img src={APP_LOGO_SRC} alt="Revive" className="h-8 w-8 flex-shrink-0" loading="eager" />
                  <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md -z-10" />
                </div>
                <div className={cn(
                  "flex flex-col transition-all duration-300",
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                )}>
                  <span className="text-lg font-bold tracking-tight">
                    REVIVE
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Revenue Recovery
                  </span>
                </div>
              </div>
              {/* Collapse button - desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "h-7 w-7 flex-shrink-0 hover:bg-primary/10 transition-all duration-300 hidden md:flex",
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'
                )}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="bg-white/10" />

            {/* ── Workspace Switcher ───────────────────────────── */}
            <div className={cn(
              "py-3",
              isCollapsed ? "flex justify-center" : ""
            )}>
              <WorkspaceSwitcher onCreateClick={() => setShowCreateWorkspace(true)} />
            </div>

            <Separator className="bg-white/10" />

            {/* ── Navigation ───────────────────────────────────── */}
            <div className="px-3 py-5 flex-1">
              <div className="space-y-6">
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 pb-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                        Revenue Recovery
                      </p>
                    </div>
                  )}
                  <nav className="space-y-0.5">
                    {mainNav.map((item) => {
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
                              ? 'bg-primary/15 text-foreground border border-primary/20 shadow-sm'
                              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent',
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
                              active ? 'text-primary scale-110' : 'text-muted-foreground/70 group-hover:text-primary group-hover:scale-105',
                            )}
                          />
                          {!isCollapsed && (
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="whitespace-nowrap font-semibold">{item.title}</span>
                              <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
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
                </div>

                {showTeam ? (
                  <div className="space-y-1">
                    {!isCollapsed && (
                      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Organization
                      </p>
                    )}
                    <nav className="space-y-0.5">
                      {teamNav.map((item) => {
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
                                ? 'bg-primary/15 text-foreground border border-primary/20'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent',
                              isCollapsed && 'justify-center',
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-[18px] w-[18px] flex-shrink-0 transition-all duration-200',
                                active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-primary',
                              )}
                            />
                            {!isCollapsed && (
                              <div className="flex flex-col flex-1">
                                <span className="whitespace-nowrap font-semibold">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground/60">{item.label}</span>
                              </div>
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
                  </div>
                ) : null}

                {showAdmin ? (
                  <div className="space-y-1">
                    {!isCollapsed && (
                      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Platform Admin
                      </p>
                    )}
                    <nav className="space-y-0.5">
                      {adminNav.map((item) => {
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
                                ? 'bg-primary/15 text-foreground border border-primary/20'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent',
                              isCollapsed && 'justify-center',
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-[18px] w-[18px] flex-shrink-0 transition-all duration-200',
                                active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-primary',
                              )}
                            />
                            {!isCollapsed && (
                              <div className="flex flex-col flex-1">
                                <span className="whitespace-nowrap font-semibold">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground/60">{item.label}</span>
                              </div>
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
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ── Create Workspace Modal ──────────────────────────── */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
      />
    </TooltipProvider>
  )
}
