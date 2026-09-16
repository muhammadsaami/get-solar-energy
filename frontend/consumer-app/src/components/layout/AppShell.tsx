import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
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
  const auth = useAuth() as unknown as { sessionFlash: { message: string; id: number } | null; dismissSessionFlash: () => void }

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [isSidebarCollapsed])

  return (
    <div className="app-container">
      <DashboardSprites />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {auth.sessionFlash && (
        <div className="session-flash" role="status" aria-live="polite" onClick={auth.dismissSessionFlash}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          <span>{auth.sessionFlash.message}</span>
        </div>
      )}
      <Sidebar />
      <main className="main-panel" id="main-content">
        <Topbar />
        <div className="page-transition-wrapper">
          {children}
        </div>
      </main>
      <ToastHost />
    </div>
  )
}
