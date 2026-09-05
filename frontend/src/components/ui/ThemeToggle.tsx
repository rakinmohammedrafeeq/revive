import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  variant?: 'ghost' | 'outline' | 'default'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ThemeToggle({ className, variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button
      variant={variant}
      size={size}
      aria-label="Toggle theme"
      onClick={cycleTheme}
      className={cn(
        'relative rounded-xl transition-all duration-200',
        variant === 'ghost' && 'hover:bg-white/10',
        variant === 'outline' && 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]',
        className
      )}
      title={`Current: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'} - Click to change`}
    >
      <Sun
        className={cn(
          'absolute h-[1.2rem] w-[1.2rem] transition-all duration-300',
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0',
        )}
      />
      <Moon
        className={cn(
          'absolute h-[1.2rem] w-[1.2rem] transition-all duration-300',
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0',
        )}
      />
      <Monitor
        className={cn(
          'absolute h-[1.2rem] w-[1.2rem] transition-all duration-300',
          theme === 'system'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0',
        )}
      />
    </Button>
  )
}
