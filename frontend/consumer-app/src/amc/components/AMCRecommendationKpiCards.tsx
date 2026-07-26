import React from 'react'
import { PerformanceMetricCard } from '../../performance/components/PerformanceMetricCard'

export interface AMCRecommendationKpiData {
  recommendedPlan: string
  estimatedAnnualCost: string
  systemHealth: string
  warrantyStatus: string
  nextScheduledVisit: string
  preventiveScore: string
}

interface AMCRecommendationKpiCardsProps {
  data: AMCRecommendationKpiData | null
  loading: boolean
}

const KPI_DEFINITIONS: {
  key: keyof AMCRecommendationKpiData
  title: string
  subtitle: string
  icon: string
  theme: string
}[] = [
  { key: 'recommendedPlan', title: 'Recommended Plan', subtitle: 'Based on system health', icon: '\uD83D\uDCBC', theme: '0, 174, 239' },
  { key: 'estimatedAnnualCost', title: 'Estimated Annual Cost', subtitle: 'Annual service pricing', icon: '\u20B9', theme: '52, 211, 153' },
  { key: 'systemHealth', title: 'System Health', subtitle: 'Overall efficiency score', icon: '\uD83D\uDCC8', theme: '251, 146, 60' },
  { key: 'warrantyStatus', title: 'Warranty Status', subtitle: 'Standard components coverage', icon: '\uD83D\uDEE1\uFE0F', theme: '192, 132, 252' },
  { key: 'nextScheduledVisit', title: 'Next Scheduled Visit', subtitle: 'Recommended O&M window', icon: '\uD83D\uDCC5', theme: '236, 72, 153' },
  { key: 'preventiveScore', title: 'Preventive Score', subtitle: 'Remote system metrics', icon: '\uD83D\uDCCA', theme: '163, 230, 53' },
]

function AMCRecommendationKpiCardsComponent({ data, loading }: AMCRecommendationKpiCardsProps) {
  return (
    <div
      className="sub-kpis-grid"
      style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
    >
      {KPI_DEFINITIONS.map(({ key, title, subtitle, icon, theme }) => (
        <PerformanceMetricCard
          key={key}
          title={title}
          icon={icon}
          value={loading ? null : data?.[key] ?? '—'}
          subtitle={subtitle}
          theme={theme}
          loading={loading}
          size="sm"
        />
      ))}
    </div>
  )
}

export const AMCRecommendationKpiCards = React.memo(AMCRecommendationKpiCardsComponent)
