import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { VendorKpis } from '../types/vendor.types'

interface VendorHeroSectionProps {
  kpis?: VendorKpis | null
  visitCount?: number
  taskCount?: number
  overdueCount?: number
  onRefresh?: () => void
  onCreateProject?: () => void
  onAddCustomer?: () => void
  onCreateInvoice?: () => void
  onAssignTeam?: () => void
}

interface HeroStat {
  icon: string
  value: number
  label: string
  countKey: 'activeInstallations' | 'pendingSiteVisits' | 'overdueWorkOrders' | 'amcVisitsThisWeek'
  accent: string
  svgPath: string
}

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

export default function VendorHeroSection({
  kpis,
  visitCount = 8,
  taskCount = 14,
  overdueCount = 2,
  onRefresh,
  onCreateProject,
  onAddCustomer,
  onCreateInvoice,
  onAssignTeam,
}: VendorHeroSectionProps) {
  const auth = useAuth() as unknown as { user?: { name?: string } }
  const user = auth?.user
  const name = user?.name || 'Solar EPC Partner'

  const heroStats: VendorStatCard[] = [
    { icon: 'icon-activity', value: kpis?.activeInstallations ?? 12, label: 'Active Projects', accent: 'var(--vendor-primary)', svgPath: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
    { icon: 'icon-calendar', value: visitCount, label: 'Site Inspections Today', accent: 'var(--vendor-accent)', svgPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM16 2v4M8 2v4M2 10h20' },
    { icon: 'icon-trending', value: taskCount, label: 'Pending Milestone Tasks', accent: 'var(--vendor-success)', svgPath: 'M23 6l-9.5 9.5-5-5L1 18' },
    { icon: 'icon-alert-triangle', value: overdueCount, label: 'Critical Action Required', accent: 'var(--vendor-danger)', svgPath: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
  ]

  return (
    <div style={{
      padding: '24px 28px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(12, 25, 45, 0.9) 0%, rgba(6, 15, 31, 0.95) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{
        position: 'absolute', top: '-60px', right: '-40px', width: '240px', height: '240px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(23, 168, 229, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '10%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', alignItems: 'stretch' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
              Good {GREETING}, {name}
            </h1>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
              background: 'rgba(23, 168, 229, 0.15)', color: 'var(--vendor-primary)',
              border: '1px solid rgba(23, 168, 229, 0.35)', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Tier 1 EPC Partner
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 500 }}>
            Solar EPC Solutions &middot; {TODAY} &middot; Operations Dashboard
          </p>

          <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--vendor-accent)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.82)' }}>
              {kpis?.activeProjects ?? 0} active projects in execution. {kpis?.surveysApproved ?? 0} surveys approved. SLA compliance {kpis?.slaCompliance ?? 0}%.
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
            <button className="vendor-btn-primary" onClick={onCreateProject}>+ Create Project</button>
            <button className="vendor-btn-secondary" onClick={onAddCustomer}>+ Add Customer</button>
            <button className="vendor-btn-ghost" onClick={onCreateInvoice}>Create Invoice</button>
            <button className="vendor-btn-ghost" onClick={onAssignTeam}>Assign Team</button>
            <button className="vendor-btn-ghost" onClick={onRefresh} title="Refresh">⟳ Sync</button>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          padding: '18px', borderRadius: '14px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <span className="live-pulse-dot" style={{ marginRight: 6, display: 'inline-block' }} /> Live Operations
            </span>
            <span style={{ fontSize: '10px', color: 'var(--vendor-primary)', fontWeight: 700 }}>ERP Command Center</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {heroStats.map(stat => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${stat.accent}40`, color: stat.accent, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={stat.svgPath} /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface VendorStatCard {
  icon: string
  value: number
  label: string
  accent: string
  svgPath: string
}