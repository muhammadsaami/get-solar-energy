import React from 'react'
import { useUI } from '../../contexts/UIContext'
import { SIDEBAR_ITEMS, type SidebarGroupConfig } from '../../config/sidebar'
import { TECHNICIAN_SIDEBAR_GROUPS } from '../../config/sidebar.technician'
import { ADMIN_SIDEBAR_GROUPS } from '../../config/sidebar.admin'
import { ROLES } from '../../config/roles'
import { usePermissions } from '../../hooks/usePermissions'
import { getDisplayRole } from '../../utils/role'
import SidebarItem from './SidebarItem'

import type { FeatureId } from '../../config/permissions'

function sidebarItemVisible(item: { requiredFeature?: FeatureId }, accessCheck: (f: FeatureId) => boolean): boolean {
  return !item.requiredFeature || accessCheck(item.requiredFeature)
}

function selectSidebarGroups(role?: string): SidebarGroupConfig[] {
  if (role === ROLES.TECHNICIAN) return TECHNICIAN_SIDEBAR_GROUPS
  if (role === ROLES.ADMIN) return ADMIN_SIDEBAR_GROUPS
  return SIDEBAR_ITEMS
}

const groupIcon: Record<string, string> = {
  'Solar Workspace': 'icon-home',
  'Solar AI Intelligence': 'icon-sparkles',
  'Ownership & Value': 'icon-shield',
  Account: 'icon-settings',
}

export default function Sidebar() {
  const { canAccess, role } = usePermissions()
  const sidebarGroups = selectSidebarGroups(role)
  const { isSidebarCollapsed, toggleSidebar, isMobileDrawerOpen, toggleMobileDrawer } = useUI() as unknown as {
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
    isMobileDrawerOpen: boolean
    toggleMobileDrawer: () => void
  }

  return (
    <>
      <aside
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
        id="sidebar"
      >
        <div className="sidebar-top-section sidebar-brand-row">
          <button
            className="sidebar-collapse-btn"
            id="sidebarCollapseBtn"
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            onClick={toggleSidebar}
          >
            <svg
              className="collapse-chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="logo-container">
            <div className="logo-badge">
              <svg className="logo-badge-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <clipPath id="left-half">
                    <rect x="0" y="0" width="50" height="100" />
                  </clipPath>
                  <clipPath id="right-half">
                    <rect x="50" y="0" width="50" height="100" />
                  </clipPath>
                </defs>
                <rect width="100" height="100" rx="20" fill="#000000" />
                <g clipPath="url(#left-half)">
                  <circle cx="50" cy="50" r="38" stroke="#00aeef" strokeWidth="4.5" strokeDasharray="6 4.5" />
                  <circle cx="50" cy="50" r="30" stroke="#00aeef" strokeWidth="4.5" strokeDasharray="5.5 4" />
                  <circle cx="50" cy="50" r="22" stroke="#00aeef" strokeWidth="4.5" strokeDasharray="4.5 4" />
                </g>
                <g clipPath="url(#right-half)">
                  <circle cx="50" cy="50" r="38" stroke="#f7931e" strokeWidth="4.5" strokeDasharray="6 4.5" />
                  <circle cx="50" cy="50" r="30" stroke="#f7931e" strokeWidth="4.5" strokeDasharray="5.5 4" />
                  <circle cx="50" cy="50" r="22" stroke="#f7931e" strokeWidth="4.5" strokeDasharray="4.5 4" />
                </g>
                <circle cx="50" cy="50" r="14" fill="#ffffff" />
                <text x="50" y="55" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#000000">G</text>
              </svg>
            </div>
            <div className="logo-text-block">
              <span className="logo-title-text">GET SOLAR ENERGY</span>
            </div>
          </div>
        </div>

        <div className="sidebar-workspace-block">
          <div className="workspace-label-row">
            <span className="workspace-eyebrow">Active Workspace</span>
            <span className={`workspace-status-dot ${role === ROLES.ADMIN ? 'is-admin' : ''}`} />
          </div>
          <div className="workspace-selector" role="button" aria-haspopup="listbox" tabIndex={0}>
            <div className="workspace-selected">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
              <span className="workspace-name">{getDisplayRole(role)}</span>
              <svg className="workspace-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        <nav className="sidebar-menu-wrapper sidebar-nav-grouped">
          <ul className="sidebar-menu">
            {sidebarGroups.map((group, gIdx) => {
              const visibleItems = group.items.filter((item) => sidebarItemVisible(item, canAccess))
              if (visibleItems.length === 0) return null
              return (
                <li className="sidebar-section" key={gIdx}>
                  <span className="sidebar-section-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <use href={`#${groupIcon[group.groupName] || 'icon-home'}`} />
                    </svg>
                    <span>{group.groupName}</span>
                  </span>
                  <ul className="sidebar-section-items">
                    {visibleItems.map((item) => (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        isCollapsed={isSidebarCollapsed}
                      />
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {isMobileDrawerOpen && (
        <div
          className="sidebar-mobile-overlay"
          id="sidebarMobileOverlay"
          onClick={toggleMobileDrawer}
        />
      )}
    </>
  )
}