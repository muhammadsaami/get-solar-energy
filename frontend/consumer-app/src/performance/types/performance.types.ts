export type PerformanceRating = 'Excellent' | 'Good' | 'Average' | 'Needs Attention'

export type ChartType = 'bar' | 'line' | 'area' | 'stacked-bar'

export type PerformanceStatus = 'idle' | 'loading' | 'success' | 'error'

export interface GenerationMetrics {
  solarGenerated: number
  dailyGeneration: number
  monthlyGeneration: number
  systemSizeKw: number
  monthlyGenerationTrend: number[] | null
}

export interface ConsumptionMetrics {
  solarConsumed: number
  monthlyConsumption: number
  selfConsumptionPct: number
}

export interface GridMetrics {
  importUnits: number
  exportUnits: number
  netExport: number
  gridDependencyPct: number
}

export interface EfficiencyMetrics {
  prRatio: number
  systemEfficiency: number | null
  performanceRating: PerformanceRating
}

export interface HealthMetrics {
  inverterHealth: number | null
  panelHealth: number | null
  batteryHealth: number | null
  wiringHealth: number | null
  overallHealth: number
  healthLabel: string
}

export interface PerformanceChartPoint {
  month: string
  value: number
}

export interface PerformanceChartDataset {
  label: string
  data: PerformanceChartPoint[]
  color: string
}

export interface PerformanceCharts {
  energyProduction: PerformanceChartPoint[]
  electricityConsumption: PerformanceChartPoint[]
  solarGenVsConsumption: PerformanceChartDataset[]
  importExport: PerformanceChartDataset[]
  prRatio: PerformanceChartPoint[]
  carbonReduction: PerformanceChartPoint[]
}

export interface PerformanceSummary {
  generation: GenerationMetrics
  consumption: ConsumptionMetrics
  grid: GridMetrics
  efficiency: EfficiencyMetrics
  health: HealthMetrics
}

export interface PerformancePerSourceErrors {
  generationError: string | null
  healthError: string | null
  statsError: string | null
  billsError: string | null
}

export interface PerformanceSourceResult {
  generation: GenerationMetrics | null
  consumption: ConsumptionMetrics | null
  grid: GridMetrics | null
  efficiency: EfficiencyMetrics | null
  health: HealthMetrics | null
  bills: unknown[] | null
  stats: Record<string, unknown> | null
  errors: PerformancePerSourceErrors
}

export interface PerformanceData {
  summary: PerformanceSummary
  charts: PerformanceCharts
  lastUpdated: string | null
  stale: boolean
}

export interface PerformanceState {
  summary: PerformanceSummary | null
  charts: PerformanceCharts | null
  loading: boolean
  error: { hasError: boolean; sources: Record<string, string | null>; message: string } | null
  lastUpdated: string | null
  stale: boolean
}

export const DEFAULT_GENERATION: GenerationMetrics = {
  solarGenerated: 0,
  dailyGeneration: 0,
  monthlyGeneration: 0,
  systemSizeKw: 0,
  monthlyGenerationTrend: null,
}

export const DEFAULT_CONSUMPTION: ConsumptionMetrics = {
  solarConsumed: 0,
  monthlyConsumption: 0,
  selfConsumptionPct: 0,
}

export const DEFAULT_GRID: GridMetrics = {
  importUnits: 0,
  exportUnits: 0,
  netExport: 0,
  gridDependencyPct: 100,
}

export const DEFAULT_EFFICIENCY: EfficiencyMetrics = {
  prRatio: 0,
  systemEfficiency: 0,
  performanceRating: 'Needs Attention',
}

export const DEFAULT_HEALTH: HealthMetrics = {
  inverterHealth: 0,
  panelHealth: 0,
  batteryHealth: 0,
  wiringHealth: 0,
  overallHealth: 0,
  healthLabel: 'Not Available',
}

export const DEFAULT_SUMMARY: PerformanceSummary = {
  generation: { ...DEFAULT_GENERATION },
  consumption: { ...DEFAULT_CONSUMPTION },
  grid: { ...DEFAULT_GRID },
  efficiency: { ...DEFAULT_EFFICIENCY },
  health: { ...DEFAULT_HEALTH },
}

export const DEFAULT_CHARTS: PerformanceCharts = {
  energyProduction: [],
  electricityConsumption: [],
  solarGenVsConsumption: [],
  importExport: [],
  prRatio: [],
  carbonReduction: [],
}

export interface PerformanceApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export interface GenerationApiData {
  monthly_generation_units?: number
  daily_generation_units?: number
  solar_generation?: number
  solar_consumption?: number
  grid_import_units?: number
  grid_export_units?: number
  pr_ratio?: number
  system_efficiency?: number
  system_size_kw?: number
  self_consumption_pct?: number
  [key: string]: unknown
}

export interface HealthApiData {
  health_score?: number
  inverter_health?: number
  panel_health?: number
  battery_health?: number
  wiring_health?: number
  generation_drop_pct?: number
  issues?: string[]
  [key: string]: unknown
}

export interface StatsApiData {
  customers?: number
  bills_analyzed?: number
  avg_bill?: number
  avg_units?: number
  avg_payback?: number
  avg_system_size?: number
  total_system_value?: number
  total_25yr_savings?: number
  [key: string]: unknown
}

export function initialState(): PerformanceState {
  return {
    summary: null,
    charts: null,
    loading: true,
    error: null,
    lastUpdated: null,
    stale: false,
  }
}
