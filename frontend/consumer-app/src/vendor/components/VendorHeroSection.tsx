import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getDisplayRole } from '../../utils/role'
import type { VendorKpis } from '../types/vendor.types'

interface VendorHeroSectionProps {
  kpis: VendorKpis | null
  visitCount: number
  taskCount: number
  overdueCount: number
  onRefresh: () => void
}

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

function StatBadge({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <use href={`#${icon}`} />
      </svg>
      <div>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-1)', opacity: 0.85 }}>{label}</span>
      </div>
    </div>
  )
}

export default function VendorHeroSection({ kpis, visitCount, taskCount, overdueCount, onRefresh }: VendorHeroSectionProps) {
  const { user } = useAuth() as unknown as { user: { name: string; role: string } | null }
  const firstName = user?.name?.split(' ')[0] || 'Vendor'
  const role = getDisplayRole(user?.role)

  return (
    <div style={{
      padding: 'var(--space-6) var(--space-8)', borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #0D2136 0%, #06111f 100%)',
      border: '1px solid var(--glass-border)',
      position: 'relative', overflow: 'hidden',
      marginBottom: 'var(--space-6)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,138,29,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Good {GREETING}, {firstName}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              {role} &middot; {TODAY}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={() => {}} aria-label="View My Work">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <use href="#icon-arrow-right" />
              </svg>
              View My Work
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={onRefresh}
              aria-label="Refresh dashboard"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)',
          paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)',
        }}>
          <StatBadge icon="icon-briefcase" value={kpis?.activeInstallations ?? 0} label="Active Installations" color="var(--color-orange)" />
          <StatBadge icon="icon-mappin" value={visitCount} label="Site Visits" color="var(--color-blue)" />
          <StatBadge icon="icon-clipboard-check" value={taskCount} label="Pending Tasks" color="var(--color-purple)" />
          <StatBadge icon="icon-alert-triangle" value={overdueCount} label="Critical Alerts" color="var(--color-red)" />
        </div>
      </div>
    </div>
  )
}
