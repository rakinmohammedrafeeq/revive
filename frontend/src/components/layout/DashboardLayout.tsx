import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { Navbar } from './Navbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useSidebar } from '@/contexts/SidebarContext'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isCollapsed } = useSidebar()

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-72'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Ambient background - deeper, more dramatic */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-primary/[0.06] blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden flex-shrink-0 md:block ${sidebarWidth} transition-all duration-300 relative z-10`}>
        <div className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} transition-all duration-300`}>
          <AppSidebar />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 h-full glass-card border-r border-white/10">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <AppSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
