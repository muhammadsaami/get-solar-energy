import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { ComponentHealthCard } from '../../performance/components/ComponentHealthCard'
import { EnergyProductionCard } from '../../performance/components/EnergyProductionCard'
import { ElectricityConsumptionCard } from '../../performance/components/ElectricityConsumptionCard'
import { SystemPerformanceCard } from '../../performance/components/SystemPerformanceCard'
import { PostInstallationAnalyticsSection } from '../../performance/components/PostInstallationAnalyticsSection'
import { useSystemPerformance } from '../../performance/hooks/useSystemPerformance'
import { fmtINR } from '../../utils/dashboard'
import type { DashboardDerived } from '../../utils/dashboard'
import type { CustomerDashboardData } from '../../hooks/useCustomerDashboard'

interface Props {
  data: CustomerDashboardData
  derived: DashboardDerived
  loading?: boolean
}

export default function AnalyticsCharts({ data, derived, loading = false }: Props) {
  const navigate = useNavigate()
  const perf = useSystemPerformance()

  const hasPlant = perf.plants.length > 0
  const isPostInstall = hasPlant && perf.summary !== null

  // Pre-Installation Mode: Customer has not installed a physical plant yet
  if (!hasPlant && !loading && !perf.loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        {/* Pre-Installation Assessment Command Center */}
        <section aria-label="Pre-Installation Assessment Mode">
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f8ff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PRE-INSTALLATION
              </h3>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'rgba(23, 168, 229, 0.12)', color: '#17A8E5', border: '1px solid rgba(23, 168, 229, 0.3)' }}>
                ASSESSMENT MODE
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
              Your solar system has not been commissioned yet. Complete your engineering assessment to unlock system deployment.
            </span>
          </div>

          <div
            className="card-base"
            style={{
              padding: '24px',
              background: 'rgba(8, 24, 42, 0.82)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ maxWidth: '560px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f0f8ff', margin: '0 0 6px' }}>
                  Planning &amp; System Sizing in Progress
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                  Operational hardware telemetry (PR ratio, live inverter yield, battery health, and grid export) will activate automatically once your physical solar installation goes live.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate(ROUTES.SITE_SURVEY)}
                  style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '8px' }}
                >
                  View Assessment →
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate(ROUTES.PROPOSAL)}
                  style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '8px' }}
                >
                  View AI Proposal →
                </button>
              </div>
            </div>

            {/* Assessment Milestone Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Baseline Consumption
                </span>
                <strong style={{ fontSize: '14px', color: '#f0f8ff' }}>
                  {derived.monthlyUnits ? `${derived.monthlyUnits} kWh/mo` : 'Awaiting Bill Upload'}
                </strong>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Assessed Rooftop Capacity
                </span>
                <strong style={{ fontSize: '14px', color: '#f0f8ff' }}>
                  {derived.recommendedKw ? `${derived.recommendedKw} kW System` : 'Awaiting Roof Analysis'}
                </strong>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Estimated Annual Savings
                </span>
                <strong style={{ fontSize: '14px', color: '#36D399' }}>
                  {derived.annualSavings ? `${fmtINR(derived.annualSavings)}/yr` : 'Awaiting ROI Assessment'}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Post-Installation Analytics in Uninstalled State */}
        <PostInstallationAnalyticsSection
          summary={null}
          charts={null}
          loading={loading || perf.loading}
          hasPlant={false}
        />
      </div>
    )
  }

  // Post-Installation Mode: Customer has registered plant
  const healthMetrics = perf.summary?.health ?? null
  const generationMetrics = perf.summary?.generation ?? null
  const consumptionMetrics = perf.summary?.consumption ?? (derived.monthlyUnits ? {
    solarConsumed: 0,
    monthlyConsumption: derived.monthlyUnits,
    selfConsumptionPct: 0,
  } : null)
  const perfSummary = perf.summary ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
      {/* 4 Core Operational Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        <ComponentHealthCard
          metrics={healthMetrics}
          loading={loading || perf.loading}
        />
        <EnergyProductionCard
          metrics={generationMetrics}
          loading={loading || perf.loading}
        />
        <ElectricityConsumptionCard
          metrics={consumptionMetrics}
          loading={loading || perf.loading}
        />
        <SystemPerformanceCard
          summary={perfSummary}
          loading={loading || perf.loading}
        />
      </div>

      {/* Post-Installation Analytics Section */}
      <PostInstallationAnalyticsSection
        summary={perfSummary}
        charts={perf.charts}
        loading={loading || perf.loading}
        hasPlant={hasPlant}
        onRefresh={() => perf.refresh()}
      />
    </div>
  )
}