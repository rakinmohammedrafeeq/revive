import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Receipt, Users, ChevronsLeft, ChevronsRight, Shield, Brain } from 'lucide-react'
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
  { title: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { title: 'Records', href: '/app/records', icon: Receipt },
  { title: 'AI Tools', href: '/app/advisor', icon: Brain },
] as const

const teamNav = [{ title: 'Members', href: '/app/members', icon: Users }] as const

const adminNav = [{ title: 'User Management', href: '/app/admin/users', icon: Shield }] as const

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
          "flex h-full min-h-screen flex-col bg-sidebar text-sidebar-foreground",
          isCollapsed && "cursor-pointer"
        )}
        onClick={handleSidebarClick}
      >
        <ScrollArea className="h-full flex-1" viewportClassName="scrollbar-none" scrollbarClassName="hidden">
          <div className="flex min-h-screen flex-col pb-6 sm:pb-8">
            {/* ── Logo & Toggle ────────────────────────────────── */}
            <div className={cn(
              "flex h-16 items-center gap-3 relative",
              isCollapsed ? "px-0 justify-center" : "px-4 justify-start"
            )}>
              <div className={cn(
                "flex items-center gap-2.5 min-w-0 overflow-hidden",
                isCollapsed ? "justify-center pl-6" : "flex-1"
              )}>
                <img src={APP_LOGO_SRC} alt="Ledgera" className="h-8 w-8 flex-shrink-0" loading="eager" />
                <span className={`text-lg font-semibold tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 overflow-hidden text-ellipsis'}`}>
                  Ledgera
                </span>
              </div>
              {/* Hide collapse button in mobile drawer, only show on desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={`h-7 w-7 flex-shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 hidden md:block ${isCollapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'}`}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="bg-sidebar-border" />

            {/* ── Workspace Switcher ───────────────────────────── */}
            <div className={cn(
              "py-3",
              isCollapsed ? "flex justify-center" : ""
            )}>
              <WorkspaceSwitcher onCreateClick={() => setShowCreateWorkspace(true)} />
            </div>

            <Separator className="bg-sidebar-border" />

            {/* ── Navigation ───────────────────────────────────── */}
            <div className="px-3 py-5 flex-1">
              <div className="space-y-6">
                <div className="space-y-1">
                  {!isCollapsed && (
                    <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                      Main
                    </p>
                  )}
                  <nav className="space-y-0.5">
                    {mainNav.map((item) => {
                      const active = isActive(item.href)
                      const navItem = (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={(e) => {
                            e.stopPropagation() // Prevent sidebar expansion
                            handleNavClick()
                          }}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                            active
                              ? 'bg-sidebar-accent text-sidebar-foreground'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                            isCollapsed && 'justify-center',
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150',
                              active ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-primary/70',
                            )}
                          />
                          {!isCollapsed && (
                            <>
                              <span className="whitespace-nowrap">{item.title}</span>
                              {active && (
                                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </>
                          )}
                        </Link>
                      )

                      return isCollapsed ? (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                          <TooltipContent side="right">{item.title}</TooltipContent>
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
                      <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
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
                              e.stopPropagation() // Prevent sidebar expansion
                              handleNavClick()
                            }}
                            className={cn(
                              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                              active
                                ? 'bg-sidebar-accent text-sidebar-foreground'
                                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                              isCollapsed && 'justify-center',
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150',
                                active ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-primary/70',
                              )}
                            />
                            {!isCollapsed && (
                              <>
                                <span className="whitespace-nowrap">{item.title}</span>
                                {active && (
                                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </>
                            )}
                          </Link>
                        )

                        return isCollapsed ? (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                            <TooltipContent side="right">{item.title}</TooltipContent>
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
                      <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
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
                              e.stopPropagation() // Prevent sidebar expansion
                              handleNavClick()
                            }}
                            className={cn(
                              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                              active
                                ? 'bg-sidebar-accent text-sidebar-foreground'
                                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                              isCollapsed && 'justify-center',
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150',
                                active ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-primary/70',
                              )}
                            />
                            {!isCollapsed && (
                              <>
                                <span className="whitespace-nowrap">{item.title}</span>
                                {active && (
                                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </>
                            )}
                          </Link>
                        )

                        return isCollapsed ? (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                            <TooltipContent side="right">{item.title}</TooltipContent>
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
