import React from 'react'
import { useSystemPerformance } from '../hooks/useSystemPerformance'
import { PERFORMANCE_CHARTS } from '../config/performanceCharts'
import { ComponentHealthCard } from '../components/ComponentHealthCard'
import { PerformanceMetricsGrid } from '../components/PerformanceMetricsGrid'
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
    <div className="ew-page" role="tabpanel" aria-label="system performance">
      {plants.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
          {plants.length > 1 && (
            <select
              value={selectedPlantId ?? ''}
              onChange={(e) => setSelectedPlantId(Number(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                marginRight: 'auto',
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
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {syncing ? 'Syncing...' : 'Sync Telemetry'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={refresh}
            disabled={loading || syncing}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}

      {unreadAlerts.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
            <ComponentHealthCard
              metrics={summary?.health ?? null}
              error={error && !summary?.health.overallHealth ? 'Health data unavailable' : null}
            />
            <PerformanceMetricsGrid
              summary={summary}
            />
          </div>

          <div>
            <div className="ew-divider-head">
              <h3 className="ew-divider-title">Photovoltaic Output Analytics</h3>
              <span className="ew-divider-sub">Daily, monthly &amp; lifetime energy generation profiles</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-3)' }}>
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
        </div>
      )}

      {!loading && !summary && !hasCriticalError && (
        <PerformanceEmptyState />
      )}
    </div>
  )
}
