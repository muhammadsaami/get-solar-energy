import React from 'react'
import type { ActivitySummaryCards as SummaryCardsType } from '../types/activity.types'

interface ActivitySummaryCardsProps {
  summary: SummaryCardsType
}

const CARDS = [
  { key: 'assessmentsCompleted' as const, label: 'Assessments Completed', theme: '23, 168, 229', icon: '\uD83D\uDCCA' },
  { key: 'reportsGenerated' as const, label: 'Reports Generated', theme: '234, 179, 8', icon: '\uD83D\uDCC4' },
  { key: 'rewardsRedeemed' as const, label: 'Rewards Redeemed', theme: '54, 211, 153', icon: '\uD83C\uDF81' },
  { key: 'aiConversations' as const, label: 'AI Conversations', theme: '167, 139, 250', icon: '\uD83E\uDD16' },
]

export function ActivitySummaryCards({ summary }: ActivitySummaryCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }} className="rewards-kpi-grid">
      {CARDS.map((card) => (
        <div key={card.key} className="card-base shadow-lift" style={{ '--card-theme': card.theme } as React.CSSProperties}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{card.label}</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-navy)' }}>{summary[card.key]}</span>
        </div>
      ))}
    </div>
  )
}
