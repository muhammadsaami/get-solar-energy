import type { CrmPipelineMetrics } from './crm.types'
import { PIPELINE_STAGES } from './crm.types'

interface Props {
  metrics: CrmPipelineMetrics | null
  loading: boolean
}

const STAGE_COLORS: Record<string, string> = {
  'New Lead': '#3b82f6',
  Qualified: '#17a8e5',
  'Site Survey Scheduled': '#f59e0b',
  'Survey Completed': '#10b981',
  'Proposal Generated': '#ff8a1d',
  'Proposal Sent': '#3b82f6',
  Negotiation: '#f97316',
  Won: '#22c55e',
  Closed: '#64748b',
  Lost: '#ef4444',
}

export default function CrmPipelineBoard({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', padding: 'var(--space-2) 0' }}>
        {PIPELINE_STAGES.map(s => (
          <div key={s} className="skeleton-loader" style={{ minWidth: 220, height: 320, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
        ))}
      </div>
    )
  }

  const maxCount = Math.max(1, ...PIPELINE_STAGES.map(s => metrics?.stageCounts?.[s] ?? 0))

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', padding: 'var(--space-2) 0', minHeight: 360 }}>
        {PIPELINE_STAGES.map(stage => {
          const count = metrics?.stageCounts?.[stage] ?? 0
          const value = metrics?.stageValues?.[stage] ?? 0
          const expected = metrics?.stageExpected?.[stage] ?? 0
          const prob = metrics?.stageProbabilities?.[stage] ?? 0
          const barPct = (count / maxCount) * 100

          return (
            <div
              key={stage}
              style={{
                minWidth: 220, flex: '0 0 auto',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: STAGE_COLORS[stage] || 'var(--text-muted)',
                color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{stage}</span>
                <span style={{
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                }}>{count}</span>
              </div>

              <div style={{ padding: 'var(--space-3) var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Pipeline Value</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>₹{value.toLocaleString('en-IN')}</div>
                </div>

                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Expected Revenue</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>₹{expected.toLocaleString('en-IN')}</div>
                </div>

                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Probability</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{(prob * 100).toFixed(0)}%</div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{
                    height: 8, background: 'var(--bg-card)',
                    borderRadius: 4, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${barPct}%`, height: '100%',
                      background: STAGE_COLORS[stage] || 'var(--text-muted)',
                      borderRadius: 4, transition: 'width 0.5s',
                    }} />
                  </div>
                  {count > 0 && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                      {((count / maxCount) * 100).toFixed(0)}% of pipeline
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
