import React from 'react'
import { MdVerified, MdWarning, MdCheckCircle, MdStar } from 'react-icons/md'
import type { AMCKpiSummary } from '../types/amc.types'

interface AMCKpiCardsProps {
  kpis: AMCKpiSummary | null
  loading: boolean
}

const cards = [
  {
    key: 'activeContracts' as const, label: 'Active Contracts', icon: MdVerified,
    accent: 'accent-green', formatter: (v: number) => String(v),
  },
  {
    key: 'expiringSoon' as const, label: 'Expiring Soon', icon: MdWarning,
    accent: 'accent-orange', formatter: (v: number) => String(v),
  },
  {
    key: 'totalVisitsCompleted' as const, label: 'Visits Completed', icon: MdCheckCircle,
    accent: 'accent-blue', formatter: (v: number) => String(v),
  },
  {
    key: 'avgRating' as const, label: 'Avg Rating', icon: MdStar,
    accent: 'accent-purple', formatter: (v: number) => v > 0 ? `${v}/5` : 'N/A',
  },
]

function AMCKpiCardsComponent({ kpis, loading }: AMCKpiCardsProps) {
  if (loading) {
    return (
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
        {cards.map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: '100px' }}>
            <div className="skeleton skeleton-text narrow" />
            <div className="skeleton skeleton-text wide" style={{ height: '24px', marginTop: 'var(--space-3)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (!kpis) return null

  return (
    <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
      {cards.map(({ key, label, icon: Icon, accent, formatter }) => {
        const value = kpis[key]
        return (
          <div key={key} className={`card-metric ${accent}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span className="card-metric-label">{label}</span>
              <Icon style={{ fontSize: '22px', color: 'var(--text-muted)', opacity: 0.6 }} />
            </div>
            <div className="card-metric-value" style={{ fontSize: 'var(--font-size-2xl)' }}>
              {formatter(value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const AMCKpiCards = React.memo(AMCKpiCardsComponent)
