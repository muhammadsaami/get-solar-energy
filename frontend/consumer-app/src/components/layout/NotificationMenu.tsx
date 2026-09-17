import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

export default function NotificationMenu() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className="notification-btn"
        aria-label="View notifications"
        onClick={() => navigate(ROUTES.SUPPORT_NOTIFICATIONS)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
    </div>
  )
}
