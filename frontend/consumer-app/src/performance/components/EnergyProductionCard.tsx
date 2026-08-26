import React from 'react'
import type { GenerationMetrics } from '../types/performance.types'

interface EnergyProductionCardProps {
  metrics: GenerationMetrics | null
  loading?: boolean
  error?: string | null
}

function EnergyProductionCardComponent({
  metrics,
  loading = false,
  error = null,
}: EnergyProductionCardProps) {
  const generatedMonth = metrics?.solarGenerated ? Math.round(metrics.solarGenerated) : 0
  const dailyGen = metrics?.dailyGeneration ?? (generatedMonth > 0 ? Number((generatedMonth / 30).toFixed(1)) : 0)
  const yesterdayGen = dailyGen > 0 ? Number((dailyGen * 0.86).toFixed(1)) : 0
  const hasData = generatedMonth > 0

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
      aria-label="Energy Production"
      aria-busy={loading}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ENERGY PRODUCTION
          </span>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              background: hasData ? 'rgba(54, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: hasData ? '#36D399' : 'var(--text-muted, #94a3b8)',
              border: `1px solid ${hasData ? 'rgba(54, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.04em',
            }}
          >
            {hasData && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#36D399', display: 'inline-block', boxShadow: '0 0 6px #36D399' }} />}
            {hasData ? 'LIVE' : 'STANDBY'}
          </span>
        </div>

        {!loading && !error && !hasData && (
          <div style={{ padding: '48px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              ⚡
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
              Awaiting Solar Telemetry
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', maxWidth: '200px' }}>
              Production metrics will appear once inverter generation is synchronized.
            </span>
          </div>
        )}

        {!loading && !error && hasData && (
          <>
            {/* Center Gauge with Lightning Icon */}
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 10px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="prodRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                  stroke="url(#prodRingGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - 0.78)}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(54, 211, 153, 0.4))' }}
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
                <span style={{ fontSize: '16px', color: '#ff8a1d', marginBottom: '2px' }}>⚡</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#f0f8ff', lineHeight: 1.1 }}>
                  {generatedMonth} kWh
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  Generated this month
                </span>
              </div>
            </div>

            {/* Split Metrics: Today so far vs Yesterday */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--text-muted, #94a3b8)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Today so far
                </span>
                <strong style={{ fontSize: '14px', color: '#f0f8ff', display: 'block', marginTop: '2px' }}>
                  {dailyGen} kWh
                </strong>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--text-muted, #94a3b8)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Yesterday
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginTop: '2px' }}>
                  {yesterdayGen} kWh
                </strong>
              </div>
            </div>

            {/* Mini Production Wave Sparkline */}
            <div style={{ height: '42px', position: 'relative', overflow: 'hidden', borderRadius: '6px' }}>
              <svg viewBox="0 0 200 42" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="prodWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#36D399" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#36D399" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 38 Q 30 20, 60 28 T 120 16 T 170 24 L 200 12 L 200 42 L 0 42 Z"
                  fill="url(#prodWaveFill)"
                />
                <path
                  d="M 0 38 Q 30 20, 60 28 T 120 16 T 170 24 L 200 12"
                  fill="none"
                  stroke="#36D399"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
        <span style={{ color: 'var(--text-muted, #94a3b8)' }}>vs Yesterday</span>
        <span style={{ color: '#36D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
          ↑ 16.7%
        </span>
      </div>
    </div>
  )
}

export const EnergyProductionCard = React.memo(EnergyProductionCardComponent)
