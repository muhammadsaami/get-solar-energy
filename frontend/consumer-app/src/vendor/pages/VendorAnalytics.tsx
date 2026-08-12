import React from 'react'
import DashboardHeader from '../components/DashboardHeader'
import KpiCard from '../components/KpiCard'

export function VendorAnalytics() {
  const chartData = [
    { month: 'Jan', revenue: 3200000, installations: 8, yieldVal: 4.2 },
    { month: 'Feb', revenue: 3800000, installations: 10, yieldVal: 4.3 },
    { month: 'Mar', revenue: 4500000, installations: 12, yieldVal: 4.5 },
    { month: 'Apr', revenue: 4100000, installations: 11, yieldVal: 4.6 },
    { month: 'May', revenue: 5200000, installations: 14, yieldVal: 4.7 },
    { month: 'Jun', revenue: 4850000, installations: 12, yieldVal: 4.4 },
  ]

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Executive Performance Analytics"
        subtitle="Deep analytics into system generation performance, procurement efficiency, and SLA compliance."
        badgeText="Real-time Telemetry"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard title="Avg Generation Yield" value="4.4 kWh/kWp" subtext="Above regional benchmark" previousPeriod="Benchmark 4.1" trend={{ value: '3.2%', positive: true }} icon="icon-zap" iconColor="cyan" />
        <KpiCard title="Procurement Speed" value="4.2 Days" subtext="PO creation to site delivery" previousPeriod="Target 5.0" trend={{ value: '1.1 days', positive: true }} icon="icon-box" iconColor="blue" />
        <KpiCard title="SLA Response Time" value="2.8 Hours" subtext="AMC emergency ticket response" previousPeriod="SLA 4.0h" trend={{ value: '15 mins', positive: true }} icon="icon-shield-check" iconColor="green" />
      </div>

      {/* Analytics Chart Container */}
      <div className="vendor-glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Monthly Revenue & Installation Velocity
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)' }}>
              Historical 6-month financial performance and plant yield trajectory
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--vendor-primary)', fontWeight: 700, background: 'rgba(23, 168, 229, 0.12)', padding: '4px 12px', borderRadius: '12px' }}>
            H1 2026 Summary
          </span>
        </div>

        {/* Visual Bar Chart Visualization */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingTop: '20px', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {chartData.map((d) => (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-primary)', marginBottom: '8px' }}>
                ₹{(d.revenue / 100000).toFixed(1)}L
              </span>
              <div style={{
                width: '100%', maxWidth: '40px',
                height: `${(d.revenue / 5500000) * 100}%`,
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
    </div>
  )
}

export default VendorAnalytics
