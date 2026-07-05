import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUI } from '../../contexts/UIContext';

export default function AppShell({ children }) {
  const { isSidebarCollapsed } = useUI();

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep-blue)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingLeft: isSidebarCollapsed ? '80px' : '260px', transition: 'padding-left var(--duration-normal) var(--ease-standard)' }}>
        <Topbar />
        <main className="main-content-area" style={{ flex: 1, padding: 'var(--space-8) var(--space-8) var(--space-12)', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
