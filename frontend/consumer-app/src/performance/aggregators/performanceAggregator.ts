import type {
  PerformanceSourceResult,
  PerformanceData,
  PerformanceSummary,
  PerformanceCharts,
} from '../types/performance.types'
import {
  DEFAULT_SUMMARY, DEFAULT_CHARTS,
  DEFAULT_GENERATION, DEFAULT_CONSUMPTION, DEFAULT_GRID,
  DEFAULT_EFFICIENCY, DEFAULT_HEALTH,
} from '../types/performance.types'

function computeSelfConsumption(
  generated: number,
  exported: number,
): number {
  if (generated <= 0) return 0
  const used = Math.max(0, generated - exported)
  return Math.min(100, Math.round((used / generated) * 1000) / 10)
}

function computeGridDependency(
  imported: number,
  consumed: number,
): number {
  if (consumed <= 0) return 100
  return Math.min(100, Math.round((imported / consumed) * 1000) / 10)
}

function computeCarbonReduction(
  monthlyKwh: number,
): number {
  return Math.round((monthlyKwh * 0.8 / 1000) * 100) / 100
}

function computeNetExport(
  exported: number,
  imported: number,
): number {
  return exported - imported
}

function computePerformanceRating(pr: number): 'Excellent' | 'Good' | 'Average' | 'Needs Attention' {
  if (pr >= 95) return 'Excellent'
  if (pr >= 85) return 'Good'
  if (pr >= 70) return 'Average'
  return 'Needs Attention'
}

function computeHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

export function aggregatePerformance(
  sources: PerformanceSourceResult,
): PerformanceData {
  const gen = sources.generation ?? DEFAULT_GENERATION
  const cons = sources.consumption ?? DEFAULT_CONSUMPTION
  const grd = sources.grid ?? DEFAULT_GRID
  const eff = sources.efficiency ?? DEFAULT_EFFICIENCY
  const hlth = sources.health ?? DEFAULT_HEALTH

  const selfConsumptionPct = cons.selfConsumptionPct > 0
    ? cons.selfConsumptionPct
    : computeSelfConsumption(gen.solarGenerated, grd.exportUnits)

  const gridDependencyPct = grd.gridDependencyPct < 100
    ? grd.gridDependencyPct
    : computeGridDependency(grd.importUnits, cons.monthlyConsumption)

  const netExport = computeNetExport(grd.exportUnits, grd.importUnits)

  const summary: PerformanceSummary = {
    generation: gen,
    consumption: { ...cons, selfConsumptionPct },
    grid: { ...grd, netExport, gridDependencyPct },
    efficiency: {
      ...eff,
      performanceRating: eff.prRatio > 0
        ? computePerformanceRating(eff.prRatio)
        : 'Needs Attention',
    },
    health: {
      ...hlth,
      healthLabel: hlth.overallHealth > 0
        ? computeHealthLabel(hlth.overallHealth)
        : 'Not Available',
    },
  }

  const charts: PerformanceCharts = { ...DEFAULT_CHARTS }

  const lastUpdated = new Date().toISOString()

  return {
    summary,
    charts,
    lastUpdated,
    stale: false,
  }
}
