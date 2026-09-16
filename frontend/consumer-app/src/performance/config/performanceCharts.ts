import type { ChartType } from '../types/performance.types'

export interface ChartConfig {
  id: string
  title: string
  description: string
  chartType: ChartType
  icon: string
  colorToken: string
  dataKey: string
  tooltip: string
  emptyMessage: string
  loadingLabel: string
  sortOrder: number
  futureApiKey: string
}

export const PERFORMANCE_CHARTS: ChartConfig[] = [
  {
    id: 'energy-production',
    title: 'Energy Production Trend',
    description: 'Monthly solar energy generation in kWh',
    chartType: 'bar',
    icon: '\u26A1',
    colorToken: 'var(--chart-3)',
    dataKey: 'energyProduction',
    tooltip: 'kWh generated per month',
    emptyMessage: 'Run Bill Analysis to begin tracking production.',
    loadingLabel: 'Loading generation trend...',
    sortOrder: 1,
    futureApiKey: 'production_trend',
  },
  {
    id: 'consumption-trend',
    title: 'Electricity Consumption Trend',
    description: 'Monthly household electricity consumption in kWh',
    chartType: 'area',
    icon: '\uD83D\uDCA1',
    colorToken: 'var(--chart-1)',
    dataKey: 'electricityConsumption',
    tooltip: 'kWh consumed per month',
    emptyMessage: 'Historical trends will appear after additional bill analyses.',
    loadingLabel: 'Loading consumption trend...',
    sortOrder: 2,
    futureApiKey: 'consumption_trend',
  },
  {
    id: 'gen-vs-consumption',
    title: 'Solar Gen vs Self-Consumption Trend',
    description: 'Solar generation compared to directly consumed solar energy',
    chartType: 'line',
    icon: '\uD83D\uDD04',
    colorToken: 'var(--chart-2)',
    dataKey: 'solarGenVsConsumption',
    tooltip: 'kWh generation vs self-consumption',
    emptyMessage: 'Multiple bill analyses needed to show generation vs consumption trends.',
    loadingLabel: 'Loading comparison trend...',
    sortOrder: 3,
    futureApiKey: 'gen_vs_cons_trend',
  },
  {
    id: 'import-export',
    title: 'Import vs Export Stacked Units',
    description: 'Grid import vs solar export stacked monthly view',
    chartType: 'stacked-bar',
    icon: '\uD83D\uDD0C',
    colorToken: 'var(--chart-1)',
    dataKey: 'importExport',
    tooltip: 'kWh imported vs exported',
    emptyMessage: 'Import/export trends require net meter data from your utility bills.',
    loadingLabel: 'Loading import/export data...',
    sortOrder: 4,
    futureApiKey: 'import_export_trend',
  },
  {
    id: 'pr-ratio',
    title: 'System Performance Trend (PR Ratio)',
    description: 'Performance Ratio percentage trend over months',
    chartType: 'line',
    icon: '\uD83D\uDCC8',
    colorToken: 'var(--chart-6)',
    dataKey: 'prRatio',
    tooltip: 'PR ratio in percentage',
    emptyMessage: 'Complete a solar generation analysis to view performance ratio trends.',
    loadingLabel: 'Loading PR ratio trend...',
    sortOrder: 5,
    futureApiKey: 'pr_ratio_trend',
  },
  {
    id: 'carbon-reduction',
    title: 'Carbon Reduction Trend (CO\u2082 Tons)',
    description: 'Monthly CO\u2082 offset in metric tons',
    chartType: 'area',
    icon: '\uD83C\uDF31',
    colorToken: 'var(--chart-3)',
    dataKey: 'carbonReduction',
    tooltip: 'CO\u2082 offset in tons',
    emptyMessage: 'Carbon offset metrics will populate once solar generation is tracked.',
    loadingLabel: 'Loading carbon reduction trend...',
    sortOrder: 6,
    futureApiKey: 'carbon_reduction_trend',
  },
]

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const STALE_AFTER_MS = 5 * 60 * 1000
