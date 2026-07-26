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
import DashboardSprites from '../../components/dashboard/DashboardSprites'

export default function SystemPerformance() {
  const { summary, charts, loading, error, refresh } = useSystemPerformance()

  const hasCriticalError = !!(error?.hasError && !summary)

  return (
    <>
      <DashboardSprites />
      <div className="tab-content" role="tabpanel" aria-label="system performance" style={{ display: 'block' }}>
        <div className="tab-header-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="tab-heading">Real-Time System Analytics</h2>
              <p className="tab-subheading">
                Track live photovoltaic energy output, consumption ratios, grid balance imports/exports, and performance ratio (PR) health scores.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={refresh}
              disabled={loading}
              style={{ padding: '8px 16px', fontSize: '11px', width: 'auto', height: 'auto', flexShrink: 0 }}
            >
              {loading ? '\u23F3' : '\uD83D\uDD04'} {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {hasCriticalError && error && (
          <PerformanceErrorBanner
            severity="critical"
            message={error.message}
            onRetry={refresh}
          />
        )}

        {loading && <PerformanceLoadingSkeleton />}

        {!loading && summary && (
          <div id="perfContentContainer" style={{ display: 'block' }}>
            <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', marginBottom: '20px' }}>
              <ComponentHealthCard
                metrics={summary?.health ?? null}
                error={error && !summary?.health.overallHealth ? 'Health data unavailable' : null}
              />
              <PerformanceMetricsGrid
                summary={summary}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
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
        )}

        {!loading && !summary && !hasCriticalError && <PerformanceEmptyState />}
      </div>
    </>
  )
}
