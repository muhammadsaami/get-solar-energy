import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../config/routes'
import { getDisplayRole } from '../../utils/role'

interface AuthUser {
  name: string
  role: string
  avatar?: string
}

export default function UserMenu() {
  const { user, logout } = useAuth() as unknown as { user: AuthUser | null; logout: () => void }
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const initials = user?.name
    ? user.name.split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2)
    : 'GU'

  const userName = user?.name || 'User'
  const userRole = getDisplayRole(user?.role)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LANDING)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="profile-pill"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
        tabIndex={0}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(prev => !prev) }}
      >
        <div className="profile-avatar profile-avatar-initials" aria-hidden="true">
          {initials}
        </div>
        <div className="profile-info">
          <span className="profile-name">{userName}</span>
          <span className="profile-role">{userRole}</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div className="profile-dropdown" role="menu" aria-label="Profile menu">
          <div className="profile-dropdown-header">
            <div className="profile-avatar profile-avatar-initials" style={{ width: 36, height: 36, fontSize: 13 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>{userName}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{userRole}</div>
            </div>
          </div>
          <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-item" role="menuitem" tabIndex={0} onClick={() => { navigate(ROUTES.ACCOUNT_PROFILE); setIsOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Profile
          </button>
          <button className="profile-dropdown-item" role="menuitem" tabIndex={0} onClick={() => { navigate(ROUTES.ACCOUNT_SETTINGS); setIsOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
            Account Settings
          </button>
          <button className="profile-dropdown-item" role="menuitem" tabIndex={0} onClick={() => { navigate(ROUTES.SUPPORT_NOTIFICATIONS); setIsOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Notifications
          </button>
          <button className="profile-dropdown-item" role="menuitem" tabIndex={0} onClick={() => { navigate(ROUTES.REWARDS); setIsOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Billing & Rewards
          </button>
          <div className="profile-dropdown-divider" />
          <button
            className="profile-dropdown-item profile-dropdown-logout"
            role="menuitem"
            tabIndex={0}
            onClick={handleLogout}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
