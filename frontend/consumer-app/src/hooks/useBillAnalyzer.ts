import { useState, useRef, useCallback, useEffect } from 'react'
import api from '../services/api/client'
import type { Chart, ChartConfiguration } from 'chart.js'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  DoughnutController,
} from 'chart.js'
import type {
  BillAnalysisData,
  SolarReportData,
  UnifiedEnergyData,
  ScoreResult,
  ConfidenceResult,
  ConfidenceTier,
  PlantPerformanceResult,
  UploadState,
  SolarReportState,
  UploadProgress,
  AnalysisState,
  BillQuotas,
  ManualBillInput,
} from './billAnalyzer.types'
import {
  SOLAR_YIELD,
  NET_METERING_RATE,
  MAX_FILE_SIZE,
  VALID_MIME_TYPES,
  VALID_EXTENSIONS,
  DEFAULT_MONTHS,
  MONTH_MULTIPLIERS,
  COST_BREAKDOWN_CHART_COLORS,
  HISTORY_CHART_STYLES,
  CHART_TOOLTIP_THEME,
} from './billAnalyzer.constants'

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController)

import { getUserStorageKey, type IdentifiableUser } from '../utils/userStorage'
import { tokenManager } from '../services/auth/tokenManager'

function getBillStorageKey(): string {
  const user = tokenManager.getUser() as IdentifiableUser | null
  return getUserStorageKey('lastBillAnalysis', user)
}

function getSolarStorageKey(): string {
  const user = tokenManager.getUser() as IdentifiableUser | null
  return getUserStorageKey('lastSolarProduction', user)
}

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(key)
      return null
    }
    return parsed as T
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function writeLS(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage quota/availability errors are non-fatal; analysis continues normally
  }
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val)
  return isFinite(n) ? n : fallback
}

function validateBillAnalysisResponse(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== 'object') return false
  const monthlyUnits = Number(data.monthly_units ?? data.units)
  const billAmount = Number(data.bill_amount ?? data.total_amount ?? data.amount)

  if (!isFinite(monthlyUnits) || monthlyUnits <= 0) return false
  if (!isFinite(billAmount) || billAmount <= 0) return false

  return true
}

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as {
      response?: {
        status?: number
        data?: { detail?: string | { msg?: string }[]; error?: string; message?: string }
      }
      code?: string
      message?: string
    }
    if (e.response) {
      const status = e.response.status
      if (status === 401) return 'Session expired. Please log in to analyze your bill.'
      if (status === 413) return 'File size exceeds server upload limit.'
      if (status === 429) return 'Request limit reached. Please wait a moment before trying again.'
      if (status === 503 || status === 504) return 'AI service is temporarily busy. Please try again shortly.'

      const data = e.response.data
      if (data?.error && typeof data.error === 'string') return data.error
      if (data?.detail) {
        if (typeof data.detail === 'string') return data.detail
        if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
      }
      if (data?.message && typeof data.message === 'string') return data.message
    }
    if (e.code === 'ECONNABORTED' || e.message?.toLowerCase().includes('timeout')) {
      return 'The request timed out while analyzing the document. Please try again.'
    }
    if (e.message && typeof e.message === 'string' && !e.message.includes('Network Error') && !e.message.includes('status code')) {
      return e.message
    }
  }
  return defaultMsg
}

function calculateExtractionConfidence(data: BillAnalysisData, isFallback: boolean): ConfidenceResult {
  let score = 30
  if (data.customer_name && data.customer_name !== 'Not Available' && data.customer_name !== 'Demo Consumer') score += 15
  if (data.billing_period && data.billing_period !== 'Not Available') score += 15
  if (data.consumer_number && data.consumer_number !== 'Not Available') score += 15
  if (Number(data.monthly_units) > 0) score += 15
  if (Number(data.bill_amount) > 0) score += 10
  if (isFallback) score -= 10
  score = Math.max(0, Math.min(100, score))
  let label = 'Low Confidence'
  let badgeClass = 'confidence-low'
  if (score >= 85) { label = 'High Confidence'; badgeClass = 'confidence-high' }
  else if (score >= 60) { label = 'Medium Confidence'; badgeClass = 'confidence-medium' }
  return { score, label, badgeClass }
}

function calculateBillHealthScore(data: BillAnalysisData): ScoreResult {
  let score = 40
  if (data.customer_name && data.customer_name !== 'Not Available') score += 15
  if (data.billing_period && data.billing_period !== 'Not Available') score += 15
  if (Number(data.monthly_units) > 0) score += 10
  if (Number(data.bill_amount) > 0) score += 10
  if (data.discom && data.discom !== 'Not Available') score += 10
  score = Math.max(0, Math.min(100, score))
  let rating = 'Poor'
  if (score >= 90) rating = 'Excellent'
  else if (score >= 75) rating = 'Good'
  else if (score >= 50) rating = 'Average'
  return { score, rating }
}

