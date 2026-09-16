import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useUI } from '../../contexts/UIContext'
import LocationSelector from './LocationSelector'
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
        <LocationSelector />

        <NotificationMenu />

        <UserMenu />
      </div>
    </header>
  )
}