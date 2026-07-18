import { useEffect, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useAuthStatus } from '../../hooks/useAuthStatus'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLElement | null>(null)
  const { isAuthenticated } = useAuthStatus()

  useEffect(() => {
    if (isOpen) {
      toggleRef.current = document.getElementById('mobileMenuToggle')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const closeBtn =
          drawerRef.current?.querySelector<HTMLElement>('.drawer-close-btn')
        closeBtn?.focus()
      })
    }
  }, [isOpen])

  const closeAndFocusToggle = () => {
    onClose()
    document.getElementById('mobileMenuToggle')?.focus()
  }

  const handleLogout = () => {
    useAuthStore.getState().logout()
    onClose()
  }

  return (
    <div
      ref={drawerRef}
      className={`mobile-nav-drawer${isOpen ? ' active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div className="drawer-header">
        <div className="logo-container">
          <div className="logo-text-block">
            <span className="logo-title-text">GET SOLAR ENERGY</span>
          </div>
        </div>
        <button
          className="drawer-close-btn"
          aria-label="Close menu"
          onClick={closeAndFocusToggle}
        >
          &times;
        </button>
      </div>
      <div className="drawer-links">
        <a
          href="#why-choose-solar"
          className="drawer-link-item"
          onClick={onClose}
        >
          Why Solar
        </a>
        <a href="#features" className="drawer-link-item" onClick={onClose}>
          Services
        </a>
        <a href="#how-it-works" className="drawer-link-item" onClick={onClose}>
          How It Works
        </a>
        <a href="#testimonials" className="drawer-link-item" onClick={onClose}>
          Success Stories
        </a>
        <hr className="drawer-divider" />
        {isAuthenticated ? (
          <>
            <a
              href="/app/home"
              className="drawer-btn-signup"
              onClick={onClose}
            >
              Dashboard
            </a>
            <button
              className="drawer-btn-login"
              onClick={handleLogout}
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="drawer-btn-login" onClick={onClose}>
              Login
            </a>
            <a href="/signup" className="drawer-btn-signup" onClick={onClose}>
              Start Free Assessment
            </a>
          </>
        )}
      </div>
    </div>
  )
}
