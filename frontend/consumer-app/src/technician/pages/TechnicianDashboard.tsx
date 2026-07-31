import React from 'react'
import { useTechnicianDashboard } from '../hooks/useTechnicianDashboard'
import DashboardSprites from '../../components/dashboard/DashboardSprites'
import TechHero from '../components/TechHero'
import TechKPIs from '../components/TechKPIs'
import QuickActions from '../components/QuickActions'
import ScheduleWidget from '../components/ScheduleWidget'
import NotificationWidget from '../components/NotificationWidget'
import PerformanceCharts from '../components/PerformanceCharts'
import TrainingProgressCard from '../components/TrainingProgressCard'
import ProfileSummaryCard from '../components/ProfileSummaryCard'

function DashboardSkeleton() {
  return (
    <div className="tab-content active" role="tabpanel" aria-label="technician-dashboard-loading" aria-busy="true">
      <div className="tab-header-block">
        <h2 className="tab-heading">Technician Dashboard</h2>
        <p className="tab-subheading">Loading your workspace...</p>
      </div>
      <div className="card-base skeleton-card" style={{ height: 240, marginBottom: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton-loader skeleton-text" style={{ width: '30%', height: 14 }} />
        <div className="skeleton-loader skeleton-text" style={{ width: '50%', height: 24 }} />
        <div className="skeleton-loader skeleton-text" style={{ width: '70%', height: 12 }} />
      </div>
      <div className="skeleton-grid skeleton-grid-4" style={{ marginBottom: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-base shadow-lift skeleton-card" style={{ height: 110, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skeleton-loader skeleton-text" style={{ width: '60%', height: 12 }} />
            <div className="skeleton-loader skeleton-text" style={{ width: '40%', height: 22 }} />
            <div className="skeleton-loader skeleton-text" style={{ width: '30%', height: 10 }} />
          </div>
        ))}
      </div>
      <div className="skeleton-grid skeleton-grid-2" style={{ marginBottom: 20 }}>
        <div className="card-base shadow-lift skeleton-card" style={{ height: 200, padding: 16 }} />
        <div className="card-base shadow-lift skeleton-card" style={{ height: 200, padding: 16 }} />
      </div>
    </div>
  )
}

export default function TechnicianDashboard() {
  const {
    kpis, profile, schedule, notifications, performance, training,
    loading, error, refresh,
  } = useTechnicianDashboard()

  if (loading) {
    return (
      <>
        <DashboardSprites />
        <DashboardSkeleton />
      </>
    )
  }

  if (error) {
    return (
      <>
        <DashboardSprites />
        <div className="tab-content active" role="tabpanel" aria-label="technician-dashboard-error">
          <div className="tab-header-block">
            <h2 className="tab-heading">Technician Dashboard</h2>
            <p className="tab-subheading" style={{ color: 'var(--color-red)' }}>Unable to load dashboard</p>
          </div>
          <div className="card-base shadow-lift" style={{ padding: 32, textAlign: 'center', '--card-theme': '239, 68, 68' } as React.CSSProperties}>
            <svg className="kpi-title-icon" style={{ width: 40, height: 40, margin: '0 auto 12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
            <button type="button" className="hero-btn-primary" onClick={refresh}>
              <span>Retry</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardSprites />
      <div className="tab-content active" role="tabpanel" aria-label="technician-dashboard">
        <div className="tab-header-block">
          <h2 className="tab-heading">Technician Dashboard</h2>
          <p className="tab-subheading">Manage your work orders, track earnings, and advance your skills.</p>
        </div>

        <TechHero profile={profile} onRefresh={refresh} />

        <div style={{ marginBottom: 20 }}>
          <TechKPIs kpis={kpis} />
        </div>

        <div className="tab-grid-layout" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 20 }}>
          <QuickActions />
          <ScheduleWidget schedule={schedule} />
        </div>

        <div className="tab-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <NotificationWidget notifications={notifications} />
          <TrainingProgressCard training={training} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <PerformanceCharts performance={performance} />
        </div>

        <div style={{ maxWidth: 420, marginBottom: 20 }}>
          <ProfileSummaryCard profile={profile} />
        </div>
      </div>
    </>
  )
}
