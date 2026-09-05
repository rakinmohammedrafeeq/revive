import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('revive-theme') as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // ignore
  }
  return 'system' // default to system preference
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => 
    getInitialTheme() === 'system' ? getSystemTheme() : getInitialTheme() as 'dark' | 'light'
  )

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  useEffect(() => {
    const root = document.documentElement
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
    
    setResolvedTheme(effectiveTheme)
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light')
    
    // Apply the effective theme
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
    
    try {
      localStorage.setItem('revive-theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const applySystemTheme = (matches: boolean) => {
      const newTheme = matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      const root = document.documentElement
      root.classList.remove('dark', 'light')
      if (newTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.add('light')
      }
    }

    const handleChange = (event: MediaQueryListEvent) => applySystemTheme(event.matches)

    // Initial check
    applySystemTheme(mediaQuery.matches)

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange as any)
      return () => mediaQuery.removeListener(handleChange as any)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
