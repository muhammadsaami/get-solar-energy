export interface BillAnalysisData {
  customer_name: string
  consumer_number: string
  discom: string
  billing_period: string
  monthly_units: number
  bill_amount: number
  per_unit_rate: number
  recommended_kw: number
  monthly_generation_units: number
  monthly_savings_rs: number
  system_cost_rs: number
  payback_years: number
  savings_25_years_rs: number

  solarYield: number
  monthlySolarGeneration: number
  annualSolarGeneration: number
  solarUsedDirectly: number
  solarExportedToGrid: number
  solarOffsetPercent: number
  gridDependency: number
  netMeteringBenefit: number

  isSolarConsumer: boolean
  importUnits: number | null
  exportUnits: number | null
  solarGeneratedUnits: number | null
  netConsumptionUnits: number | null
  netConsumption: number
  netMeteringCredit: number

  extractionConfidence: ConfidenceResult
  billHealth: ScoreResult
  solarOpportunity: ScoreResult
  filename: string
}

export interface SolarReportData {
  productionKwh: number | null
  systemSizeKw: number | null
  month: string | null
  year: string | null
  source: string
}

export interface UnifiedEnergyData {
  solarGenerated: number
  gridImport: number
  gridExport: number
  solarUsedDirectly: number
  selfConsumptionPct: number
  solarOffsetPct: number
  gridDependencyPct: number
  netMeteringBenefit: number
}

export interface ScoreResult {
  score: number
  rating: string
}

export interface ConfidenceResult {
  score: number
  label: string
  badgeClass: string
}

export interface PlantPerformanceResult {
  pct: number
  expected: number
  actual: number
  rating: string
  ratingClass: string
}

export type UploadState = 'idle' | 'uploading' | 'complete' | 'error'

export interface UploadProgress {
  percent: number
  status: string
}

export interface AnalysisState {
  billFile: File | null
  solarFile: File | null
  analysis: BillAnalysisData | null
  solarReport: SolarReportData | null
  unifiedEnergy: UnifiedEnergyData | null
  billUploadState: UploadState
  solarUploadState: UploadState
  billProgress: UploadProgress
  solarProgress: UploadProgress
  billError: string | null
  solarError: string | null
}

export type ChartInstance = import('chart.js').Chart | null
