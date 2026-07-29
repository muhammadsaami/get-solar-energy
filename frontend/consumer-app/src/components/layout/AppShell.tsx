import React, { useEffect } from 'react'
import { useUI } from '../../contexts/UIContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import DashboardSprites from '../dashboard/DashboardSprites'
import ToastHost from '../auth/ToastHost'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isSidebarCollapsed } = useUI() as unknown as { isSidebarCollapsed: boolean }

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [isSidebarCollapsed])

  return (
    <div className="app-container">
      <DashboardSprites />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <main className="main-panel" id="main-content">
        <Topbar />
        {children}
      </main>
      <ToastHost />
    </div>
  )
}
