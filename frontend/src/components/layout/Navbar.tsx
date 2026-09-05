import { 
  Menu, 
  Moon, 
  Sun, 
  Monitor, 
  User as UserIcon, 
  Lock, 
  Sparkles, 
  X, 
  Shield, 
  LayoutDashboard,
  TrendingUp,
  Brain,
  PlayCircle,
  ShieldCheck,
  ScrollText
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LogoutConfirm } from '@/components/auth/LogoutConfirm'
import { ChangeNameDialog } from '@/components/user/ChangeNameDialog'
import { ChangePasswordDialog } from '@/components/user/ChangePasswordDialog'
import { useState } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const [showChangeNameDialog, setShowChangeNameDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getDisplayName = () => {
    if (user?.name && user.name.trim().toLowerCase() !== 'admin') return user.name
    if (user?.email === 'rakinmohammedrafeeq@gmail.com') return 'Rakin Mohammed Rafeeq'
    return user?.name || 'User'
  }
  const displayName = getDisplayName()
  const displayFirstName = displayName.split(' ')[0] || displayName
  const displayInitials = getInitials(displayName)

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  // Determine active page context for breadcrumb display
  const getPageContext = () => {
    const path = location.pathname
    if (path.includes('/app/admin/users')) {
      return { category: 'Administration', title: 'User Management', icon: Shield }
    }
    if (path.includes('/app/dashboard')) {
      return { category: 'Platform', title: 'Command Center', icon: LayoutDashboard }
    }
    if (path.includes('/app/recovery')) {
      return { category: 'Recovery', title: 'Cases', icon: TrendingUp }
    }
    if (path.includes('/app/ml-performance')) {
      return { category: 'Intelligence', title: 'ML Performance', icon: Brain }
    }
    if (path.includes('/app/batch-evaluation')) {
      return { category: 'Diagnostics', title: 'Batch Evaluation', icon: PlayCircle }
    }
    if (path.includes('/app/policies')) {
      return { category: 'Guardrails', title: 'Policies', icon: ShieldCheck }
    }
    if (path.includes('/app/audit')) {
      return { category: 'Compliance', title: 'Audit Trail', icon: ScrollText }
    }
    return { category: 'Dashboard', title: 'Overview', icon: LayoutDashboard }
  }

  const pageContext = getPageContext()

  return (
    <>
      <header className="sticky top-3 z-30 my-3 ml-1 mr-2 sm:mr-4 flex h-14 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/85 backdrop-blur-2xl px-3.5 sm:px-5 shadow-lg shadow-black/30 transition-all">
        {/* Left Side: Mobile Menu Toggle + Contextual Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-1 h-9 w-9 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-foreground"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs truncate">
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="font-semibold text-foreground/75 tracking-tight">Revive</span>
              <span className="text-muted-foreground/40 font-mono">/</span>
              <span className="text-muted-foreground/80">{pageContext.category}</span>
              <span className="text-muted-foreground/40 font-mono">/</span>
            </div>
            <div className="flex items-center gap-1.5">
              <pageContext.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-bold text-foreground tracking-tight text-sm truncate">
                {pageContext.title}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Status Telemetry + Workspace + Theme + User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live Autonomous Engine Telemetry Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Engine</span>
          </div>

          {/* Theme Toggle Button */}
          <Button
            id="theme-toggle"
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={cycleTheme}
            className="relative h-9 w-9 rounded-xl border border-border/60 bg-background/50 hover:bg-accent transition-all duration-200"
            title={`Current: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'} - Click to change`}
          >
            <Sun
              className={cn(
                'absolute h-4 w-4 transition-all duration-300',
                theme === 'light'
                  ? 'rotate-0 scale-100 opacity-100'
                  : 'rotate-90 scale-0 opacity-0',
              )}
            />
            <Moon
              className={cn(
                'absolute h-4 w-4 transition-all duration-300',
                theme === 'dark'
                  ? 'rotate-0 scale-100 opacity-100'
                  : '-rotate-90 scale-0 opacity-0',
              )}
            />
            <Monitor
              className={cn(
                'absolute h-4 w-4 transition-all duration-300',
                theme === 'system'
                  ? 'rotate-0 scale-100 opacity-100'
                  : 'rotate-90 scale-0 opacity-0',
              )}
            />
          </Button>

          {/* User Profile Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowUserMenu(true)}
            className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-xl border border-border/60 bg-background/50 hover:bg-accent transition-all"
          >
            <div className="relative">
              <Avatar className="h-7 w-7 ring-1 ring-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {displayInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-card shadow-[0_0_6px_#10b981]" />
            </div>
            <span className="text-xs font-semibold text-foreground hidden sm:inline-block max-w-[90px] truncate">
              {displayFirstName}
            </span>
            {user?.role === 'ADMIN' && (
              <span className="hidden md:inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">
                Admin
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* User Menu Modal */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowUserMenu(false)}
        >
          <div 
            className="fixed top-20 right-4 w-80 bg-white dark:bg-card text-foreground dark:text-card-foreground rounded-2xl p-6 animate-slide-down shadow-lg dark:shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowUserMenu(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* User Info */}
            <div className="flex items-start gap-3 mb-6">
              <Avatar className="h-12 w-12 mt-0.5">
                <AvatarFallback className="bg-primary/15 text-primary text-base font-bold border border-primary/20">
                  {displayInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 min-w-0 overflow-hidden flex-1">
                <p className="text-base font-semibold truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                      Platform Admin
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  setShowChangeNameDialog(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-left"
              >
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Update your name</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false)
                  setShowChangePasswordDialog(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-left"
              >
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Change password</span>
              </button>

              {/* Admin Panel (Admin Only) */}
              {user?.role === 'ADMIN' && (
                <>
                  <div className="h-px bg-border my-1.5" />
                  <Link
                    to="/app/admin/users"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-left text-primary"
                  >
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Admin Panel</span>
                  </Link>
                </>
              )}

              <div className="h-px bg-border my-1.5" />

              <LogoutConfirm
                trigger={
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-left text-red-600 dark:text-red-400">
                    <span className="text-sm font-medium">Sign out</span>
                  </button>
                }
                title="Sign out?"
                description="You'll need to sign in again to access Revive."
                confirmText="Sign out"
              />
            </div>
          </div>
        </div>
      )}

      {/* Change Name Dialog */}
      <ChangeNameDialog
        isOpen={showChangeNameDialog}
        onClose={() => setShowChangeNameDialog(false)}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
      />
    </>
  )
}
