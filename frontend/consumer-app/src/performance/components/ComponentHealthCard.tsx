import React from 'react'
import type { HealthMetrics } from '../types/performance.types'

interface ComponentHealthCardProps {
  metrics: HealthMetrics | null
  loading?: boolean
  error?: string | null
}

const COMPONENTS = [
  { key: 'inverterHealth' as const, label: 'Solar Inverter', icon: '⚡' },
  { key: 'panelHealth' as const, label: 'PV Panels', icon: '☀️' },
  { key: 'batteryHealth' as const, label: 'Battery Storage', icon: '🔋' },
  { key: 'wiringHealth' as const, label: 'Electrical Wiring', icon: '🔌' },
]

function getHealthColor(score: number): string {
  if (score >= 90) return '#36D399'
  if (score >= 75) return '#17A8E5'
  if (score >= 50) return '#FBBF24'
  return '#F43F5E'
}

function ComponentHealthCardComponent({
  metrics,
  loading = false,
  error = null,
}: ComponentHealthCardProps) {
  const overallHealth = metrics?.overallHealth ?? 0
  const healthLabel = metrics?.healthLabel ?? 'Awaiting Data'
  const hasData = overallHealth > 0
  const healthColor = getHealthColor(overallHealth)

  // Semicircular Gauge (180 deg arc)
  // Arc radius = 58, Path = "M 12 70 A 58 58 0 0 1 128 70"
  // Arc length = PI * 58 ≈ 182.2
  const arcLength = 182.2
  const arcOffset = hasData ? arcLength - (arcLength * Math.min(100, overallHealth)) / 100 : arcLength

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
      aria-label="Solar Health Scale"
      aria-busy={loading}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SOLAR HEALTH SCALE
          </span>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              background: hasData ? 'rgba(54, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
              color: hasData ? '#36D399' : 'var(--text-muted, #94a3b8)',
              border: `1px solid ${hasData ? 'rgba(54, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              letterSpacing: '0.04em',
            }}
          >
            {hasData ? 'TELEMETRY LIVE' : 'PRE-INSTALLATION'}
          </span>
        </div>

        {loading && (
          <div className="perf-progress-list" style={{ marginTop: '24px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="perf-progress-item">
                <div className="perf-progress-labels">
                  <div className="skeleton skeleton-text narrow" style={{ width: '90px' }} />
                  <div className="skeleton skeleton-text narrow" style={{ width: '35px' }} />
                </div>
                <div className="perf-progress-track">
                  <div className="skeleton" style={{ height: '6px', borderRadius: '3px', width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '36px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--accent-red, #ef4444)' }}>
            {error}
          </div>
        )}

        {!loading && !error && !hasData && (
          <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              🛡️
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f8ff' }}>
              Solar Health Scale Standing By
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', maxWidth: '240px', lineHeight: 1.4 }}>
              Hardware diagnostics and telemetry activate once your rooftop solar system is commissioned and linked.
            </span>
          </div>
        )}

        {!loading && !error && hasData && (
          <>
            {/* Semicircular Gauge */}
            <div style={{ position: 'relative', width: '150px', height: '90px', margin: '0 auto 8px' }}>
              <svg viewBox="0 0 140 85" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="healthArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#17A8E5" />
                    <stop offset="60%" stopColor="#36D399" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="healthGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Background track */}
                <path
                  d="M 12 70 A 58 58 0 0 1 128 70"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Active progress arc */}
                <path
                  d="M 12 70 A 58 58 0 0 1 128 70"
                  fill="none"
                  stroke="url(#healthArcGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={arcOffset}
                  style={{
                    filter: overallHealth >= 85 ? 'url(#healthGlow)' : 'none',
                    transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>

              {/* Center value readout */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span
                    id="healthScoreVal"
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      color: healthColor,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {Math.round(overallHealth)}%
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: healthColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: '2px',
                  }}
                >
                  {healthLabel}
                </span>
              </div>
            </div>

            {/* Performance Status Banner */}
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: overallHealth >= 85 ? 'rgba(54, 211, 153, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                border: `1px solid ${overallHealth >= 85 ? 'rgba(54, 211, 153, 0.25)' : 'rgba(251, 191, 36, 0.25)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: overallHealth >= 85 ? 'rgba(54, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                  color: overallHealth >= 85 ? '#36D399' : '#FBBF24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.3 }}>
                <strong style={{ color: '#f0f8ff', display: 'block', fontSize: '11px' }}>
                  {overallHealth >= 85 ? 'Your system is performing exceptionally well.' : 'System performance is operational.'}
                </strong>
                Hardware telemetry verified.
              </div>
            </div>

            {/* Component Health List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {COMPONENTS.map((comp) => {
                const val = metrics ? metrics[comp.key] : null
                const hasScore = typeof val === 'number' && val > 0
                const itemColor = hasScore ? getHealthColor(val) : 'var(--text-muted)'
                return (
                  <div key={comp.key} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary, #cbd5e1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>{comp.icon}</span>
                        {comp.label}
                      </span>
                      <strong style={{ color: hasScore ? '#f0f8ff' : 'var(--text-muted, #94a3b8)', fontWeight: hasScore ? 700 : 500, fontSize: hasScore ? '11px' : '10px' }}>
                        {hasScore ? `${Math.round(val)}%` : 'Telemetry unavailable'}
                      </strong>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      {hasScore ? (
                        <div
                          style={{
                            height: '100%',
                            width: `${val}%`,
                            background: itemColor,
                            borderRadius: '2px',
                            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        />
                      ) : (
                        <div style={{ height: '100%', width: '0%', background: 'transparent' }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted, #94a3b8)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasData ? '#36D399' : 'rgba(255,255,255,0.2)', display: 'inline-block', boxShadow: hasData ? '0 0 8px #36D399' : 'none' }} />
        <span>{hasData ? 'Live telemetry synchronized' : 'Awaiting physical installation'}</span>
      </div>
    </div>
  )
}

export const ComponentHealthCard = React.memo(ComponentHealthCardComponent)
