import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { Navbar } from './Navbar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useSidebar } from '@/contexts/SidebarContext'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isCollapsed } = useSidebar()

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64'

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className={`hidden flex-shrink-0 md:block ${sidebarWidth} transition-all duration-300`}>
        <div className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} border-r border-sidebar-border transition-all duration-300`}>
          <AppSidebar />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 h-full">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <AppSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto bg-background p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
