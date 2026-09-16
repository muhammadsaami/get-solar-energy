import React, { useMemo } from 'react'
import { MdTrendingUp, MdWarning, MdLightbulb } from 'react-icons/md'
import type { CrmCustomer360 } from './crm.types'

interface Props {
  data: CrmCustomer360
}

const SCORE_COLORS = [
  { min: 80, color: 'var(--color-green)', bg: 'rgba(34,197,94,0.15)' },
  { min: 50, color: 'var(--color-amber)', bg: 'rgba(245,158,11,0.15)' },
  { min: 0, color: 'var(--color-red)', bg: 'rgba(239,68,68,0.15)' },
]

function getScoreStyle(score: number) {
  const tier = SCORE_COLORS.find(t => score >= t.min) || SCORE_COLORS[SCORE_COLORS.length - 1]
  return { color: tier.color, background: tier.bg }
}

function getRiskLevel(healthScore: number): { label: string; color: string } {
  if (healthScore >= 80) return { label: 'Low Risk', color: 'var(--color-green)' }
  if (healthScore >= 50) return { label: 'Medium Risk', color: 'var(--color-amber)' }
  return { label: 'High Risk', color: 'var(--color-red)' }
}

function getAIRecommendation(data: CrmCustomer360): string {
  if (!data.bills.length) return 'Upload an electricity bill to begin solar analysis.'
  if (!data.roofAnalysis) return 'Complete roof analysis to estimate solar potential.'
  if (!data.siteSurvey) return 'Schedule a site survey to proceed with installation planning.'
  if (!data.proposal) return 'Generate a proposal based on survey findings.'
  if (data.customer.status !== 'Won') return 'Follow up with the customer to close the deal.'
  if (!data.installation) return 'Start the installation process for the approved customer.'
  return 'Customer journey is on track. Monitor system performance and AMC.'
}

export default function CrmJourneyHealth({ data }: Props) {
  const risk = useMemo(() => getRiskLevel(data.healthScore), [data.healthScore])
  const recommendation = useMemo(() => getAIRecommendation(data), [data])
  const convProb = useMemo(() => {
    if (!data.leadScore) return 0
    return Math.min(Math.round((data.leadScore * 0.6 + data.healthScore * 0.4) / 10 * 5 + 20), 95)
  }, [data])

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Journey Health</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <MetricBadge
          icon={<MdTrendingUp size={14} />}
          label="Conversion Prob."
          value={`${convProb}%`}
          color={convProb >= 60 ? 'var(--color-green)' : convProb >= 30 ? 'var(--color-amber)' : 'var(--color-red)'}
        />
        <MetricBadge
          icon={<MdWarning size={14} />}
          label="Risk Level"
          value={risk.label}
          color={risk.color}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <ProgressRow label="Lead Score" value={data.leadScore} color={getScoreStyle(data.leadScore).color} />
        <ProgressRow label="Health Score" value={data.healthScore} color={getScoreStyle(data.healthScore).color} />
        <ProgressRow label="Project Progress" value={data.projectProgress} color="var(--color-blue)" />
        <ProgressRow label="Payment Progress" value={data.paymentProgress} color="var(--color-blue)" />
      </div>

      <div style={{
        display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
        padding: 'var(--space-3)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
      }}>
        <MdLightbulb size={16} style={{ color: 'var(--color-amber)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {recommendation}
        </div>
      </div>
    </div>
  )
}

function MetricBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span style={{ color }}>{icon}</span>
      <div>
        <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color }}>{value}</div>
      </div>
    </div>
  )
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 2 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}
