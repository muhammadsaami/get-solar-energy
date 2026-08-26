import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useAuthStatus } from '../../hooks/useAuthStatus'
import { useAuth } from '../../contexts/AuthContext'
import { trackCTA } from '../../utils/analytics'
import MobileDrawer from './MobileDrawer'
import OfficialLogo from '../brand/OfficialLogo'

const NAV_SECTIONS = [
  'sceneRoof',
  'sceneEstimate',
  'sceneInstallation',
  'sceneLifestyle',
]

function HeaderRoot({ children }: { children: React.ReactNode }) {
  const scrollY = useScrollPosition()
  return (
    <header className={`navbar-header${scrollY > 50 ? ' scrolled' : ''}`} id="navbarHeader">
      {children}
    </header>
  )
}

export default function SiteHeader() {
  const shouldReduceMotion = useReducedMotion()
  const activeSection = useActiveSection(NAV_SECTIONS)
  const { isAuthenticated } = useAuthStatus()
  const { logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <a href="#sceneHero" className="skip-nav">
        Skip to main content
      </a>

      <HeaderRoot>
        <div className="nav-container">
          <a
            href="/"
            className="logo-container"
            aria-label="GET Solar Energy Home"
          >
            <OfficialLogo height={38} />
          </a>

          <nav className="nav-links" aria-label="Main navigation">
            <a
              href="#sceneRoof"
              className={`nav-link-item${activeSection === 'sceneRoof' ? ' active' : ''}`}
            >
              Why Solar
            </a>
            <a
              href="#sceneEstimate"
              className={`nav-link-item${activeSection === 'sceneEstimate' ? ' active' : ''}`}
            >
              Services
            </a>
            <a
              href="#sceneInstallation"
              className={`nav-link-item${activeSection === 'sceneInstallation' ? ' active' : ''}`}
            >
              How It Works
            </a>
            <a
              href="#sceneLifestyle"
              className={`nav-link-item${activeSection === 'sceneLifestyle' ? ' active' : ''}`}
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
                    logout()
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
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'inline-block' }}
                >
                  <Link to="/signup" className="btn-signup" onClick={() => trackCTA('signup_nav')}>
                    Start Free Assessment
                  </Link>
                </motion.div>
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
        activeSection={activeSection}
      />
    </>
  )
}
