import React from 'react'
import { PerformanceMetricCard } from './PerformanceMetricCard'
import type { PerformanceSummary } from '../types/performance.types'

interface PerformanceMetricsGridProps {
  summary: PerformanceSummary | null
  loading?: boolean
}

const METRIC_DEFINITIONS = [
  {
    key: 'generation' as const,
    title: 'Solar Generation',
    icon: '\u26A1',
    theme: '54, 211, 153',
    getValue: (s: PerformanceSummary) => `${Math.round(s.generation.solarGenerated)} kWh`,
    getSubtitle: (s: PerformanceSummary) => `Generated this month`,
    getBadge: () => null,
  },
  {
    key: 'consumption' as const,
    title: 'Solar Consumption',
    icon: '\uD83D\uDCA1',
    theme: '23, 168, 229',
    getValue: (s: PerformanceSummary) => `${Math.round(s.consumption.solarConsumed)} kWh`,
    getSubtitle: (s: PerformanceSummary) => `Directly used: ${s.consumption.selfConsumptionPct}% self-sufficiency`,
    getBadge: () => null,
  },
  {
    key: 'grid' as const,
    title: 'Grid Import / Export',
    icon: '\uD83D\uDD0C',
    theme: '255, 138, 29',
    getValue: (s: PerformanceSummary) => `${Math.round(s.grid.importUnits)} / ${Math.round(s.grid.exportUnits)} kWh`,
    getSubtitle: (s: PerformanceSummary) => {
      const net = s.grid.netExport
      return net >= 0
        ? `Net export: +${Math.round(net)} kWh surplus`
        : `Net import: ${Math.round(Math.abs(net))} kWh deficit`
    },
    getBadge: () => null,
  },
  {
    key: 'efficiency' as const,
    title: 'PR Ratio / Efficiency',
    icon: '\uD83D\uDCC8',
    theme: '234, 179, 8',
    getValue: (s: PerformanceSummary) => `${s.efficiency.prRatio}% / ${s.efficiency.systemEfficiency}%`,
    getSubtitle: (s: PerformanceSummary) => {
      const rating = s.efficiency.performanceRating
      return rating === 'Excellent'
        ? 'Excellent PR threshold score'
        : `${rating} performance score`
    },
    getBadge: (s: PerformanceSummary) => ({
      text: s.efficiency.performanceRating,
      className: s.efficiency.performanceRating === 'Excellent' ? 'badge-success' :
                 s.efficiency.performanceRating === 'Good' ? 'badge-info' :
                 s.efficiency.performanceRating === 'Average' ? 'badge-warning' : 'badge-error',
    }),
  },
]

function PerformanceMetricsGridComponent({
  summary,
  loading = false,
}: PerformanceMetricsGridProps) {
  return (
    <div
      className="grid-2-col"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}
      role="group"
      aria-label="Performance metrics"
    >
      {METRIC_DEFINITIONS.map((def) => {
        const value = summary ? def.getValue(summary) : null
        const subtitle = summary ? def.getSubtitle(summary) : undefined
        const badge = summary ? def.getBadge(summary) : null

        return (
          <PerformanceMetricCard
            key={def.key}
            title={def.title}
            icon={def.icon}
            theme={def.theme}
            value={value}
            subtitle={subtitle}
            badge={badge}
            loading={loading}
            empty={!summary}
            size="md"
          />
        )
      })}
    </div>
  )
}

export const PerformanceMetricsGrid = React.memo(PerformanceMetricsGridComponent)
