import React from 'react'
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

  const greeting = user?.name
    ? `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${user.name.split(' ')[0]}`
    : 'Good Morning, User'

  return (
    <header className="header">
      <div className="header-left header-lead">
        <div className="header-menu-title" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="menu-toggle" id="menuToggle" aria-label="Toggle Side menu drawer" onClick={toggleMobileDrawer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-title-stack">
            <h1 className="header-title" id="dashGreeting">
              {greeting.split(',')[0]}
              <span className="header-title-name">{greeting.split(',')[1] || ''}</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="header-right headerbar-toolbar">
        <div className="topbar-search" role="search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" placeholder="Search projects, clients, reports…" aria-label="Search" />
          <kbd className="topbar-search-kbd">⌘K</kbd>
        </div>

        <div className="location-selector topbar-workspace-chip" id="locationSelector">
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

        <NotificationMenu />

        <UserMenu />
      </div>
    </header>
  )
}