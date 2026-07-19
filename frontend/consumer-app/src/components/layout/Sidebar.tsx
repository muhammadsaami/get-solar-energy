import React from 'react'
import { useUI } from '../../contexts/UIContext'
import { SIDEBAR_ITEMS } from '../../config/sidebar'
import SidebarItem from './SidebarItem'
import {
  MdDashboard, MdReceiptLong, MdRoofing, MdCalculate, MdAutoAwesome, MdSmartToy,
  MdCardGiftcard, MdAssessment, MdNotifications, MdSpeed,
  MdBuild, MdFactCheck, MdSettings, MdBusiness, MdAdminPanelSettings,
  MdPeople, MdSecurity, MdInsights, MdPsychology,
} from 'react-icons/md'

const iconMap: Record<string, React.ReactNode> = {
  'dashboard': <MdDashboard />,
  'bill-analyzer': <MdReceiptLong />,
  'roof-analysis': <MdRoofing />,
  'roi-calculator': <MdCalculate />,
  'ai-assistant': <MdAutoAwesome />,
  'enterprise-ai': <MdSmartToy />,
  'rewards': <MdCardGiftcard />,
  'reports-center': <MdAssessment />,
  'activity-center': <MdNotifications />,
  'performance': <MdSpeed />,
  'amc': <MdBuild />,
  'site-survey': <MdFactCheck />,
  'settings': <MdSettings />,
  'vendor-portal': <MdBusiness />,
  'admin-dashboard': <MdAdminPanelSettings />,
  'crm-dashboard': <MdPeople />,
  'audit-monitoring': <MdSecurity />,
  'business-intelligence': <MdInsights />,
  'mlops-dashboard': <MdPsychology />,
}

export default function Sidebar() {
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
        <div className="sidebar-top-section">
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
              <span className="logo-sub-text">SOLAR INTELLIGENCE PLATFORM</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-menu-wrapper">
          <ul className="sidebar-menu">
            {SIDEBAR_ITEMS.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                <li className="sidebar-section-label">
                  <span>{group.groupName}</span>
                </li>
                {group.items
                  .filter((item) => item.visible)
                  .map((item) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      isCollapsed={isSidebarCollapsed}
                      icon={iconMap[item.id] || <MdDashboard />}
                    />
                  ))}
              </React.Fragment>
            ))}
          </ul>
        </nav>

        <div className="sidebar-promo-container">
          <div className="sidebar-promo-card">
            <svg className="sidebar-promo-card-svg" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="promo-roof-left" x1="45" y1="45" x2="75" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#36D399" />
                  <stop offset="100%" stopColor="#1B9A5F" />
                </linearGradient>
                <linearGradient id="promo-roof-right" x1="75" y1="30" x2="108" y2="45" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#243b55" />
                  <stop offset="100%" stopColor="#141e30" />
                </linearGradient>
              </defs>
              <ellipse cx="80" cy="70" rx="45" ry="6" fill="rgba(0, 0, 0, 0.3)" style={{ filter: 'blur(2px)' }} />
              <path d="M50 48 L75 58 L75 70 L50 60 Z" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" />
              <path d="M75 58 L105 48 L105 60 L75 70 Z" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.15)" />
              <path d="M45 45 L75 30 L75 35 L45 50 Z" fill="url(#promo-roof-left)" />
              <path d="M75 30 L108 45 L108 50 L75 35 Z" fill="url(#promo-roof-right)" />
              <path d="M52 44 L72 34 L72 38 L52 48 Z" fill="#00AEEF" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
              <line x1="62" y1="39" x2="62" y2="43" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
              <path d="M85 55 L93 52 L93 60 L85 63 Z" fill="rgba(23, 168, 229, 0.2)" stroke="rgba(23, 168, 229, 0.4)" />
              <path d="M60 55 L68 58 L68 70 L60 67 Z" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" />
              <path d="M35 65 C32 60, 42 50, 45 65 Z" fill="#36D399" opacity="0.6" />
              <path d="M115 60 C112 55, 122 48, 125 60 Z" fill="#36D399" opacity="0.6" />
              <circle cx="130" cy="20" r="8" fill="#F7931E" opacity="0.8" style={{ filter: 'drop-shadow(0 0 4px #F7931E)' }} />
            </svg>
            <h4>Make Every Sunbeam Count</h4>
            <p>Switch to solar. Save more. Live better.</p>
            <button className="sidebar-promo-btn" id="sidebarExploreBtn">
              <span>Explore Solar</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="sidebar-pro-plan-card">
            <div className="pro-header-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>GET Solar Pro</span>
            </div>
            <p className="pro-subtext">Pro Plan · Valid till 28 Feb 2026</p>
            <div className="pro-progress-container">
              <div className="pro-progress-labels">
                <span>Usage Status</span>
                <span>85% Used</span>
              </div>
              <div className="pro-progress-track">
                <div className="pro-progress-fill" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
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
