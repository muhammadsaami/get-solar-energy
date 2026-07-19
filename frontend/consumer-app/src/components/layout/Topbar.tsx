import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUI } from '../../contexts/UIContext'
import NotificationMenu from './NotificationMenu'
import UserMenu from './UserMenu'

interface AuthUser {
  name: string
  role: string
  avatar?: string
}

export default function Topbar() {
  const { user } = useAuth() as unknown as { user: AuthUser | null; loading: boolean }
  const { toggleMobileDrawer } = useUI() as unknown as { toggleMobileDrawer: () => void }
  const location = useLocation()

  const pathParts = location.pathname.split('/').filter(x => x && x !== 'app')
  const breadcrumbText = pathParts.length > 0
    ? pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
    : 'Dashboard'

  const greeting = user?.name
    ? `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user.name.split(' ')[0]}`
    : 'Good Morning, User'

  return (
    <header className="header">
      <div className="header-left">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="menu-toggle" id="menuToggle" aria-label="Toggle Side menu drawer" onClick={toggleMobileDrawer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="header-title">
            {breadcrumbText === 'Dashboard' ? greeting : breadcrumbText}
            {breadcrumbText === 'Dashboard' && <span className="wave">👋</span>}
          </h1>
        </div>
        <span className="header-subtitle">
          {breadcrumbText === 'Dashboard'
            ? "Here's what's happening with your solar journey today."
            : `Manage your ${breadcrumbText.toLowerCase()} settings`}
        </span>
      </div>

      <div className="header-right">
        <div className="location-selector" id="locationSelector">
          <button className="location-btn" aria-haspopup="listbox" aria-expanded="false">
            <svg className="pin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span id="currentLocation">Location Not Set</span>
            <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <NotificationMenu notificationCount={0} />

        <UserMenu />
      </div>
    </header>
  )
}
