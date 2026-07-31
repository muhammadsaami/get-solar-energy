import React from 'react'
import { getGreeting } from '../../services/technicianDashboard.service'
import type { TechnicianProfile } from '../types/technician.types'

interface TechHeroProps {
  profile: TechnicianProfile | null
  onRefresh: () => void
}

export default function TechHero({ profile, onRefresh }: TechHeroProps) {
  const greeting = `${getGreeting()}, ${profile?.name?.split(' ')[0] || 'Technician'}`

  return (
    <section className="hero-card" style={{ minHeight: 240, marginBottom: 20 }}>
      <div className="hero-bg-overlay" />
      <div className="hero-left">
        <div className="hero-meta-badges">
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span>{profile?.city || 'Location Not Set'}</span>
          </div>
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
            <span>{profile?.skillLevel || 'Technician'}</span>
          </div>
          <div className="hero-meta-badge" style={{ borderColor: 'rgba(54, 211, 153, 0.25)', color: '#36d399' }}>
            <span className="grid-status-dot" />
            <span>{profile?.availability || 'Available'}</span>
          </div>
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span>{profile?.certificationLevel || 'Certified'}</span>
          </div>
        </div>

        <h2 className="hero-title" style={{ marginBottom: 4 }}>{greeting}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
          {profile?.skillLevel || 'Level 1'} &middot; ID: {profile?.technicianId || '---'}
        </p>
        <p className="hero-desc" style={{ maxWidth: 500 }}>
          Track your work orders, monitor earnings, and advance your skills — all from your technician dashboard.
        </p>

        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={onRefresh}>
            <span>Refresh Dashboard</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          </button>
        </div>
      </div>

      <div className="hero-right">
        <div className="live-summary-panel" style={{ padding: 20, maxWidth: 300 }}>
          <div className="summary-header" style={{ marginBottom: 16 }}>
            <span className="summary-title">Quick Status</span>
            <span className="summary-badge" style={{ animation: 'none' }}>Live</span>
          </div>
          <div className="summary-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="summary-item">
              <span className="summary-label">Status</span>
              <span className="summary-value" style={{ fontSize: 13, color: '#36d399' }}>{profile?.availability || 'Available'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Area</span>
              <span className="summary-value" style={{ fontSize: 13 }}>{profile?.serviceArea || '---'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Skill Level</span>
              <span className="summary-value" style={{ fontSize: 13 }}>{profile?.skillLevel || '---'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Verified</span>
              <span className="summary-value" style={{ fontSize: 13, color: profile?.verificationStatus === 'Verified' ? '#36d399' : 'var(--text-muted)' }}>
                {profile?.verificationStatus || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
