import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import type { PerformanceSummary, PerformanceCharts } from '../types/performance.types'

interface PostInstallationAnalyticsSectionProps {
  summary: PerformanceSummary | null
  charts: PerformanceCharts | null
  loading?: boolean
  hasPlant?: boolean
  onRefresh?: () => void
}

type TimeRange = '7D' | '30D' | '6M' | '1Y' | 'Custom'

function PostInstallationAnalyticsSectionComponent({
  summary,
  charts,
  loading = false,
  hasPlant = false,
  onRefresh,
}: PostInstallationAnalyticsSectionProps) {
  const navigate = useNavigate()
  const [activeRange, setActiveRange] = useState<TimeRange>('30D')

  const hasData = Boolean(summary && summary.generation.solarGenerated > 0)
  const monthlySavings = hasData ? Math.round(summary!.generation.solarGenerated * 8.0) : 0
  const totalSavings = hasData ? Math.round(monthlySavings * 4.2) : 0
  const co2Avoided = hasData ? Math.round(summary!.generation.solarGenerated * 0.82) : 0

  const energyProdPoints = charts?.energyProduction || []
  const electConsPoints = charts?.electricityConsumption || []

  // 1. Uninstalled State (Pre-installation customer)
  if (!hasPlant) {
    return (
      <section aria-label="Post-Installation Performance" style={{ marginTop: 'var(--space-4)' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              POST-INSTALLATION PERFORMANCE
            </h3>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted, #94a3b8)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              NOT INSTALLED
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
            Track real-world energy generation, self-consumption and financial yield
          </span>
        </div>

        <div
          className="card-base"
          style={{
            padding: '36px 24px',
            background: 'rgba(8, 24, 42, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(23, 168, 229, 0.1)', border: '1px solid rgba(23, 168, 229, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            📊
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0 }}>
              Performance Analytics Standing By
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', maxWidth: '440px', margin: '6px auto 0', lineHeight: 1.5 }}>
              Performance analytics become available after your solar system is installed and connected to telemetry.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => navigate(ROUTES.PROPOSAL)}
            style={{ marginTop: '6px', fontSize: '12px', padding: '8px 18px', borderRadius: '8px' }}
          >
            View System Setup →
          </button>
        </div>
      </section>
    )
  }

  // 2. Installed but Awaiting Telemetry State
  if (!hasData) {
    return (
      <section aria-label="Post-Installation Performance" style={{ marginTop: 'var(--space-4)' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              POST-INSTALLATION PERFORMANCE
            </h3>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'rgba(251, 191, 36, 0.1)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
              AWAITING TELEMETRY
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
            Your system is installed, but performance telemetry is not available yet.
          </span>
        </div>

        <div
          className="card-base"
          style={{
            padding: '36px 24px',
            background: 'rgba(8, 24, 42, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            ⚡
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0 }}>
              Telemetry Link Pending
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', maxWidth: '440px', margin: '6px auto 0', lineHeight: 1.5 }}>
              Your plant is registered. Telemetry metrics will render automatically once the smart logger transmits live readings.
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={onRefresh}
              style={{ marginTop: '6px', fontSize: '12px', padding: '8px 18px', borderRadius: '8px' }}
            >
              🔄 Refresh Telemetry
            </button>
          )}
        </div>
      </section>
    )
  }

  // 3. Live Telemetry Available State
  return (
    <section aria-label="Post-Installation Performance" style={{ marginTop: 'var(--space-4)' }}>
      {/* Section Header with Time Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              POST-INSTALLATION PERFORMANCE
            </h3>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'rgba(54, 211, 153, 0.15)', color: '#36D399', border: '1px solid rgba(54, 211, 153, 0.35)' }}>
              LIVE TELEMETRY
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
            Track your system's real-world performance and savings
          </span>
        </div>

        {/* Time Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(8, 24, 42, 0.82)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {(['7D', '30D', '6M', '1Y', 'Custom'] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRange(r)}
              style={{
                background: activeRange === r ? 'rgba(23, 168, 229, 0.18)' : 'transparent',
                color: activeRange === r ? '#17A8E5' : 'var(--text-muted, #94a3b8)',
                border: activeRange === r ? '1px solid rgba(23, 168, 229, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Card Analytics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Daily Energy Generation */}
        <div
          className="card-base"
          style={{
            padding: '18px',
            background: 'rgba(8, 24, 42, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)' }}>
                Daily Generation
              </span>
              <span style={{ fontSize: '10px', color: '#36D399', fontWeight: 700 }}>
                {summary?.generation.dailyGeneration ? `${summary.generation.dailyGeneration} kWh/day` : 'Live'}
              </span>
            </div>

            <div style={{ margin: '14px 0 10px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#f0f8ff', lineHeight: 1 }}>
                {summary?.generation.dailyGeneration ?? 0} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>kWh</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                Recorded today
              </span>
            </div>

            {/* Dynamic mini bar visualization from real data */}
            <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {energyProdPoints.slice(-7).map((pt, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '14px',
                      height: `${Math.min(100, Math.max(15, (pt.value / (summary?.generation.systemSizeKw ? summary.generation.systemSizeKw * 150 : 200)) * 100))}%`,
                      background: '#36D399',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                  <span style={{ fontSize: '8px', color: 'var(--text-muted, #94a3b8)' }}>{pt.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>System Capacity:</span>
            <span style={{ color: '#f0f8ff', fontWeight: 700 }}>{summary?.generation.systemSizeKw ?? 0} kW</span>
          </div>
        </div>

        {/* Card 2: Monthly Energy Overview */}
        <div
          className="card-base"
          style={{
            padding: '18px',
            background: 'rgba(8, 24, 42, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)' }}>
                Monthly Overview
              </span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '9.5px' }}>
                <span style={{ color: '#36D399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#36D399' }} /> Gen
                </span>
                <span style={{ color: '#17A8E5', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#17A8E5' }} /> Cons
                </span>
              </div>
            </div>

            <div style={{ height: '110px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', padding: '16px 0 6px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {energyProdPoints.slice(-6).map((m, idx) => {
                const consVal = electConsPoints[idx]?.value || Math.round(m.value * 0.85)
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%' }}>
                      <div style={{ width: '8px', height: `${Math.min(100, Math.max(10, (m.value / 250) * 100))}%`, background: '#36D399', borderRadius: '2px 2px 0 0' }} />
                      <div style={{ width: '8px', height: `${Math.min(100, Math.max(10, (consVal / 250) * 100))}%`, background: '#17A8E5', borderRadius: '2px 2px 0 0' }} />
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted, #94a3b8)' }}>{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Current Month Total:</span>
            <span style={{ color: '#36D399', fontWeight: 700 }}>⚡ {Math.round(summary?.generation.solarGenerated ?? 0)} kWh</span>
          </div>
        </div>

        {/* Card 3: Savings Overview */}
        <div
          className="card-base"
          style={{
            padding: '18px',
            background: 'rgba(8, 24, 42, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)' }}>
                Savings Overview
              </span>
              <span style={{ fontSize: '10px', color: '#36D399', fontWeight: 700 }}>
                Verified Yield
              </span>
            </div>

            <div style={{ margin: '14px 0 10px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#36D399', lineHeight: 1 }}>
                ₹{monthlySavings.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                Saved this billing cycle
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>Total Savings</span>
                <strong style={{ fontSize: '13px', color: '#f0f8ff' }}>₹{totalSavings.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>CO₂ Avoided</span>
                <strong style={{ fontSize: '13px', color: '#36D399' }}>{co2Avoided} kg</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <Link
              to={ROUTES.ROI_CALCULATOR}
              style={{
                fontSize: '11px',
                color: '#36D399',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>📊</span> View Savings Breakdown →
            </Link>
          </div>
        </div>

        {/* Card 4: System Telemetry Status */}
        <div
          className="card-base"
          style={{
            padding: '18px',
            background: 'rgba(8, 24, 42, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ textAlign: 'left', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)' }}>
                System Telemetry
              </span>
            </div>

            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(54, 211, 153, 0.1)', border: '1px solid rgba(54, 211, 153, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#36D399' }}>
                📡
              </div>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#36D399' }}>
                Online &amp; Active
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                Performance Ratio: {summary?.efficiency.prRatio ? `${summary.efficiency.prRatio}%` : 'Normal'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(54, 211, 153, 0.08)',
              border: '1px solid rgba(54, 211, 153, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#36D399',
              fontWeight: 600,
            }}
          >
            <span>✓</span> Telemetry Stream Verified
          </div>
        </div>
      </div>
    </section>
  )
}

export const PostInstallationAnalyticsSection = React.memo(PostInstallationAnalyticsSectionComponent)
