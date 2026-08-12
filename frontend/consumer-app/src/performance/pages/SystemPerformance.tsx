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
  const { summary, charts, loading, error, refresh } = useSystemPerformance()

  const hasCriticalError = !!(error?.hasError && !summary)

  return (
    <div className="ew-page" role="tabpanel" aria-label="system performance">
      <header className="ew-mission-bar" role="banner" aria-label="System Performance Header">
        <div className="ew-mission-scope">
          <span className="ew-live-dot" />
          <span className="ew-scope-badge">SYSTEM / SOLAR-TELEMETRY</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Photovoltaic Output &amp; Inverter Health</span>
        </div>

        <div className="ew-mission-stats">
          <div className="ew-mission-stat-item">
            <span>System Health:</span>
            <strong style={{ color: 'var(--color-green)' }}>
              {summary?.health?.healthLabel ? summary.health.healthLabel.toUpperCase() : 'OPTIMAL'}
            </strong>
          </div>
          <div className="ew-mission-stat-item">
            <span>Daily Output:</span>
            <strong style={{ color: 'var(--color-cyan)' }}>
              {summary?.generation?.dailyGeneration ? `${summary.generation.dailyGeneration} kWh` : '—'}
            </strong>
          </div>
        </div>

        <div className="ew-mission-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={refresh}
            disabled={loading}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {loading ? 'Refreshing...' : 'Sync Telemetry'}
          </button>
        </div>
      </header>

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

      {!loading && !summary && !hasCriticalError && <PerformanceEmptyState />}
    </div>
  )
}
