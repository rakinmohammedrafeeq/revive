import { Menu, Moon, Sun, Monitor, Check, User as UserIcon, Lock } from 'lucide-react'
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
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-lg md:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              id="theme-toggle"
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="relative h-12 w-12 overflow-hidden transition-colors duration-150 hover:bg-muted"
            >
              <Sun
                className={cn(
                  'absolute h-6 w-6 transition-all duration-300',
                  isDark
                    ? 'rotate-90 scale-0 opacity-0'
                    : 'rotate-0 scale-100 opacity-100',
                )}
              />
              <Moon
                className={cn(
                  'absolute h-6 w-6 transition-all duration-300',
                  isDark
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-0 opacity-0',
                )}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-36">
            <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="relative h-10 w-10 rounded-full ring-1 ring-border/50 transition-all hover:ring-primary/30"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/12 text-primary text-sm font-semibold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="bottom" 
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                {user?.role === 'ADMIN' && (
                  <p className="text-[11px] font-medium text-primary/80 truncate">Platform Administrator</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowChangeNameDialog(true)} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              Change Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowChangePasswordDialog(true)} className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutConfirm
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              }
              title="Sign out?"
              description="Are you sure you want to sign out?"
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
