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

  // Authoritative energy model & net-metering credit fields
  openingSolarSurplus?: number | null
  closingSolarSurplus?: number | null
  netBilledUnits?: number | null
  gridImport?: number | null
  gridExport?: number | null

  extractionConfidence: ConfidenceResult
  billHealth: ScoreResult
  solarOpportunity: ScoreResult
  filename: string
}

export interface SolarReportData {
  productionKwh: number | null
  systemSizeKw: number | null
  month: string | null
  year: string | number | null
  source: string | null
  dailyGenerationKwh?: number | null
  confidence?: number | string | null
}

export interface UnifiedEnergyData {
  solarGenerated: number
  gridImport: number
  gridExport: number | null
  solarUsedDirectly: number | null
  selfConsumptionPct: number | null
  solarOffsetPct: number | null
  gridDependencyPct: number | null
  netMeteringBenefit: number | null
}

export interface ScoreResult {
  score: number
  rating: string
}

export type ConfidenceTier = 'High Confidence' | 'Medium Confidence' | 'Low Confidence'

export interface ConfidenceResult {
  score: number
  label: string
  badgeClass: string
}

export interface PlantPerformanceResult {
  pct: number | null
  expected: number | null
  actual: number | null
  rating: string | null
  ratingClass: string
  specificYield?: number | null
  averageDailyGeneration?: number | null
}

export type UploadState = 'idle' | 'uploading' | 'complete' | 'error'

export type SolarReportState =
  | 'NOT_PROVIDED'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'EXTRACTION_FAILED'
  | 'INVALID_FILE'
  | 'API_ERROR'
  | 'idle'
  | 'uploading'
  | 'complete'
  | 'error'

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
  solarUploadState: SolarReportState
  billProgress: UploadProgress
  solarProgress: UploadProgress
  billError: string | null
  solarError: string | null
}

export type ChartInstance = import('chart.js').Chart | null

export interface QuotaDetail {
  used: number
  limit: number
  remaining: number
}

export interface BillQuotas {
  upload: QuotaDetail
  manual: QuotaDetail
}

export interface ManualBillInput {
  billing_period: string
  bill_amount: number
  monthly_units: number
  sanctioned_load_kw: number
  customer_name?: string
  consumer_number?: string
  discom?: string
  payable_amount?: number
  solar_installed?: boolean
  solar_capacity_kw?: number
  solar_generation_units?: number
  solar_export_units?: number
  grid_import_kwh?: number
  grid_export_kwh?: number
  opening_solar_surplus?: number
  closing_solar_surplus?: number
  net_billed_units?: number
}
