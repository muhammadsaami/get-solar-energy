import type {
  GenerationMetrics,
  ConsumptionMetrics,
  GridMetrics,
  EfficiencyMetrics,
  HealthMetrics,
  PerformanceSourceResult,
  PerformancePerSourceErrors,
  GenerationApiData,
  HealthApiData,
  StatsApiData,
} from '../types/performance.types'

function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && !Number.isNaN(val)) return val
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return !Number.isNaN(parsed) ? parsed : fallback
  }
  return fallback
}

function safePercent(val: unknown, fallback = 0): number {
  const num = safeNum(val, fallback)
  return Math.min(100, Math.max(0, num))
}

function computePerformanceRating(pr: number): 'Excellent' | 'Good' | 'Average' | 'Needs Attention' {
  if (pr >= 95) return 'Excellent'
  if (pr >= 85) return 'Good'
  if (pr >= 70) return 'Average'
  return 'Needs Attention'
}

export function mapGenerationData(raw: GenerationApiData | null): GenerationMetrics {
  if (!raw) {
    return { solarGenerated: 0, dailyGeneration: 0, monthlyGeneration: 0, systemSizeKw: 0, monthlyGenerationTrend: null }
  }
  const monthlyGen = safeNum(raw.monthly_generation_units)
  return {
    solarGenerated: safeNum(raw.solar_generation, monthlyGen),
    dailyGeneration: safeNum(raw.daily_generation_units),
    monthlyGeneration: monthlyGen,
    systemSizeKw: safeNum(raw.system_size_kw),
    monthlyGenerationTrend: null,
  }
}

export function mapConsumptionData(raw: GenerationApiData | null): ConsumptionMetrics {
  if (!raw) {
    return { solarConsumed: 0, monthlyConsumption: 0, selfConsumptionPct: 0 }
  }
  const monthlyConsumption = safeNum(raw.monthly_units || raw.solar_consumption)
  return {
    solarConsumed: safeNum(raw.solar_consumption),
    monthlyConsumption,
    selfConsumptionPct: safePercent(raw.self_consumption_pct),
  }
}

export function mapGridData(raw: GenerationApiData | null): GridMetrics {
  if (!raw) {
    return { importUnits: 0, exportUnits: 0, netExport: 0, gridDependencyPct: 100 }
  }
  const importUnits = safeNum(raw.grid_import_units)
  const exportUnits = safeNum(raw.grid_export_units)
  const netExport = exportUnits - importUnits
  const totalConsumption = importUnits + safeNum(raw.solar_consumption || 0)
  const gridDependencyPct = totalConsumption > 0 ? safePercent((importUnits / totalConsumption) * 100) : 100
  return { importUnits, exportUnits, netExport, gridDependencyPct }
}

export function mapEfficiencyData(raw: GenerationApiData | null): EfficiencyMetrics {
  if (!raw) {
    return { prRatio: 0, systemEfficiency: 0, performanceRating: 'Needs Attention' }
  }
  const prRatio = safePercent(raw.pr_ratio)
  const systemEfficiency = safePercent(raw.system_efficiency)
  return { prRatio, systemEfficiency, performanceRating: computePerformanceRating(prRatio) }
}

export function mapHealthData(raw: HealthApiData | null): HealthMetrics {
  if (!raw || !raw.health_score) {
    return { inverterHealth: 0, panelHealth: 0, batteryHealth: 0, wiringHealth: 0, overallHealth: 0, healthLabel: 'Not Available' }
  }
  const overallHealth = safePercent(raw.health_score)
  return {
    inverterHealth: safePercent(raw.inverter_health),
    panelHealth: safePercent(raw.panel_health),
    batteryHealth: safePercent(raw.battery_health),
    wiringHealth: safePercent(raw.wiring_health),
    overallHealth,
    healthLabel: computeHealthLabel(overallHealth),
  }
}

function computeHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

export function mapAllSources(
  stats: Record<string, unknown> | null,
  healthData: HealthApiData | null,
  cachedAnalysis: Record<string, unknown> | null,
  errors: PerformancePerSourceErrors,
): PerformanceSourceResult {
  const generationApi = (cachedAnalysis?.bill as GenerationApiData) || null
  const healthApi = healthData || null

  return {
    generation: mapGenerationData(generationApi),
    consumption: mapConsumptionData(generationApi),
    grid: mapGridData(generationApi),
    efficiency: mapEfficiencyData(generationApi),
    health: mapHealthData(healthApi),
    bills: null,
    stats,
    errors,
  }
}
