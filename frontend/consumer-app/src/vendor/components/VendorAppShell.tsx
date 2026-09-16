import React from 'react'
import VendorSidebar from './VendorSidebar'
import VendorTopbar from './VendorTopbar'
import DashboardSprites from '../../components/dashboard/DashboardSprites'
import '../styles/vendor-theme.css'

interface VendorAppShellProps {
  children: React.ReactNode
}

export function VendorAppShell({ children }: VendorAppShellProps) {
  return (
    <div className="vendor-portal-root">
      <DashboardSprites />
      <div className="vendor-bg-mesh" />

      {/* Independent Vendor Sidebar */}
      <VendorSidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, zIndex: 1 }}>
        <VendorTopbar />
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default VendorAppShell
