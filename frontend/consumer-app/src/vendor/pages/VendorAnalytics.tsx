import React, { useState, useEffect } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import KpiCard from '../components/KpiCard'
import VendorEmptyState from '../components/VendorEmptyState'
import { getVendorDashboard, getVendorProjects } from '../services/vendor.service'

export function VendorAnalytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Array<{ month: string; revenue: number; installations: number }>>([])
  const [kpis, setKpis] = useState<{
    avgYield: string
    procurementSpeed: string
    slaResponse: string
  }>({
    avgYield: '—',
    procurementSpeed: '—',
    slaResponse: '—',
  })

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [dash, projects] = await Promise.all([
          getVendorDashboard().catch(() => null),
          getVendorProjects().catch(() => []),
        ])
        if (!active) return

        if (projects && projects.length > 0) {
          const monthMap: Record<string, { revenue: number; count: number }> = {}
          for (const p of projects) {
            const dateStr = p.createdAt || p.created_at || p.targetDate
            const month = dateStr ? new Date(dateStr).toLocaleString('default', { month: 'short' }) : 'Current'
            if (!monthMap[month]) monthMap[month] = { revenue: 0, count: 0 }
            monthMap[month].revenue += Number(p.budget || 0)
            monthMap[month].count += 1
          }
          const points = Object.entries(monthMap).map(([month, data]) => ({
            month,
            revenue: data.revenue,
            installations: data.count,
          }))
          setChartData(points)
        } else {
          setChartData([])
        }
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load analytics.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [])

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Executive Performance Analytics"
        subtitle="Deep analytics into system generation performance, procurement efficiency, and SLA compliance."
        badgeText="Real-time Telemetry"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard title="Avg Generation Yield" value={kpis.avgYield} subtext="Awaiting plant telemetry" icon="icon-zap" iconColor="cyan" />
        <KpiCard title="Procurement Speed" value={kpis.procurementSpeed} subtext="PO creation to site delivery" icon="icon-box" iconColor="blue" />
        <KpiCard title="SLA Response Time" value={kpis.slaResponse} subtext="AMC emergency ticket response" icon="icon-shield-check" iconColor="green" />
      </div>

      {chartData.length === 0 ? (
        <VendorEmptyState
          title="No Analytics Data Available"
          description="Analytics and velocity metrics will populate automatically as project installations and telemetry feeds become active."
        />
      ) : (
        <div className="vendor-glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Monthly Revenue & Installation Velocity
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)' }}>
                Historical financial performance and plant yield trajectory
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--vendor-primary)', fontWeight: 700, background: 'rgba(23, 168, 229, 0.12)', padding: '4px 12px', borderRadius: '12px' }}>
              Summary
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingTop: '20px', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {chartData.map((d) => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-primary)', marginBottom: '8px' }}>
                  ₹{(d.revenue / 100000).toFixed(1)}L
                </span>
                <div style={{
                  width: '100%', maxWidth: '40px',
                  height: `${(d.revenue / maxRevenue) * 100}%`,
                  background: 'var(--vendor-grad-blue)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 0 16px rgba(23, 168, 229, 0.35)',
                  transition: 'height 0.6s ease'
                }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vendor-text-muted)', marginTop: '8px' }}>
                  {d.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorAnalytics
