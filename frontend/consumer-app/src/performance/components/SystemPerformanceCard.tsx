import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import type { PerformanceSummary } from '../types/performance.types'

interface SystemPerformanceCardProps {
  summary: PerformanceSummary | null
  loading?: boolean
  error?: string | null
}

function SystemPerformanceCardComponent({
  summary,
  loading = false,
  error = null,
}: SystemPerformanceCardProps) {
  const prRatio = summary?.efficiency.prRatio ?? 0
  const selfSufficiency = summary?.consumption.selfConsumptionPct ?? 0
  const gridDependence = summary?.grid.gridDependencyPct ?? 0
  const rating = summary?.efficiency.performanceRating ?? 'Average'
  const hasData = prRatio > 0

  return (
    <div
      className="card-base perf-command-card"
      style={{
        '--card-theme': '54, 211, 153',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        background: 'rgba(8, 24, 42, 0.82)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
        minHeight: '410px',
      } as React.CSSProperties}
      role="region"
      aria-label="System Performance"
      aria-busy={loading}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SYSTEM PERFORMANCE
          </span>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted, #94a3b8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              letterSpacing: '0.04em',
            }}
          >
            POST-INSTALLATION
          </span>
        </div>

        {!loading && !error && !hasData && (
          <div style={{ padding: '48px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📊
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
              Operational Performance Standing By
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', maxWidth: '200px' }}>
              Real-time PR ratio & sufficiency metrics activate after solar commissioning.
            </span>
          </div>
        )}

        {!loading && !error && hasData && (
          <>
            {/* Full Circular Ring Chart */}
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 12px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="sysPerfRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#17A8E5" />
                    <stop offset="100%" stopColor="#36D399" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#sysPerfRingGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(100, prRatio) / 100)}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(54, 211, 153, 0.45))' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#36D399', lineHeight: 1 }}>
                  {Math.round(prRatio)}%
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                  Overall Performance
                </span>
              </div>
            </div>

            {/* 3-Column Compact KPI Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {/* Tile 1: PR Ratio */}
              <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '8.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  PR Ratio
                </span>
                <strong style={{ fontSize: '13px', color: '#f0f8ff', display: 'block', margin: '2px 0 3px' }}>
                  {Math.round(prRatio)}%
                </strong>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#36D399', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {rating}
                </span>
              </div>

              {/* Tile 2: Self-Sufficiency */}
              <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '8.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Self-Sufficiency
                </span>
                <strong style={{ fontSize: '13px', color: '#f0f8ff', display: 'block', margin: '2px 0 3px' }}>
                  {Math.round(selfSufficiency)}%
                </strong>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  GOOD
                </span>
              </div>

              {/* Tile 3: Grid Dependence */}
              <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '8.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Grid Dependence
                </span>
                <strong style={{ fontSize: '13px', color: '#f0f8ff', display: 'block', margin: '2px 0 3px' }}>
                  {Math.round(gridDependence)}%
                </strong>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#17A8E5', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  LOW
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'center' }}>
        <Link
          to={ROUTES.SYSTEM_PERFORMANCE}
          style={{
            fontSize: '11px',
            color: '#36D399',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color var(--transition-fast)',
          }}
        >
          <span style={{ fontSize: '10px' }}>👁️</span> View Detailed Insights →
        </Link>
      </div>
    </div>
  )
}

export const SystemPerformanceCard = React.memo(SystemPerformanceCardComponent)
