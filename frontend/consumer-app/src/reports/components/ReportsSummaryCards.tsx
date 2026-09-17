import React from 'react'
import type { ReportSummary } from '../types/report.types'

interface ReportsSummaryCardsProps {
  summary: ReportSummary
}

const CARDS = [
  { key: 'totalReportsGenerated' as const, label: 'Total Reports Generated', theme: '23, 168, 229', icon: '\uD83D\uDCCA' },
  { key: 'reportsGeneratedThisMonth' as const, label: 'Generated This Month', theme: '54, 211, 153', icon: '\uD83D\uDCC4' },
  { key: 'totalReportsDownloaded' as const, label: 'Total Downloads', theme: '167, 139, 250', icon: '\uD83D\uDCE5' },
  { key: 'assessmentsCompleted' as const, label: 'Assessments Completed', theme: '234, 179, 8', icon: '\u2705' },
]

function ReportsSummaryCardsComponent({ summary }: ReportsSummaryCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }} className="rewards-kpi-grid">
      {CARDS.map((card) => (
        <div key={card.key} className="card-base shadow-lift" style={{ '--card-theme': card.theme, padding: '12px 16px' } as React.CSSProperties}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{card.label}</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-navy)' }}>{summary[card.key]}</span>
        </div>
      ))}
    </div>
  )
}

export const ReportsSummaryCards = React.memo(ReportsSummaryCardsComponent)