function calculateSolarOpportunityScore(data: BillAnalysisData, isSolarInstalled: boolean): ScoreResult {
  const billAmount = Number(data.bill_amount) || 0
  const monthlyUnits = Number(data.monthly_units) || 0
  const recommendedKw = Number(data.recommended_kw) || 0
  const annualSavings = (Number(data.monthly_savings_rs) || 0) * 12
  const scoreBill = Math.min(30, (billAmount / 6000) * 30)
  const scoreUnits = Math.min(20, (monthlyUnits / 500) * 20)
  const scoreKw = Math.min(10, (recommendedKw / 8) * 10)
  const scoreSavings = Math.min(10, (annualSavings / 80000) * 10)
  let score = Math.round(scoreBill + scoreUnits + scoreKw + scoreSavings)
  if (monthlyUnits > 300) score += 10
  if (billAmount > 2000) score += 10
  if (!isSolarInstalled) score += 10
  score = Math.max(0, Math.min(100, score))
  let rating = 'Weak Candidate'
  if (score >= 85) rating = 'Excellent Candidate'
  else if (score >= 70) rating = 'Good Candidate'
  else if (score >= 50) rating = 'Average Candidate'
  return { score, rating }
}

export function getDaysInMonth(month?: string | null, year?: string | number | null): number | null {
  if (!month) return null
  const m = month.toLowerCase().trim()
  const daysMap: Record<string, number> = {
    january: 31, jan: 31, '01': 31, '1': 31,
    february: 28, feb: 28, '02': 28, '2': 28,
    march: 31, mar: 31, '03': 31, '3': 31,
    april: 30, apr: 30, '04': 30, '4': 30,
    may: 31, '05': 31, '5': 31,
    june: 30, jun: 30, '06': 30, '6': 30,
    july: 31, jul: 31, '07': 31, '7': 31,
    august: 31, aug: 31, '08': 31, '8': 31,
    september: 30, sep: 30, sept: 30, '09': 30, '9': 30,
    october: 31, oct: 31, '10': 31,
    november: 30, nov: 30, '11': 30,
    december: 31, dec: 31, '12': 31,
  }
  let days: number | null = null
  for (const [key, d] of Object.entries(daysMap)) {
    if (m === key || m.startsWith(key)) {
      days = d
      break
    }
  }
  if (days === 28 && year) {
    const y = Number(year)
    if (isFinite(y) && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) {
      days = 29
    }
  }
  return days
}

export function calculateSpecificYield(productionKwh?: number | null, systemSizeKw?: number | null): number | null {
  if (
    productionKwh != null &&
    systemSizeKw != null &&
    isFinite(productionKwh) &&
    isFinite(systemSizeKw) &&
    productionKwh > 0 &&
    systemSizeKw > 0
  ) {
    const res = productionKwh / systemSizeKw
    return isFinite(res) ? Math.round(res * 10) / 10 : null
  }
  return null
}

export function calculateAverageDailyGeneration(
  productionKwh?: number | null,
  month?: string | null,
  year?: string | number | null
): number | null {
  if (productionKwh == null || !isFinite(productionKwh) || productionKwh <= 0) return null
  const days = getDaysInMonth(month, year)
  if (days != null && days > 0) {
    const res = productionKwh / days
    return isFinite(res) ? Math.round(res * 100) / 100 : null
  }
  return null
}

export function calculatePlantPerformance(
  actualKwh: number,
  systemSizeKw: number,
  month?: string | null,
  year?: string | number | null
): PlantPerformanceResult | null {
  if (!systemSizeKw || systemSizeKw <= 0 || !isFinite(systemSizeKw)) return null
  if (!actualKwh || actualKwh <= 0 || !isFinite(actualKwh)) return null
  const expected = systemSizeKw * SOLAR_YIELD
  const pct = Math.min(150, (actualKwh / expected) * 100)
  let rating = 'Needs Attention'
  let ratingClass = 'perf-needs-attention'
  if (pct >= 95) { rating = 'Excellent'; ratingClass = 'perf-excellent' }
  else if (pct >= 85) { rating = 'Good'; ratingClass = 'perf-good' }
  else if (pct >= 70) { rating = 'Average'; ratingClass = 'perf-average' }

  const specificYield = calculateSpecificYield(actualKwh, systemSizeKw)
  const averageDailyGeneration = calculateAverageDailyGeneration(actualKwh, month, year)

  return {
    pct: Math.round(pct * 10) / 10,
    expected,
    actual: actualKwh,
    rating,
    ratingClass,
    specificYield,
    averageDailyGeneration,
  }
}

export function checkPeriodCompatibility(
  billingPeriod?: string | null,
  solarMonth?: string | null,
  solarYear?: string | number | null
): boolean {
  if (!billingPeriod || !solarMonth) return false
  const bp = billingPeriod.toLowerCase()
  const sm = solarMonth.toLowerCase().trim()

  const monthAliases: Record<string, string[]> = {
    january: ['january', 'jan', '01'],
    february: ['february', 'feb', '02'],
    march: ['march', 'mar', '03'],
    april: ['april', 'apr', '04'],
    may: ['may', '05'],
    june: ['june', 'jun', '06'],
    july: ['july', 'jul', '07'],
    august: ['august', 'aug', '08'],
    september: ['september', 'sep', 'sept', '09'],
    october: ['october', 'oct', '10'],
    november: ['november', 'nov', '11'],
    december: ['december', 'dec', '12'],
  }

  let canonicalMonth: string | null = null
  for (const [key, aliases] of Object.entries(monthAliases)) {
    if (aliases.some(a => sm === a || sm.startsWith(a))) {
      canonicalMonth = key
      break
    }
  }

  if (!canonicalMonth) return false

  const aliases = monthAliases[canonicalMonth]
  const hasMonthMatch = aliases.some(alias => {
    const reg = new RegExp(`(^|[^a-z0-9])${alias}([^a-z0-9]|$)`, 'i')
    return reg.test(bp)
  })

  if (!hasMonthMatch) return false

  if (solarYear) {
    const yr = String(solarYear).trim()
    if (yr && !bp.includes(yr)) {
      return false
    }
  }

  return true
}

