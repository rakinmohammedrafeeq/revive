import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  isPinned: boolean
  toggleSidebar: () => void
  togglePin: () => void
  setIsCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Always start with sidebar collapsed and unpinned
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isPinned, setIsPinned] = useState(false)

  const toggleSidebar = () => setIsCollapsed((prev) => !prev)
  const togglePin = () => {
    setIsPinned((prev) => !prev)
    if (!isPinned) {
      // When pinning, expand the sidebar
      setIsCollapsed(false)
    }
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, isPinned, toggleSidebar, togglePin, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}
