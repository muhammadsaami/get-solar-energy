import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { VENDOR_NAV_GROUPS, type VendorNavItem, type VendorNavGroup } from '../navigation/sidebar.config'
import VendorBrandLogo from './VendorBrandLogo'
import { useAuth } from '../../contexts/AuthContext'

const ICON_SVGS: Record<string, React.ReactNode> = {
  'icon-layout-grid': <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  'icon-folder': <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  'icon-users': <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  'icon-target': <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>,
  'icon-zap': <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  'icon-user-check': <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M17 11l2 2 4-4" />
  </>,
  'icon-box': <>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </>,
  'icon-shield-check': <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </>,
  'icon-dollar-sign': <>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </>,
  'icon-file-text': <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </>,
  'icon-bar-chart': <>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </>,
  'icon-paperclip': <>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </>,
  'icon-settings': <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
  'icon-user': <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
}

export function VendorSidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const auth = useAuth() as unknown as { user?: { name?: string; email?: string } }
  const user = auth?.user

  return (
    <aside style={{
      width: collapsed ? '74px' : '270px',
      height: '100vh',
      backgroundColor: 'rgba(8, 22, 37, 0.9)',
      borderRight: '1px solid rgba(255, 255, 255, 0.07)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 100,
      position: 'sticky',
      top: 0,
      transition: 'width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: collapsed ? '18px 14px' : '22px 20px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <VendorBrandLogo collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vendor-text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg style={{ width: '18px', height: '18px', stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24">
            {collapsed ? (
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
            ) : (
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            )}
          </svg>
        </button>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: collapsed ? '14px 8px' : '18px 14px', flex: 1, overflowY: 'auto' }}>
        {VENDOR_NAV_GROUPS.map((group: VendorNavGroup) => (
          <div key={group.groupName} style={{ marginBottom: '20px' }}>
            {!collapsed && (
              <div style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: 'var(--vendor-text-muted)',
                padding: '0 12px 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                fontFamily: "'Outfit', sans-serif"
              }}>
                {group.groupName}
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map((item: VendorNavItem) => {
                const active = location.pathname === item.path || (item.path !== '/app/vendor' && location.pathname.startsWith(item.path))
                return (
                  <li key={item.id} style={{ position: 'relative' }}>
                    {active && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '8px',
                        bottom: '8px',
                        width: '3px',
                        borderRadius: '0 3px 3px 0',
                        background: 'var(--vendor-grad-blue)',
                        boxShadow: '0 0 10px var(--vendor-primary)'
                      }} />
                    )}
                    <Link
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        padding: collapsed ? '11px' : '10px 14px',
                        borderRadius: '10px',
                        color: active ? '#FFFFFF' : 'var(--vendor-text-secondary)',
                        backgroundColor: active ? 'rgba(23, 168, 229, 0.15)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(23, 168, 229, 0.3)' : 'transparent'}`,
                        textDecoration: 'none',
                        fontSize: '13.5px',
                        fontWeight: active ? 700 : 500,
                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        position: 'relative',
                        boxShadow: active ? '0 4px 16px rgba(23, 168, 229, 0.2)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg style={{
                          width: '18px', height: '18px',
                          stroke: active ? 'var(--vendor-primary)' : 'var(--vendor-text-muted)',
                          fill: 'none', strokeWidth: active ? 2.2 : 1.8,
                          strokeLinecap: 'round', strokeLinejoin: 'round',
                          transition: 'stroke 0.2s ease',
                          flexShrink: 0,
                        }} viewBox="0 0 24 24">
                          {ICON_SVGS[item.icon] || <circle cx="12" cy="12" r="8" />}
                        </svg>
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '10px',
                          backgroundColor: active ? 'var(--vendor-primary)' : 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Profile Organization Card */}
      <div style={{
        padding: collapsed ? '14px 10px' : '16px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(6, 17, 31, 0.7)'
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: 'rgba(23, 168, 229, 0.15)', border: '1px solid var(--vendor-primary-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vendor-primary)',
          fontWeight: 800, fontSize: '13.5px', flexShrink: 0
        }}>
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SE'}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>
              {user?.name || 'Solar EPC Solutions'}
            </p>
            <span style={{ fontSize: '10px', color: 'var(--vendor-primary)', fontWeight: 700 }}>Tier 1 EPC Partner</span>
          </div>
        )}
      </div>
    </aside>
  )
}

export default VendorSidebar
