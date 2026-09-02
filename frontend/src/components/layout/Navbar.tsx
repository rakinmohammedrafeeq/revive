import { Menu, Moon, Sun, Monitor, Check, User as UserIcon, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const { user } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const [showChangeNameDialog, setShowChangeNameDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-white/10 glass-subtle">
      {/* Ambient emerald glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden ml-2 hover:bg-primary/10"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side */}
      <div className="flex items-center gap-2 mr-4">
        {/* Theme Toggle */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              id="theme-toggle"
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="relative h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
            >
              <Sun
                className={cn(
                  'absolute h-5 w-5 transition-all duration-300',
                  isDark
                    ? 'rotate-90 scale-0 opacity-0'
                    : 'rotate-0 scale-100 opacity-100',
                )}
              />
              <Moon
                className={cn(
                  'absolute h-5 w-5 transition-all duration-300',
                  isDark
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-0 opacity-0',
                )}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="glass-card">
            <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer rounded-lg">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer rounded-lg">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer rounded-lg">
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="relative h-10 w-10 rounded-full ring-1 ring-primary/20 transition-all hover:ring-primary/40 hover:scale-105"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold border border-primary/20">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Active indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_currentColor]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="bottom" 
            sideOffset={8}
            className="w-64 glass-card"
          >
            <DropdownMenuLabel className="font-normal pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 mt-0.5">
                  <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold border border-primary/20">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 min-w-0 overflow-hidden flex-1">
                  <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={() => setShowChangeNameDialog(true)} className="cursor-pointer rounded-lg">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Update your name</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowChangePasswordDialog(true)} className="cursor-pointer rounded-lg">
              <Lock className="mr-2 h-4 w-4" />
              <span>Change password</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <LogoutConfirm
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer rounded-lg">
                  Sign out
                </DropdownMenuItem>
              }
              title="Sign out?"
              description="You'll need to sign in again to access Revive."
              confirmText="Sign out"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
    </header>
  )
}
