import React from 'react'
import type { VendorVisit } from '../types/vendor.types'

interface SiteVisitCardProps {
  visit: VendorVisit
}

export default function SiteVisitCard({ visit }: SiteVisitCardProps) {
  const isToday = visit.scheduledDate === new Date().toISOString().split('T')[0]
  const accentColor = isToday ? 'var(--vendor-primary)' : 'var(--vendor-secondary)'

  return (
    <div className="vendor-glass-card" style={{
      padding: '16px 20px',
      borderLeft: `4px solid ${accentColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: accentColor,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
              {visit.title}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)', marginTop: '4px' }}>
              Scheduled: <strong style={{ color: 'var(--vendor-text-secondary)' }}>{visit.scheduledDate}</strong> at {visit.scheduledTime}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '10.5px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
          backgroundColor: visit.outcome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(23, 168, 229, 0.15)',
          color: visit.outcome ? 'var(--vendor-success)' : 'var(--vendor-primary)',
          border: `1px solid ${visit.outcome ? 'rgba(16, 185, 129, 0.3)' : 'var(--vendor-primary-border)'}`,
          textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0
        }}>
          {visit.outcome || 'Scheduled'}
        </span>
      </div>
    </div>
  )
}
