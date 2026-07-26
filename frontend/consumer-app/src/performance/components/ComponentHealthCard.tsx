import React from 'react'
import type { HealthMetrics } from '../types/performance.types'

interface ComponentHealthCardProps {
  metrics: HealthMetrics | null
  loading?: boolean
  error?: string | null
}

const COMPONENTS = [
  { key: 'inverterHealth' as const, label: 'Solar Inverter' },
  { key: 'panelHealth' as const, label: 'PV Panels' },
  { key: 'batteryHealth' as const, label: 'Battery Storage' },
  { key: 'wiringHealth' as const, label: 'Electrical Wiring' },
]

const DONUT_RADIUS = 40
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

function getHealthColor(score: number): string {
  if (score >= 90) return 'var(--accent-green, #22c55e)'
  if (score >= 75) return 'var(--accent-blue, #17a8e5)'
  if (score >= 50) return 'var(--accent-orange, #f59e0b)'
  return 'var(--accent-red, #ef4444)'
}

function getProgressColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 75) return '#17a8e5'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function ComponentHealthCardComponent({
  metrics,
  loading = false,
  error = null,
}: ComponentHealthCardProps) {
  const overallHealth = metrics?.overallHealth ?? 0
  const healthLabel = metrics?.healthLabel ?? 'Not Available'
  const healthColor = getHealthColor(overallHealth)

  return (
    <div
      className="card-base"
      style={{ '--card-theme': '234, 179, 8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } as React.CSSProperties}
      role="region"
      aria-label="Component Health Status"
      aria-busy={loading}
    >
      <div>
        <div className="kpi-header-row">
          <span className="kpi-title">Component Health & Status</span>
          {!loading && !error && metrics && (
            <span className="api-tag" style={{ fontSize: '7px', padding: '1px 4px', '--card-theme': '234, 179, 8' } as React.CSSProperties}>
              POST /api/amc-recommendation
            </span>
          )}
        </div>

        {loading && (
          <div className="perf-progress-list" style={{ marginTop: '15px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="perf-progress-item">
                <div className="perf-progress-labels">
                  <div className="skeleton skeleton-text narrow" style={{ width: '80px' }} />
                  <div className="skeleton skeleton-text narrow" style={{ width: '30px' }} />
                </div>
                <div className="perf-progress-track">
                  <div className="skeleton" style={{ height: '6px', borderRadius: '3px', width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '10px', color: 'var(--accent-red, #ef4444)' }}>
            {error}
          </div>
        )}

        {!loading && !error && !metrics && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
            Complete a bill analysis and AMC recommendation to see component health.
          </div>
        )}

        {!loading && !error && metrics && (
          <>
            <div className="perf-donut-box" style={{ marginTop: '15px' }}>
              <svg className="perf-donut-svg" aria-hidden="true">
                <circle className="perf-donut-track" cx="45" cy="45" r={DONUT_RADIUS} />
                <circle
                  className="perf-donut-fill"
                  cx="45"
                  cy="45"
                  r={DONUT_RADIUS}
                  style={{
                    stroke: healthColor,
                    strokeDasharray: DONUT_CIRCUMFERENCE,
                    strokeDashoffset: DONUT_CIRCUMFERENCE - (DONUT_CIRCUMFERENCE * overallHealth) / 100,
                    transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </svg>
              <div className="perf-donut-text-box">
                <span className="perf-donut-val" style={{ color: overallHealth > 0 ? healthColor : 'var(--text-muted)' }}>
                  {overallHealth > 0 ? `${Math.round(overallHealth)}%` : 'N/A'}
                </span>
                <span className="perf-donut-lbl" style={{ color: overallHealth > 0 ? healthColor : 'var(--text-muted)' }}>
                  {overallHealth > 0 ? healthLabel : 'Not Available'}
                </span>
              </div>
            </div>

            <div className="perf-progress-list" style={{ marginTop: '15px' }}>
              {COMPONENTS.map((comp) => {
                const score = metrics[comp.key]
                const hasData = metrics.overallHealth > 0 && score > 0
                const color = getProgressColor(score)
                return (
                  <div key={comp.key} className="perf-progress-item">
                    <div className="perf-progress-labels">
                      <span>{comp.label}</span>
                      {hasData ? (
                        <strong>{Math.round(score)}%</strong>
                      ) : (
                        <strong style={{ color: 'var(--text-muted)', fontSize: '9px' }}>Unavailable</strong>
                      )}
                    </div>
                    <div className="perf-progress-track">
                      {hasData ? (
                        <div
                          className="perf-progress-fill"
                          style={{
                            width: `${score}%`,
                            background: color,
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      ) : (
                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-color)', opacity: 0.3 }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export const ComponentHealthCard = React.memo(ComponentHealthCardComponent)
