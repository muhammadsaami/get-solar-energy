import React, { useEffect } from 'react'
import { useUI } from '../../contexts/UIContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

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
    <div className="app-shell">
      <div className="app-container">
        <Sidebar />
        <main className="main-panel" id="main-content">
          <a href="#main-content" className="skip-link" style={{ position: 'absolute', left: '-9999px' }}>
            Skip to main content
          </a>
          <Topbar />
          <div className="tab-content active" role="tabpanel">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
