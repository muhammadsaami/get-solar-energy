import React from 'react'
import { MdError } from 'react-icons/md'
import type { AMCHealthMetrics } from '../types/amc.types'

interface AMCHealthCardProps {
  health: AMCHealthMetrics | null
  loading?: boolean
  error?: string | null
}

const DONUT_RADIUS = 40
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

function getHealthColor(score: number): string {
  if (score >= 80) return 'var(--accent-green, #22c55e)'
  if (score >= 50) return 'var(--accent-orange, #f59e0b)'
  return 'var(--accent-red, #ef4444)'
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `\u20B9${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `\u20B9${(val / 1000).toFixed(0)}K`
  return `\u20B9${val}`
}

function AMCHealthCardComponent({ health, loading = false, error = null }: AMCHealthCardProps) {
  const overallHealth = health?.overallHealth ?? 0
  const healthColor = getHealthColor(overallHealth)

  return (
    <div
      className="card-base"
      style={{ '--card-theme': '234, 179, 8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } as React.CSSProperties}
      role="region"
      aria-label="AMC Health Status"
      aria-busy={loading}
    >
      <div>
        <div className="kpi-header-row">
          <span className="kpi-title">System Health Score</span>
          {!loading && !error && health && (
            <span className="api-tag" style={{ fontSize: '7px', padding: '1px 4px', '--card-theme': '234, 179, 8' } as React.CSSProperties}>
              POST /api/amc-recommendation
            </span>
          )}
        </div>

        {loading && (
          <div style={{ marginTop: '15px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '8px' }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '10px', color: 'var(--accent-red, #ef4444)' }}>
            {error}
          </div>
        )}

        {!loading && !error && !health && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
            Run an AI Recommendation to see your system health score.
          </div>
        )}

        {!loading && !error && health && (
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
                <span className="perf-donut-lbl" style={{ color: health.systemStatus === 'Healthy' ? healthColor : 'var(--text-muted)' }}>
                  {health.systemStatus}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Generation Drop</span>
                <span style={{ fontWeight: 600, color: health.generationDropPct > 10 ? 'var(--accent-red)' : 'var(--text-navy)' }}>
                  {health.generationDropPct}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monthly Loss</span>
                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{formatCurrency(health.monthlyLossRs)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Next Service</span>
                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                  {health.nextServiceDue
                    ? new Date(health.nextServiceDue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
              {health.urgentActionRequired && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-red)', fontWeight: 600, marginTop: '4px' }}>
                  <MdError size={14} /> Urgent Action Required
                </div>
              )}
              {!health.urgentActionRequired && health.overallHealth >= 80 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px' }}>
                  {'\u2713'} System operating normally
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export const AMCHealthCard = React.memo(AMCHealthCardComponent)