function computeUnifiedEnergyIntelligence(billData: BillAnalysisData, solarData: SolarReportData): UnifiedEnergyData {
  const solarGenerated = safeNum(solarData.productionKwh)
  const exportUnits = billData.exportUnits != null ? safeNum(billData.exportUnits) : null
  const importUnits = billData.importUnits != null ? safeNum(billData.importUnits) : null
  const gridImport = importUnits != null ? importUnits : (billData.monthly_units > 0 ? billData.monthly_units : 0)
  const solarUsedDirectly = exportUnits != null ? Math.max(0, solarGenerated - exportUnits) : null
  const selfConsumptionPct = (solarGenerated > 0 && solarUsedDirectly != null)
    ? Math.min(100, Math.round((solarUsedDirectly / solarGenerated) * 1000) / 10)
    : null
  const solarOffsetPct = gridImport > 0
    ? Math.min(200, Math.round((solarGenerated / gridImport) * 1000) / 10)
    : null
  const gridDependencyPct = selfConsumptionPct != null
    ? Math.max(0, Math.round((100 - selfConsumptionPct) * 10) / 10)
    : null
  const netMeteringBenefit = exportUnits != null
    ? Math.round(exportUnits * NET_METERING_RATE)
    : null
  return {
    solarGenerated,
    gridImport,
    gridExport: exportUnits,
    solarUsedDirectly,
    selfConsumptionPct,
    solarOffsetPct,
    gridDependencyPct,
    netMeteringBenefit,
  }
}

