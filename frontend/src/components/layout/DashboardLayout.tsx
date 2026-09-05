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
  const placeholderWidth = isCollapsed ? 'w-[92px]' : 'w-[300px]'

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Ambient background glow & subtle tech grid */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-primary/[0.06] blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[550px] w-[550px] rounded-full bg-emerald-500/[0.03] blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/[0.03] blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Desktop Floating Sidebar Dock */}
      <aside className={`hidden flex-shrink-0 md:block ${placeholderWidth} transition-all duration-300 relative z-30`}>
        <div className={`fixed top-3 bottom-3 left-3 z-30 ${sidebarWidth} transition-all duration-300`}>
          <AppSidebar />
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 h-full bg-card/95 border-r border-border backdrop-blur-2xl">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <AppSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10 md:pr-3">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="mx-auto max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
