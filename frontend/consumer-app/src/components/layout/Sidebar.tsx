import React from 'react'
import { useLocation } from 'react-router-dom'
import { useUI } from '../../contexts/UIContext'
import { SIDEBAR_ITEMS, type SidebarGroupConfig } from '../../config/sidebar'
import { TECHNICIAN_SIDEBAR_GROUPS } from '../../config/sidebar.technician'
import { ADMIN_SIDEBAR_GROUPS } from '../../config/sidebar.admin'
import { ROLES } from '../../config/roles'
import { ROUTES } from '../../config/routes'
import { usePermissions } from '../../hooks/usePermissions'
import { getDisplayRole } from '../../utils/role'
import SidebarItem from './SidebarItem'
import OfficialLogo from '../brand/OfficialLogo'

import type { FeatureId } from '../../config/permissions'

function sidebarItemVisible(item: { requiredFeature?: FeatureId }, accessCheck: (f: FeatureId) => boolean): boolean {
  return !item.requiredFeature || accessCheck(item.requiredFeature)
}

function selectSidebarGroups(role?: string, pathname: string = ''): SidebarGroupConfig[] {
  if (pathname.startsWith('/app/technician')) return TECHNICIAN_SIDEBAR_GROUPS
  if (role === ROLES.ADMIN) {
    return ADMIN_SIDEBAR_GROUPS
  }
  if (role === ROLES.TECHNICIAN) return TECHNICIAN_SIDEBAR_GROUPS
  return SIDEBAR_ITEMS
}

const groupIcon: Record<string, string> = {
  'Solar Workspace': 'icon-home',
  'Solar AI Intelligence': 'icon-sparkles',
  'Ownership & Value': 'icon-shield',
  Account: 'icon-settings',
  'Technician Network': 'icon-wrench',
  Administration: 'icon-crown',
  Enterprise: 'icon-crown',
  'AI & MLOps': 'icon-sparkles',
  'Security & Audit': 'icon-shield',
  'Operational Portals': 'icon-briefcase',
}

export default function Sidebar() {
  const location = useLocation()
  const { canAccess, role } = usePermissions()
  const sidebarGroups = selectSidebarGroups(role, location.pathname)
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

          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', minHeight: '38px' }}>
            <OfficialLogo collapsed={isSidebarCollapsed} height={36} />
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