function extractSolarFields(text: string, filename: string) {
  const normalizedText = (text || '').toLowerCase()
  const keywords = ['solar consumer', 'net meter', 'net metering', 'solar energy', 'solar generation', 'pv system', 'renewable energy', 'export units', 'import units', 'solar export', 'solar import', 'gen_netmeter', 'netmeter', 'kwhe', 'kvah export', 'opening surplus', 'closing surplus', 'grid import', 'grid export', 'solar surplus']
  const isSolarConsumer = keywords.some(kw => normalizedText.includes(kw))
  let importUnits: number | null = null
  let exportUnits: number | null = null
  let solarGeneratedUnits: number | null = null
  let netConsumptionUnits: number | null = null
  let openingSolarSurplus: number | null = null
  let closingSolarSurplus: number | null = null
  let netBilledUnits: number | null = null

  if (isSolarConsumer) {
    const importMatch = normalizedText.match(/(?:grid\s+import|import\s+units|active\s+import|kwh\s+consumption)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (importMatch) importUnits = parseFloat(importMatch[1])
    const exportMatch = normalizedText.match(/(?:grid\s+export|export\s+units|solar\s+export|kwhe\s+consumption|kwhe\s+export)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (exportMatch) exportUnits = parseFloat(exportMatch[1])
    const solarMatch = normalizedText.match(/solar\s+generated\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (solarMatch) solarGeneratedUnits = parseFloat(solarMatch[1])
    const netMatch = normalizedText.match(/net\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (netMatch) netConsumptionUnits = parseFloat(netMatch[1])
    const openingMatch = normalizedText.match(/(?:opening\s+(?:solar\s+)?surplus|open\s+surplus)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (openingMatch) openingSolarSurplus = parseFloat(openingMatch[1])
    const closingMatch = normalizedText.match(/(?:closing\s+(?:solar\s+)?surplus|close\s+surplus)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (closingMatch) closingSolarSurplus = parseFloat(closingMatch[1])
    const billedMatch = normalizedText.match(/(?:net\s+billed\s+units|billed\s+units)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (billedMatch) netBilledUnits = parseFloat(billedMatch[1])
  }
  return {
    isSolarConsumer,
    importUnits,
    exportUnits,
    solarGeneratedUnits,
    netConsumptionUnits,
    openingSolarSurplus,
    closingSolarSurplus,
    netBilledUnits,
  }
}

function extractSolarProductionData(text: string, filename: string): SolarReportData {
  let productionKwh: number | null = null
  const prodPatterns = [/total\s+generation\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i, /total\s+yield\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i, /production\s*\(kwh\)\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i, /monthly\s+generation\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i, /energy\s+generated\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i, /generation\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i, /yield\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i, /e_total\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i, /total\s+energy\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i]
  for (const p of prodPatterns) {
    const m = text.match(p)
    if (m) { productionKwh = parseFloat(m[1].replace(/,/g, '')); break }
  }
  let systemSizeKw: number | null = null
  const sizePatterns = [/system\s+size\s*[:\-=]?\s*([\d.]+)\s*kw/i, /installed\s+capacity\s*[:\-=]?\s*([\d.]+)\s*kw/i, /plant\s+capacity\s*[:\-=]?\s*([\d.]+)\s*kw/i, /capacity\s*[:\-=]?\s*([\d.]+)\s*kw/i]
  for (const p of sizePatterns) {
    const m = text.match(p)
    if (m) { systemSizeKw = parseFloat(m[1]); break }
  }
  let month: string | null = null
  let year: string | null = null
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  const monthPat = new RegExp(`\\b(${months.join('|')})\\s+(\\d{4})\\b`, 'i')
  const mMatch = text.match(monthPat)
  if (mMatch) {
    const mn = mMatch[1].toLowerCase()
    month = mn.charAt(0).toUpperCase() + mn.slice(1)
    year = mMatch[2]
  }
  let source = 'Solar App'
  const fnL = (filename || '').toLowerCase()
  if (fnL.includes('solarman') || fnL.includes('sungrow') || fnL.includes('huawei') || fnL.includes('growatt')) {
    source = fnL.match(/(solarman|sungrow|huawei|growatt)/i)?.[0] ?? 'Solar App'
    source = source.charAt(0).toUpperCase() + source.slice(1)
  }
  return { productionKwh, systemSizeKw, month, year, source }
}

function enrichAnalysisData(apiData: Record<string, unknown>, filename: string, isFallback: boolean, solarFieldData: ReturnType<typeof extractSolarFields>): BillAnalysisData {
  const monthlyUnits = safeNum(apiData.monthly_units ?? apiData.units, 0)
  const billAmount = safeNum(apiData.bill_amount ?? apiData.total_amount ?? apiData.amount, 0)
  const perUnitRate = safeNum(
    apiData.per_unit_rate,
    monthlyUnits > 0 ? Math.round((billAmount / monthlyUnits) * 100) / 100 : 0
  )
  const recommendedKw = safeNum(
    apiData.recommended_kw,
    monthlyUnits > 0 ? Math.round((monthlyUnits / 135) * 2) / 2 : 0
  )
  const monthlySolarGen = safeNum(
    apiData.monthly_generation_units,
    recommendedKw * SOLAR_YIELD
  )
  const annualSolarGen = monthlySolarGen * 12
  const monthlySavingsRs = safeNum(
    apiData.monthly_savings_rs,
    monthlySolarGen * perUnitRate
  )
  const systemCostRs = safeNum(
    apiData.system_cost_rs,
    recommendedKw * 55000
  )
  const netCostRs = systemCostRs
  const annualSavingsRs = monthlySavingsRs * 12

  // Formula: Net Investment = System Cost, Payback = Net Investment / Annual Savings
  const paybackYears = annualSavingsRs > 0
    ? parseFloat((netCostRs / annualSavingsRs).toFixed(1))
    : 0

  const savings25YearsRs = (annualSavingsRs * 25) - netCostRs

  const solarUsedDirectlyVal = monthlySolarGen * 0.75
  const exportedToGridVal = monthlySolarGen - solarUsedDirectlyVal
  const offsetPercent = monthlyUnits > 0 ? Math.min(100, (solarUsedDirectlyVal / monthlyUnits) * 100) : 0
  const gridDep = Math.max(0, monthlyUnits - solarUsedDirectlyVal)
  const netMeteringBen = exportedToGridVal * NET_METERING_RATE

  const gridImportRaw = apiData.grid_import ?? apiData.import_units ?? apiData.importUnits ?? (solarFieldData.importUnits != null ? solarFieldData.importUnits : null)
  const gridImportVal = gridImportRaw != null ? Number(gridImportRaw) : (solarFieldData.isSolarConsumer ? null : (monthlyUnits > 0 ? monthlyUnits : null))
  const gridExportRaw = apiData.grid_export ?? apiData.export_units ?? apiData.exportUnits ?? solarFieldData.exportUnits
  const gridExportVal = gridExportRaw != null ? Number(gridExportRaw) : null
  const openingSurplusRaw = apiData.opening_solar_surplus ?? apiData.openingSolarSurplus ?? solarFieldData.openingSolarSurplus
  const openingSurplusVal = openingSurplusRaw != null ? Number(openingSurplusRaw) : null
  const closingSurplusRaw = apiData.closing_solar_surplus ?? apiData.closingSolarSurplus ?? solarFieldData.closingSolarSurplus
  const closingSurplusVal = closingSurplusRaw != null ? Number(closingSurplusRaw) : null
  const netBilledRaw = apiData.net_billed_units ?? apiData.netBilledUnits ?? solarFieldData.netBilledUnits
  const netBilledVal = netBilledRaw != null ? Number(netBilledRaw) : null

  const isSolarInstalled = solarFieldData.isSolarConsumer && (gridImportVal !== null || gridExportVal !== null)
  const netCons = gridImportVal !== null && gridExportVal !== null
    ? Math.max(gridImportVal - gridExportVal, 0)
    : (solarFieldData.isSolarConsumer ? null : (monthlyUnits > 0 ? monthlyUnits : 0))
  const netCredit = gridExportVal !== null ? gridExportVal * NET_METERING_RATE : 0

  const base = {
    customer_name: String(apiData.customer_name ?? ''),
    consumer_number: String(apiData.consumer_number ?? ''),
    discom: String(apiData.discom ?? ''),
    billing_period: String(apiData.billing_period ?? ''),
    monthly_units: monthlyUnits,
    bill_amount: billAmount,
    per_unit_rate: perUnitRate,
    recommended_kw: recommendedKw,
    monthly_generation_units: monthlySolarGen,
    monthly_savings_rs: monthlySavingsRs,
    system_cost_rs: systemCostRs,
    payback_years: paybackYears,
    savings_25_years_rs: savings25YearsRs,
  }
  const enriched: BillAnalysisData = {
    ...base,
    solarYield: SOLAR_YIELD,
    monthlySolarGeneration: monthlySolarGen,
    annualSolarGeneration: annualSolarGen,
    solarUsedDirectly: solarUsedDirectlyVal,
    solarExportedToGrid: exportedToGridVal,
    solarOffsetPercent: offsetPercent,
    gridDependency: gridDep,
    netMeteringBenefit: netMeteringBen,
    isSolarConsumer: solarFieldData.isSolarConsumer || isSolarInstalled,
    importUnits: gridImportVal,
    exportUnits: gridExportVal,
    gridImport: gridImportVal,
    gridExport: gridExportVal,
    openingSolarSurplus: openingSurplusVal,
    closingSolarSurplus: closingSurplusVal,
    netBilledUnits: netBilledVal,
    solarGeneratedUnits: solarFieldData.solarGeneratedUnits,
    netConsumptionUnits: solarFieldData.netConsumptionUnits,
    netConsumption: netCons,
    netMeteringCredit: netCredit,
    extractionConfidence: calculateExtractionConfidence(base as unknown as BillAnalysisData, isFallback),
    billHealth: calculateBillHealthScore(base as unknown as BillAnalysisData),
    solarOpportunity: calculateSolarOpportunityScore(base as unknown as BillAnalysisData, isSolarInstalled),
    filename: filename || 'bill.pdf',
  }
  return enriched
}

export interface BillAnalyzerState {
  analysis: BillAnalysisData | null
  solarReport: SolarReportData | null
  unifiedEnergy: UnifiedEnergyData | null
  billUploadState: UploadState
  solarUploadState: SolarReportState
  billProgress: UploadProgress
  solarProgress: UploadProgress
  billError: string | null
  solarError: string | null
  quotas: BillQuotas | null
}

export interface BillAnalyzerHandlers {
  handleBillFile: (file: File) => void
  handleSolarFile: (file: File) => void
  retryBillUpload: () => void
  retrySolarUpload: () => void
  clearSolarReport: () => void
  resetBill: () => void
  submitManualBill: (formData: ManualBillInput) => void
  fetchQuotas: () => void
}

export interface BillAnalyzerReturn extends BillAnalyzerState, BillAnalyzerHandlers { }

export function useBillAnalyzer(): BillAnalyzerReturn {
  const [analysis, setAnalysis] = useState<BillAnalysisData | null>(null)
  const [solarReport, setSolarReport] = useState<SolarReportData | null>(null)
  const [unifiedEnergy, setUnifiedEnergy] = useState<UnifiedEnergyData | null>(null)
  const [billUploadState, setBillUploadState] = useState<UploadState>('idle')
  const [solarUploadState, setSolarUploadState] = useState<SolarReportState>('NOT_PROVIDED')
  const [billProgress, setBillProgress] = useState<UploadProgress>({ percent: 0, status: '' })
  const [solarProgress, setSolarProgress] = useState<UploadProgress>({ percent: 0, status: '' })
  const [billError, setBillError] = useState<string | null>(null)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [quotas, setQuotas] = useState<BillQuotas | null>(null)
  const [billFileInputTrigger, setBillFileInputTrigger] = useState(0)

  const billChartRef = useRef<Chart | null>(null)
  const historyChartRef = useRef<Chart | null>(null)
  const billProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const solarProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const billRequestId = useRef(0)
  const solarRequestId = useRef(0)

  const clearBillProgressInterval = useCallback(() => {
    if (billProgressInterval.current) {
      clearInterval(billProgressInterval.current)
      billProgressInterval.current = null
    }
  }, [])

  const clearSolarProgressInterval = useCallback(() => {
    if (solarProgressInterval.current) {
      clearInterval(solarProgressInterval.current)
      solarProgressInterval.current = null
    }
  }, [])

  const destroyCharts = useCallback(() => {
    if (billChartRef.current) {
      billChartRef.current.destroy()
      billChartRef.current = null
    }
    if (historyChartRef.current) {
      historyChartRef.current.destroy()
      historyChartRef.current = null
    }
  }, [])

  const initCostBreakdownChart = useCallback((billAmount: number, monthlySavings: number) => {
    const canvas = document.getElementById('billCostBreakdownChart') as HTMLCanvasElement | null
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (billChartRef.current) {
      billChartRef.current.destroy()
      billChartRef.current = null
    }

    const energyCost = Math.round(billAmount * 0.70)
    const fixedCharges = Math.round(billAmount * 0.15)
    const taxes = Math.max(0, billAmount - energyCost - fixedCharges)

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Energy Charges', 'Fixed Charges', 'Taxes & Cess'],
        datasets: [{
          data: [energyCost, fixedCharges, taxes],
          backgroundColor: COST_BREAKDOWN_CHART_COLORS.backgroundColor,
          borderWidth: 2,
          borderColor: '#060f1f',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { size: 10, family: 'Outfit' }, boxWidth: 10, padding: 8 },
          },
          tooltip: CHART_TOOLTIP_THEME,
        },
      },
    }
    billChartRef.current = new ChartJS(ctx, config)
  }, [])

  const initHistoryChart = useCallback((currentBill: number) => {
    const canvas = document.getElementById('billHistoryChart') as HTMLCanvasElement | null
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (historyChartRef.current) {
      historyChartRef.current.destroy()
      historyChartRef.current = null
    }

    const historical = MONTH_MULTIPLIERS.map(m => Math.round(currentBill * m))
    const withSolar = historical.map(b => Math.round(b * 0.25))

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: DEFAULT_MONTHS,
        datasets: [
          {
            label: 'Grid Bill Without Solar (₹)',
            data: historical,
            backgroundColor: HISTORY_CHART_STYLES.billBackground,
            borderColor: HISTORY_CHART_STYLES.billBorder,
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Projected Bill With Solar (₹)',
            data: withSolar,
            backgroundColor: HISTORY_CHART_STYLES.savingsBackground,
            borderColor: HISTORY_CHART_STYLES.savingsBorder,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10, family: 'Outfit' } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: 'Outfit' },
              callback: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 10, family: 'Outfit' }, boxWidth: 10, padding: 8 },
          },
          tooltip: {
            ...CHART_TOOLTIP_THEME,
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ₹${Number(item.raw).toLocaleString('en-IN')}`,
            },
          },
        },
      },
    }
    historyChartRef.current = new ChartJS(ctx, config)
  }, [])

  const updateBillProgress = useCallback((percent: number, status: string) => {
    setBillProgress({ percent, status })
  }, [])

  const updateSolarProgress = useCallback((percent: number, status: string) => {
    setSolarProgress({ percent, status })
  }, [])

  const handleBillFile = useCallback((file: File) => {
    const reqId = ++billRequestId.current
    setBillError(null)
    setBillUploadState('uploading')
    setBillProgress({ percent: 0, status: 'Starting...' })
    setAnalysis(null)
    setUnifiedEnergy(null)
    localStorage.removeItem(getBillStorageKey())
    destroyCharts()

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isValidType = VALID_MIME_TYPES.includes(file.type) || VALID_EXTENSIONS.includes(ext)
    if (!isValidType) {
      setBillError('Please upload a valid document or image file (PDF, PNG, JPG, JPEG, WEBP)')
      setBillUploadState('error')
      setBillProgress({ percent: 0, status: '' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setBillError('File size exceeds 10MB limit.')
      setBillUploadState('error')
      setBillProgress({ percent: 0, status: '' })
      return
    }

    let progress = 0
    const statuses = [
      'Uploading bill document...',
      'Reading electricity bill...',
      'Running OCR extraction...',
      'Analyzing consumption patterns...',
      'Calculating solar recommendations...',
    ]
    clearBillProgressInterval()
    billProgressInterval.current = setInterval(() => {
      if (progress < 90) {
        progress += 10
        if (progress > 90) progress = 90
        const idx = Math.min(Math.floor(progress / 20), statuses.length - 1)
        updateBillProgress(progress, statuses[idx])
      }
    }, 250)

    const doComplete = (apiData: Record<string, unknown>) => {
      if (reqId !== billRequestId.current) return
      clearBillProgressInterval()
      updateBillProgress(100, 'Analysis Complete')
      const apiText = JSON.stringify(apiData)
      const solarFields = extractSolarFields(apiText, file.name)
      const enriched = enrichAnalysisData(apiData, file.name, false, solarFields)
      setAnalysis(enriched)
      writeLS(getBillStorageKey(), enriched)
      setBillUploadState('complete')
    }

    const doError = (err: Error) => {
      if (reqId !== billRequestId.current) return
      clearBillProgressInterval()
      setAnalysis(null)
      setUnifiedEnergy(null)
      localStorage.removeItem(getBillStorageKey())
      localStorage.removeItem('lastBillAnalysis')
      destroyCharts()
      setBillProgress({ percent: 0, status: '' })
      setBillError(err.message || 'Analysis failed. Check the file or try again.')
      setBillUploadState('error')
    }

    const fd = new FormData()
    fd.append('image', file)
    api.post('/analyze-bill', fd)
      .then((res) => {
        if (reqId !== billRequestId.current) return
        const result = res.data
        if (!result) throw new Error('No response received from the bill analysis service.')
        if (result.success !== true) {
          throw new Error(result.error || 'Bill analysis could not be completed for this file.')
        }
        if (!result.data || typeof result.data !== 'object') {
          throw new Error('Analysis completed but extracted bill data was missing.')
        }
        if (result.quota) {
          setQuotas(result.quota)
        }
        if (!validateBillAnalysisResponse(result.data)) {
          throw new Error('Could not extract valid monthly units or bill amount from the document. Please upload a clearer electricity bill.')
        }
        return result.data as Record<string, unknown>
      })
      .then((data) => {
        if (data) doComplete(data)
      })
      .catch((err: unknown) => {
        if (reqId !== billRequestId.current) return
        const msg = extractErrorMessage(err, 'Analysis failed. Please check the file or try again.')
        doError(new Error(msg))
      })
  }, [clearBillProgressInterval, updateBillProgress, destroyCharts])

  const retryBillUpload = useCallback(() => {
    billRequestId.current++
    clearBillProgressInterval()
    setAnalysis(null)
    setUnifiedEnergy(null)
    localStorage.removeItem(getBillStorageKey())
    localStorage.removeItem('lastBillAnalysis')
    destroyCharts()
    setBillError(null)
    setBillUploadState('idle')
    setBillProgress({ percent: 0, status: '' })
    setBillFileInputTrigger(prev => prev + 1)
  }, [clearBillProgressInterval, destroyCharts])

  const resetBill = useCallback(() => {
    billRequestId.current++
    clearBillProgressInterval()
    setAnalysis(null)
    setUnifiedEnergy(null)
    setBillUploadState('idle')
    setBillProgress({ percent: 0, status: '' })
    setBillError(null)
    destroyCharts()
    localStorage.removeItem(getBillStorageKey())
    localStorage.removeItem('lastBillAnalysis')
  }, [clearBillProgressInterval, destroyCharts])

  const clearSolarReport = useCallback(() => {
    solarRequestId.current++
    clearSolarProgressInterval()
    setSolarReport(null)
    setUnifiedEnergy(null)
    localStorage.removeItem(getSolarStorageKey())
    localStorage.removeItem('lastSolarProduction')
    setSolarError(null)
    setSolarUploadState('NOT_PROVIDED')
    setSolarProgress({ percent: 0, status: '' })
  }, [clearSolarProgressInterval])

  const retrySolarUpload = useCallback(() => {
    clearSolarReport()
  }, [clearSolarReport])

  const fetchQuotas = useCallback(() => {
    api.get('/analyze-bill/quota')
      .then((res) => {
        if (res.data?.success && res.data?.quota) {
          setQuotas(res.data.quota)
        }
      })
      .catch(() => {
        // Non-blocking quota lookup
      })
  }, [])

  useEffect(() => {
    fetchQuotas()
  }, [fetchQuotas])

  const submitManualBill = useCallback((formData: ManualBillInput) => {
    billRequestId.current++
    const reqId = billRequestId.current
    clearBillProgressInterval()
    setAnalysis(null)
    setUnifiedEnergy(null)
    localStorage.removeItem(getBillStorageKey())
    localStorage.removeItem('lastBillAnalysis')
    destroyCharts()
    setBillError(null)
    setBillUploadState('uploading')

    let progress = 0
    const statuses = [
      'Validating bill parameters...',
      'Computing consumption averages...',
      'Running solar generation analysis...',
      'Calculating 25-year financial returns...',
    ]
    billProgressInterval.current = setInterval(() => {
      if (progress < 90) {
        progress += 15
        if (progress > 90) progress = 90
        const idx = Math.min(Math.floor(progress / 25), statuses.length - 1)
        updateBillProgress(progress, statuses[idx])
      }
    }, 200)

    api.post('/analyze-bill/manual', formData)
      .then((res) => {
        if (reqId !== billRequestId.current) return
        const result = res.data
        if (!result) throw new Error('No response received from the bill analysis service.')
        if (result.success !== true) {
          throw new Error(result.error || 'Manual bill analysis could not be completed.')
        }
        if (!result.data || typeof result.data !== 'object') {
          throw new Error('Analysis completed but result data was missing.')
        }
        if (result.quota) {
          setQuotas(result.quota)
        }
        clearBillProgressInterval()
        updateBillProgress(100, 'Analysis Complete')
        const apiData = result.data as Record<string, unknown>
        const apiText = JSON.stringify(apiData)
        const solarFields = extractSolarFields(apiText, 'manual_entry')
        const enriched = enrichAnalysisData(apiData, 'manual_entry', false, solarFields)
        setAnalysis(enriched)
        writeLS(getBillStorageKey(), enriched)
        setBillUploadState('complete')
      })
      .catch((err: unknown) => {
        if (reqId !== billRequestId.current) return
        clearBillProgressInterval()
        setBillProgress({ percent: 0, status: '' })
        const msg = extractErrorMessage(err, 'Manual analysis failed. Please verify the entered numbers.')
        setBillError(msg)
        setBillUploadState('error')
      })
  }, [clearBillProgressInterval, updateBillProgress, destroyCharts])

  const handleSolarFile = useCallback((file: File) => {
    const reqId = ++solarRequestId.current
    setSolarError(null)
    setSolarUploadState('UPLOADING')
    setSolarProgress({ percent: 0, status: 'Starting upload...' })
    setSolarReport(null)
    setUnifiedEnergy(null)
    localStorage.removeItem(getSolarStorageKey())

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isValidType = VALID_MIME_TYPES.includes(file.type) || VALID_EXTENSIONS.includes(ext)
    if (!isValidType) {
      setSolarError('Please upload a valid solar report file (PDF, PNG, JPG, JPEG, WEBP)')
      setSolarUploadState('INVALID_FILE')
      setSolarProgress({ percent: 0, status: '' })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setSolarError('File size exceeds 10MB limit. Please upload a smaller file.')
      setSolarUploadState('INVALID_FILE')
      setSolarProgress({ percent: 0, status: '' })
      return
    }

    let progress = 0
    const statuses = [
      'Uploading solar report...',
      'Reading generation data...',
      'Parsing kWh yield metrics...',
      'Computing solar intelligence...',
    ]
    clearSolarProgressInterval()
    solarProgressInterval.current = setInterval(() => {
      if (progress < 90) {
        progress += 10
        if (progress > 90) progress = 90
        if (progress >= 30) {
          setSolarUploadState('PROCESSING')
        }
        const idx = Math.min(Math.floor(progress / 25), statuses.length - 1)
        updateSolarProgress(progress, statuses[idx])
      }
    }, 250)

    const doComplete = (prodData: SolarReportData) => {
      if (reqId !== solarRequestId.current) return
      clearSolarProgressInterval()
      updateSolarProgress(100, 'Analysis Complete')
      setSolarReport(prodData)
      writeLS(getSolarStorageKey(), prodData)
      setSolarUploadState('EXTRACTED')
    }

    const doError = (err: Error, targetState: SolarReportState = 'EXTRACTION_FAILED') => {
      if (reqId !== solarRequestId.current) return
      clearSolarProgressInterval()
      setSolarReport(null)
      setUnifiedEnergy(null)
      localStorage.removeItem(getSolarStorageKey())
      setSolarProgress({ percent: 0, status: '' })
      setSolarError(err.message || 'Could not read solar report. Try another file.')
      setSolarUploadState(targetState)
    }

    const fd = new FormData()
    fd.append('image', file)
    api.post('/analyze-solar-report', fd)
      .then((res) => {
        if (reqId !== solarRequestId.current) return
        const report = res.data?.data
        if (!report || report.monthly_generation_kwh == null) {
          const extractionErr = new Error('Could not extract solar generation figures from this report. Please upload an inverter or app screenshot showing kWh generation, or skip the optional report.')
          extractionErr.name = 'EXTRACTION_FAILED'
          throw extractionErr
        }
        const prodData: SolarReportData = {
          productionKwh: report.monthly_generation_kwh != null ? Number(report.monthly_generation_kwh) : null,
          systemSizeKw: report.system_capacity_kw != null ? Number(report.system_capacity_kw) : null,
          month: report.month || null,
          year: report.year || null,
          source: report.source || null,
          dailyGenerationKwh: report.daily_generation_kwh != null
            ? Number(report.daily_generation_kwh)
            : (report.dailyGenerationKwh != null ? Number(report.dailyGenerationKwh) : null),
          confidence: report.confidence != null ? report.confidence : null,
        }
        return prodData
      })
      .then((data) => {
        if (data) doComplete(data)
      })
      .catch((err: unknown) => {
        if (reqId !== solarRequestId.current) return
        const errorObj = err as { name?: string; message?: string; response?: { status?: number; data?: { error?: string } } }
        const status = errorObj?.response?.status
        const backendError = errorObj?.response?.data?.error

        if (status === 400) {
          doError(new Error(backendError || 'Please upload a PDF, PNG, JPG, JPEG, or WEBP solar production report.'), 'INVALID_FILE')
        } else if (status === 422 || errorObj?.name === 'EXTRACTION_FAILED') {
          doError(new Error(backendError || errorObj.message || 'Could not extract solar generation figures from this report. Please upload an inverter or app screenshot showing kWh generation, or skip the optional report.'), 'EXTRACTION_FAILED')
        } else {
          const msg = backendError || extractErrorMessage(err, 'We couldn\'t process this solar report right now. Please try again or skip the optional report.')
          doError(new Error(msg), 'API_ERROR')
        }
      })
  }, [clearSolarProgressInterval, updateSolarProgress])

  useEffect(() => {
    const savedBill = readLS<Record<string, unknown>>(getBillStorageKey())
    if (savedBill) {
      if (validateBillAnalysisResponse(savedBill as Record<string, unknown>)) {
        const solarFields = extractSolarFields(JSON.stringify(savedBill), (savedBill.filename as string) ?? '')
        const enriched = enrichAnalysisData(savedBill, (savedBill.filename as string) ?? '', false, solarFields)
        setAnalysis(enriched)
        setBillUploadState('complete')
      } else {
        localStorage.removeItem(getBillStorageKey())
      }
    }
    const savedSolar = readLS<SolarReportData>(getSolarStorageKey())
    if (savedSolar && savedSolar.productionKwh != null) {
      setSolarReport(savedSolar)
      setSolarUploadState('EXTRACTED')
    } else {
      localStorage.removeItem(getSolarStorageKey())
      setSolarUploadState('NOT_PROVIDED')
    }
  }, [])

  useEffect(() => {
    if (
      analysis &&
      solarReport &&
      solarReport.productionKwh != null &&
      checkPeriodCompatibility(analysis.billing_period, solarReport.month, solarReport.year)
    ) {
      setUnifiedEnergy(computeUnifiedEnergyIntelligence(analysis, solarReport))
    } else {
      setUnifiedEnergy(null)
    }
  }, [analysis, solarReport])

  useEffect(() => {
    if (analysis && safeNum(analysis.bill_amount) > 0) {
      const billAmount = safeNum(analysis.bill_amount)
      const monthlySavings = safeNum(analysis.monthly_savings_rs)
      const timer = setTimeout(() => {
        initCostBreakdownChart(billAmount, monthlySavings)
        initHistoryChart(billAmount)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      destroyCharts()
    }
  }, [analysis, initCostBreakdownChart, initHistoryChart, destroyCharts])

  useEffect(() => {
    return () => {
      clearBillProgressInterval()
      clearSolarProgressInterval()
      destroyCharts()
    }
  }, [clearBillProgressInterval, clearSolarProgressInterval, destroyCharts])

  return {
    analysis,
    solarReport,
    unifiedEnergy,
    billUploadState,
    solarUploadState,
    billProgress,
    solarProgress,
    billError,
    solarError,
    quotas,
    handleBillFile,
    handleSolarFile,
    retryBillUpload,
    retrySolarUpload,
    clearSolarReport,
    resetBill,
    submitManualBill,
    fetchQuotas,
  }
}
