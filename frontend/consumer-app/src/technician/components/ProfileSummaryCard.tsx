import React from 'react'
import type { TechnicianProfile } from '../types/technician.types'

interface ProfileSummaryCardProps {
  profile: TechnicianProfile | null
}

export default function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  if (!profile) {
    return (
      <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row" style={{ marginBottom: 16 }}>
          <span className="kpi-title">Profile Snapshot</span>
          <svg className="kpi-title-icon blue"><use href="#icon-wrench" /></svg>
        </div>
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-wrench" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Complete your profile setup to see this section.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Profile Snapshot</span>
        <svg className="kpi-title-icon blue"><use href="#icon-wrench" /></svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-blue-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--color-blue-border)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-blue)' }}>{profile.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)', margin: 0 }}>{profile.name}</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{profile.skillLevel} &middot; {profile.technicianId}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: 6 }}>
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Skill Level</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)', margin: '2px 0 0' }}>{profile.skillLevel}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: 6 }}>
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Verification</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: profile.verificationStatus === 'Verified' ? '#36d399' : '#f59e0b', margin: '2px 0 0' }}>{profile.verificationStatus}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: 6 }}>
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Availability</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#36d399', margin: '2px 0 0' }}>{profile.availability}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: 6 }}>
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Service Area</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)', margin: '2px 0 0' }}>{profile.serviceArea}</p>
        </div>
      </div>
    </div>
  )
}
