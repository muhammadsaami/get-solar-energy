import React from 'react'
import { useSystemPerformance } from '../hooks/useSystemPerformance'
import { PERFORMANCE_CHARTS } from '../config/performanceCharts'
import { ComponentHealthCard } from '../components/ComponentHealthCard'
import { EnergyProductionCard } from '../components/EnergyProductionCard'
import { ElectricityConsumptionCard } from '../components/ElectricityConsumptionCard'
import { SystemPerformanceCard } from '../components/SystemPerformanceCard'
import { PostInstallationAnalyticsSection } from '../components/PostInstallationAnalyticsSection'
import { PerformanceChartCard } from '../components/PerformanceChartCard'
import { PerformanceLoadingSkeleton } from '../components/PerformanceLoadingSkeleton'
import { PerformanceEmptyState } from '../components/PerformanceEmptyState'
import { PerformanceErrorBanner } from '../components/PerformanceErrorBanner'
import PerformanceChartsRenderer from '../components/PerformanceChartsRenderer'

export default function SystemPerformance() {
  const {
    plants,
    activePlant,
    selectedPlantId,
    setSelectedPlantId,
    summary,
    charts,
    alerts,
    loading,
    syncing,
    error,
    refresh,
    syncTelemetry,
    acknowledgeAlert,
  } = useSystemPerformance()

  const hasCriticalError = !!(error?.hasError && !summary)
  const unreadAlerts = alerts.filter((a) => !a.is_read)

  return (
    <div className="ew-page" role="tabpanel" aria-label="system performance" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Top Action Bar / Plant Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f8ff', margin: 0 }}>
            Solar System Performance &amp; Health
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
            Real-time telemetry, component diagnostic scale &amp; energy analytics
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {plants.length > 0 && (
            <select
              value={selectedPlantId ?? ''}
              onChange={(e) => setSelectedPlantId(Number(e.target.value))}
              style={{
                background: 'rgba(8, 24, 42, 0.82)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {plants.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#0a192f', color: '#FFFFFF' }}>
                  Plant #{p.id} — {p.capacity_kw}kW ({p.city})
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={syncTelemetry}
            disabled={loading || syncing || !activePlant}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#ff8a1d',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚡</span> {syncing ? 'Syncing...' : 'Sync Telemetry'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={refresh}
            disabled={loading || syncing}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {unreadAlerts.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {unreadAlerts.map((alt) => (
            <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 600 }}>
                ⚠️ [{alt.severity}] {alt.alert_type}: {alt.message}
              </span>
              <button
                onClick={() => acknowledgeAlert(alt.id)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
              >
                Mark as Read
              </button>
            </div>
          ))}
        </div>
      )}

      {hasCriticalError && error && (
        <PerformanceErrorBanner
          severity="critical"
          message={error.message}
          onRetry={refresh}
        />
      )}

      {loading && <PerformanceLoadingSkeleton />}

      {!loading && summary && (
        <div id="perfContentContainer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Top 4 Operational Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <ComponentHealthCard
              metrics={summary?.health ?? null}
              error={error && !summary?.health.overallHealth ? 'Health data unavailable' : null}
            />
            <EnergyProductionCard
              metrics={summary?.generation ?? null}
              error={error ? 'Production data unavailable' : null}
            />
            <ElectricityConsumptionCard
              metrics={summary?.consumption ?? null}
              error={error ? 'Consumption data unavailable' : null}
            />
            <SystemPerformanceCard
              summary={summary}
              error={error ? 'Performance data unavailable' : null}
            />
          </div>

          {/* Post-Installation Performance Analytics Section */}
          <PostInstallationAnalyticsSection
            summary={summary}
            charts={charts}
            loading={loading}
          />

          {/* Photovoltaic Output Analytics (Detailed Extended Charts) */}
          <div style={{ marginTop: 'var(--space-2)' }}>
            <div className="ew-divider-head" style={{ marginBottom: '16px' }}>
              <h3 className="ew-divider-title" style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Photovoltaic Diagnostic Output Analytics
              </h3>
              <span className="ew-divider-sub" style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Detailed generation trends, carbon reduction &amp; PR ratio tracking
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {PERFORMANCE_CHARTS.map((chart) => {
                const chartData = charts
                  ? charts[chart.dataKey as keyof typeof charts]
                  : null
                const hasData = Array.isArray(chartData) ? chartData.length > 0 : false

                return (
                  <PerformanceChartCard
                    key={chart.id}
                    title={chart.title}
                    description={chart.description}
                    theme={chart.colorToken === 'var(--chart-1)' ? '23, 168, 229' : chart.colorToken === 'var(--chart-2)' ? '255, 138, 29' : chart.colorToken === 'var(--chart-6)' ? '251, 191, 36' : '54, 211, 153'}
                    empty={!hasData && !loading}
                    emptyMessage={chart.emptyMessage}
                  >
                    {hasData && !loading && (
                      <PerformanceChartsRenderer
                        chartConfig={chart}
                        data={chartData}
                      />
                    )}
                  </PerformanceChartCard>
                )
              })}
            </div>
          </div>

          {/* Footer Telemetry Status */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(8, 24, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '11px',
              color: 'var(--text-muted, #94a3b8)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#36D399', display: 'inline-block', boxShadow: '0 0 6px #36D399' }} />
              Last telemetry sync: just now
            </span>
            <span>All data is from real-time telemetry and verified sources</span>
            <span>Data provided by GET Solar Energy IoT Platform</span>
          </div>
        </div>
      )}

      {!loading && !summary && !hasCriticalError && (
        <PerformanceEmptyState />
      )}
    </div>
  )
}
