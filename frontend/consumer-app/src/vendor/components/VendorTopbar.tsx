import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import VendorSearch from './VendorSearch'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../config/routes'

export function VendorTopbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth() as unknown as { user?: { name?: string; email?: string }; logout?: () => void }
  const user = auth?.user
  const logout = auth?.logout || (() => {})

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('North India Region')

  const currentPathName = location.pathname.split('/').pop() || 'dashboard'
  const formattedTitle = currentPathName === 'app' || currentPathName === 'vendor'
    ? 'Dashboard'
    : currentPathName.charAt(0).toUpperCase() + currentPathName.slice(1).replace('-', ' ')

  const notifications = [
    { id: 1, title: 'New Lead Assigned', time: '10 mins ago', unread: true },
    { id: 2, title: 'Milestone 2 Payment Released', time: '2 hours ago', unread: true },
    { id: 3, title: 'DISCOM Approval Received', time: '5 hours ago', unread: false },
  ]

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'rgba(8, 22, 37, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      zIndex: 90,
      position: 'sticky',
      top: 0,
    }}>
      {/* Left: Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--vendor-text-muted)', fontWeight: 500 }}>Vendor Portal</span>
        <span style={{ fontSize: '12px', color: 'var(--vendor-text-muted)' }}>/</span>
        <span style={{
          fontSize: '13.5px',
          fontWeight: 700,
          color: 'var(--vendor-primary)',
          textTransform: 'capitalize',
          letterSpacing: '-0.01em',
          fontFamily: "'Outfit', sans-serif"
        }}>
          {formattedTitle}
        </span>
      </div>

      {/* Center: Search Input */}
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 20px' }}>
        <VendorSearch />
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
        {/* Region Selector */}
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--vendor-border)',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--vendor-text-secondary)',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <option value="North India Region" style={{ background: '#081827', color: '#fff' }}>North India Region</option>
          <option value="West India Region" style={{ background: '#081827', color: '#fff' }}>West India Region</option>
          <option value="South India Region" style={{ background: '#081827', color: '#fff' }}>South India Region</option>
          <option value="All Regions" style={{ background: '#081827', color: '#fff' }}>All Regions</option>
        </select>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--vendor-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'var(--vendor-text-secondary)', transition: 'all 0.2s ease', position: 'relative'
            }}
            title="Notifications"
          >
            <svg style={{ width: '16px', height: '16px', stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{
              position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px',
              borderRadius: '50%', backgroundColor: 'var(--vendor-accent)', boxShadow: '0 0 8px var(--vendor-accent)'
            }} />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '46px', right: 0, width: '280px',
              background: 'var(--vendor-bg-surface)', border: '1px solid var(--vendor-border)',
              borderRadius: '12px', boxShadow: 'var(--vendor-shadow)', backdropFilter: 'blur(24px)',
              padding: '12px', zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Notifications</span>
                <span style={{ fontSize: '10px', color: 'var(--vendor-primary)', fontWeight: 600 }}>2 Unread</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: '8px 10px', borderRadius: '8px',
                    background: n.unread ? 'rgba(23, 168, 229, 0.08)' : 'transparent',
                    border: `1px solid ${n.unread ? 'rgba(23, 168, 229, 0.2)' : 'transparent'}`
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{n.title}</p>
                    <span style={{ fontSize: '10px', color: 'var(--vendor-text-muted)' }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / Menu Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              backgroundColor: 'rgba(23, 168, 229, 0.15)', border: '1px solid var(--vendor-primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--vendor-primary)', fontWeight: 800, fontSize: '13px'
            }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VE'}
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: '46px', right: 0, width: '220px',
              background: 'var(--vendor-bg-surface)', border: '1px solid var(--vendor-border)',
              borderRadius: '12px', boxShadow: 'var(--vendor-shadow)', backdropFilter: 'blur(24px)',
              padding: '12px', zIndex: 100
            }}>
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{user?.name || 'Solar EPC Partner'}</p>
                <span style={{ fontSize: '11px', color: 'var(--vendor-text-muted)' }}>{user?.email || 'vendor@getsolar.in'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(ROUTES.VENDOR_PROFILE)
                    setShowUserMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg style={{ width: '14px', height: '14px', stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  </svg>
                  Vendor Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate(ROUTES.VENDOR_SETTINGS)
                    setShowUserMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg style={{ width: '14px', height: '14px', stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Account Settings
                </button>
              </div>
              <button
                onClick={logout}
                className="vendor-btn-danger"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default VendorTopbar
