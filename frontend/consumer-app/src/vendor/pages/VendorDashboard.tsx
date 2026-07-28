import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorDashboard } from '../hooks/useVendorDashboard'
import VendorHeroSection from '../components/VendorHeroSection'
import QuickActions from '../components/QuickActions'
import TodaySchedule from '../components/TodaySchedule'
import VendorKpiCards from '../components/VendorKpiCards'
import VendorEmptyState from '../components/VendorEmptyState'
import { VENDOR_ROUTES } from '../config/vendor.config'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const {
    kpis, todaysVisits, todaysTasks, overdueTasks,
    loading, error, refresh,
  } = useVendorDashboard()

  const handleAction = (action: string) => {
    switch (action) {
      case 'schedule_visit': navigate(VENDOR_ROUTES.VISITS); break
      case 'update_installation': navigate(VENDOR_ROUTES.INSTALLATIONS); break
      case 'upload_photos': navigate(VENDOR_ROUTES.TASKS); break
      case 'complete_task': navigate(VENDOR_ROUTES.TASKS); break
      case 'schedule_followup': navigate(VENDOR_ROUTES.VISITS); break
      case 'generate_report': navigate(VENDOR_ROUTES.REPORTS); break
      case 'request_support': break
      case 'create_amc': navigate(VENDOR_ROUTES.AMC); break
    }
  }

  if (error && loading === false) {
    return <VendorEmptyState icon="icon-alert-triangle" title="Failed to load" description={error} action={{ label: 'Retry', onClick: refresh }} />
  }

  const DashboardContent = () => (
    <>
      <VendorHeroSection
        kpis={kpis}
        visitCount={todaysVisits.length}
        taskCount={todaysTasks.length}
        overdueCount={overdueTasks.length}
        onRefresh={refresh}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <QuickActions onAction={handleAction} />
        <TodaySchedule visits={todaysVisits} tasks={todaysTasks} overdueTasks={overdueTasks} />
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 className="card-title">Operational KPIs</h3>
        </div>
        <VendorKpiCards kpis={kpis} loading={loading} />
      </div>
    </>
  )

  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      {loading && !kpis ? (
        <div style={{ padding: 'var(--space-6)' }}>
          <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }} />
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : (
        <DashboardContent />
      )}
    </div>
  )
}
