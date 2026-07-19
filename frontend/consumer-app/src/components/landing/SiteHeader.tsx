import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useAuthStatus } from '../../hooks/useAuthStatus'
import { useAuthStore } from '../../stores/authStore'
import { trackCTA } from '../../utils/analytics'
import MobileDrawer from './MobileDrawer'

const NAV_SECTIONS = [
  'why-choose-solar',
  'features',
  'how-it-works',
  'testimonials',
]

function HeaderRoot({ children }: { children: React.ReactNode }) {
  const scrollY = useScrollPosition()
  return (
    <header className={`navbar-header${scrollY > 50 ? ' scrolled' : ''}`} id="navbarHeader">
      {children}
    </header>
  )
}

function LogoIcon() {
  return (
    <svg
      className="logo-badge-svg"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
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
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#00aeef"
          strokeWidth="4.5"
          strokeDasharray="6 4.5"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="#00aeef"
          strokeWidth="4.5"
          strokeDasharray="5.5 4"
        />
        <circle
          cx="50"
          cy="50"
          r="22"
          stroke="#00aeef"
          strokeWidth="4.5"
          strokeDasharray="4.5 4"
        />
      </g>
      <g clipPath="url(#right-half)">
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#f7931e"
          strokeWidth="4.5"
          strokeDasharray="6 4.5"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="#f7931e"
          strokeWidth="4.5"
          strokeDasharray="5.5 4"
        />
        <circle
          cx="50"
          cy="50"
          r="22"
          stroke="#f7931e"
          strokeWidth="4.5"
          strokeDasharray="4.5 4"
        />
      </g>
      <circle cx="50" cy="50" r="14" fill="#ffffff" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontFamily="'Outfit', sans-serif"
        fontWeight="900"
        fontSize="16"
        fill="#000000"
      >
        G
      </text>
    </svg>
  )
}

export default function SiteHeader() {
  const activeSection = useActiveSection(NAV_SECTIONS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isAuthenticated } = useAuthStatus()

  return (
    <>
      <a href="#sceneHero" className="skip-nav">
        Skip to main content
      </a>

      <HeaderRoot>
        <div className="nav-container">
          <a href="/" className="logo-container" aria-label="GET Solar Energy Home">
            <div className="logo-badge">
              <LogoIcon />
            </div>
            <div className="logo-text-block">
              <span className="logo-title-text">GET SOLAR ENERGY</span>
              <span className="logo-sub-text">SOLAR INTELLIGENCE PLATFORM</span>
            </div>
          </a>

          <nav className="nav-links" aria-label="Main navigation">
            <a
              href="#why-choose-solar"
              className={`nav-link-item${activeSection === 'why-choose-solar' ? ' active' : ''}`}
            >
              Why Solar
            </a>
            <a
              href="#features"
              className={`nav-link-item${activeSection === 'features' ? ' active' : ''}`}
            >
              Services
            </a>
            <a
              href="#how-it-works"
              className={`nav-link-item${activeSection === 'how-it-works' ? ' active' : ''}`}
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className={`nav-link-item${activeSection === 'testimonials' ? ' active' : ''}`}
            >
              Success Stories
            </a>
          </nav>

          <div className="nav-auth-buttons">
            {isAuthenticated ? (
              <>
                <Link to="/app/home" className="btn-dashboard">
                  Dashboard
                </Link>
                <a
                  href="#"
                  className="btn-logout"
                  onClick={(e) => {
                    e.preventDefault()
                    useAuthStore.getState().logout()
                  }}
                >
                  Logout
                </a>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login" onClick={() => trackCTA('login_nav')}>
                  Login
                </Link>
                <Link to="/signup" className="btn-signup" onClick={() => trackCTA('signup_nav')}>
                  Start Free Assessment
                </Link>
              </>
            )}
          </div>

          <button
            className="mobile-menu-toggle"
            id="mobileMenuToggle"
            aria-label="Toggle navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </HeaderRoot>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
