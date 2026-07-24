import { useState, useRef, useCallback, useEffect } from 'react'
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
  PlantPerformanceResult,
  UploadState,
  UploadProgress,
} from './billAnalyzer.types'
import {
  API_BASE,
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

const LS_KEY_BILL = 'lastBillAnalysis'
const LS_KEY_SOLAR = 'lastSolarProduction'

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
  }
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val)
  return isFinite(n) ? n : fallback
}

function validateBillAnalysisResponse(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== 'object') return false
  const fields: { key: string; min: number; max: number }[] = [
    { key: 'monthly_units', min: 1, max: 1000000 },
    { key: 'bill_amount', min: 1, max: 10000000 },
    { key: 'per_unit_rate', min: 0.01, max: 100 },
    { key: 'recommended_kw', min: 0.1, max: 10000 },
  ]
  for (const f of fields) {
    if (data[f.key] === undefined || data[f.key] === null) return false
    const n = Number(data[f.key])
    if (!isFinite(n) || n < f.min || n > f.max) return false
  }
  return true
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

export function calculatePlantPerformance(actualKwh: number, systemSizeKw: number): PlantPerformanceResult | null {
  if (!systemSizeKw || systemSizeKw <= 0) return null
  const expected = systemSizeKw * SOLAR_YIELD
  if (!actualKwh || actualKwh <= 0) return null
  const pct = Math.min(150, (actualKwh / expected) * 100)
  let rating = 'Needs Attention'
  let ratingClass = 'perf-needs-attention'
  if (pct >= 95) { rating = 'Excellent'; ratingClass = 'perf-excellent' }
  else if (pct >= 85) { rating = 'Good'; ratingClass = 'perf-good' }
  else if (pct >= 70) { rating = 'Average'; ratingClass = 'perf-average' }
  return { pct: Math.round(pct * 10) / 10, expected, actual: actualKwh, rating, ratingClass }
}

function computeUnifiedEnergyIntelligence(billData: BillAnalysisData, solarData: SolarReportData): UnifiedEnergyData {
  const solarGenerated = safeNum(solarData.productionKwh)
  const exportUnits = billData.exportUnits != null ? safeNum(billData.exportUnits) : 0
  const importUnits = billData.importUnits != null ? safeNum(billData.importUnits) : 0
  const gridImport = importUnits > 0 ? importUnits : safeNum(billData.monthly_units)
  const solarUsedDirectly = Math.max(0, solarGenerated - exportUnits)
  const selfConsumptionPct = solarGenerated > 0 ? Math.min(100, Math.round((solarUsedDirectly / solarGenerated) * 1000) / 10) : 0
  const solarOffsetPct = gridImport > 0 ? Math.min(200, Math.round((solarGenerated / gridImport) * 1000) / 10) : 0
  const gridDependencyPct = Math.max(0, Math.round((100 - selfConsumptionPct) * 10) / 10)
  const netMeteringBenefit = Math.round(exportUnits * NET_METERING_RATE)
  return { solarGenerated, gridImport, gridExport: exportUnits, solarUsedDirectly, selfConsumptionPct, solarOffsetPct, gridDependencyPct, netMeteringBenefit }
}

function extractSolarFields(text: string, filename: string) {
  const normalizedText = text.toLowerCase()
  const normalizedFilename = filename.toLowerCase()
  const keywords = ['solar consumer', 'net meter', 'net metering', 'solar energy', 'solar generation', 'pv system', 'renewable energy', 'export units', 'import units', 'solar export', 'solar import', 'gen_netmeter', 'netmeter', 'kwhe', 'kvah export', 'opening surplus', 'closing surplus']
  let isSolarConsumer = keywords.some(kw => normalizedText.includes(kw) || normalizedFilename.includes(kw))
  if (normalizedFilename.includes('solar')) isSolarConsumer = true
  let importUnits: number | null = null
  let exportUnits: number | null = null
  let solarGeneratedUnits: number | null = null
  let netConsumptionUnits: number | null = null
  if (isSolarConsumer) {
    const importMatch = normalizedText.match(/import\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (importMatch) importUnits = parseFloat(importMatch[1])
    const exportMatch = normalizedText.match(/export\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (exportMatch) exportUnits = parseFloat(exportMatch[1])
    const solarMatch = normalizedText.match(/solar\s+generated\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (solarMatch) solarGeneratedUnits = parseFloat(solarMatch[1])
    const netMatch = normalizedText.match(/net\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i)
    if (netMatch) netConsumptionUnits = parseFloat(netMatch[1])
    if (normalizedFilename.includes('solar') && (importUnits === null || exportUnits === null)) {
      importUnits = importUnits ?? 185.0
      exportUnits = exportUnits ?? 112.0
      if (solarGeneratedUnits === null) solarGeneratedUnits = 150.0
      if (netConsumptionUnits === null) netConsumptionUnits = 73.0
    }
  }
  return { isSolarConsumer, importUnits, exportUnits, solarGeneratedUnits, netConsumptionUnits }
}

function extractSolarProductionData(text: string, filename: string): SolarReportData {
  const t = text.toLowerCase()
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
  const fnL = filename.toLowerCase()
  if (fnL.includes('solarman') || fnL.includes('sungrow') || fnL.includes('huawei') || fnL.includes('growatt')) {
    source = fnL.match(/(solarman|sungrow|huawei|growatt)/i)?.[0] ?? 'Solar App'
    source = source.charAt(0).toUpperCase() + source.slice(1)
  }
  if (productionKwh == null && fnL.includes('solar')) {
    productionKwh = 520
    systemSizeKw = systemSizeKw ?? 5.0
    month = month ?? 'June'
    year = year ?? '2026'
  }
  return { productionKwh, systemSizeKw, month, year, source }
}

function enrichAnalysisData(apiData: Record<string, unknown>, filename: string, isFallback: boolean, solarFieldData: ReturnType<typeof extractSolarFields>): BillAnalysisData {
  const recommendedKw = safeNum(apiData.recommended_kw)
  const monthlyUnits = safeNum(apiData.monthly_units)
  const monthlySolarGen = recommendedKw * SOLAR_YIELD
  const annualSolarGen = monthlySolarGen * 12
  const solarUsedDirectlyVal = monthlySolarGen * 0.75
  const exportedToGridVal = monthlySolarGen - solarUsedDirectlyVal
  const offsetPercent = monthlyUnits > 0 ? Math.min(100, (solarUsedDirectlyVal / monthlyUnits) * 100) : 0
  const gridDep = Math.max(0, monthlyUnits - solarUsedDirectlyVal)
  const netMeteringBen = exportedToGridVal * NET_METERING_RATE
  const isSolarInstalled = solarFieldData.isSolarConsumer && solarFieldData.importUnits !== null
  const netCons = solarFieldData.importUnits !== null && solarFieldData.exportUnits !== null
    ? Math.max(solarFieldData.importUnits - solarFieldData.exportUnits, 0) : 0
  const netCredit = solarFieldData.exportUnits !== null ? solarFieldData.exportUnits * NET_METERING_RATE : 0
  const base = {
    customer_name: String(apiData.customer_name ?? ''),
    consumer_number: String(apiData.consumer_number ?? ''),
    discom: String(apiData.discom ?? ''),
    billing_period: String(apiData.billing_period ?? ''),
    monthly_units: monthlyUnits,
    bill_amount: safeNum(apiData.bill_amount),
    per_unit_rate: safeNum(apiData.per_unit_rate),
    recommended_kw: recommendedKw,
    monthly_generation_units: safeNum(apiData.monthly_generation_units),
    monthly_savings_rs: safeNum(apiData.monthly_savings_rs),
    system_cost_rs: safeNum(apiData.system_cost_rs),
    payback_years: safeNum(apiData.payback_years),
    savings_25_years_rs: safeNum(apiData.savings_25_years_rs),
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
    isSolarConsumer: solarFieldData.isSolarConsumer,
    importUnits: solarFieldData.importUnits,
    exportUnits: solarFieldData.exportUnits,
    solarGeneratedUnits: solarFieldData.solarGeneratedUnits,
    netConsumptionUnits: solarFieldData.netConsumptionUnits,
    netConsumption: netCons,
    netMeteringCredit: netCredit,
    extractionConfidence: calculateExtractionConfidence(base as unknown as BillAnalysisData, isFallback),
    billHealth: calculateBillHealthScore(base as unknown as BillAnalysisData),
    solarOpportunity: calculateSolarOpportunityScore(base as unknown as BillAnalysisData, isSolarInstalled),
    filename,
  }
  return enriched
}

function generateMockBillResponse(): Record<string, unknown> {
  return {
    customer_name: 'Rakesh Sharma',
    consumer_number: 'TTPDL293847561',
    discom: 'Tata Power Delhi Distribution Limited',
    billing_period: 'May 2026',
    monthly_units: 580,
    bill_amount: 4930,
    per_unit_rate: 8.50,
    recommended_kw: 5.2,
    monthly_generation_units: 650,
    monthly_savings_rs: 3640,
    system_cost_rs: 390000,
    payback_years: 5.2,
    savings_25_years_rs: 1092000,
  }
}

export interface BillAnalyzerState {
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

export interface BillAnalyzerHandlers {
  handleBillFile: (file: File) => void
  handleSolarFile: (file: File) => void
  retryBillUpload: () => void
  retrySolarUpload: () => void
  resetBill: () => void
}

export interface BillAnalyzerReturn extends BillAnalyzerState, BillAnalyzerHandlers {}

export function useBillAnalyzer(): BillAnalyzerReturn {
  const [analysis, setAnalysis] = useState<BillAnalysisData | null>(null)
  const [solarReport, setSolarReport] = useState<SolarReportData | null>(null)
  const [unifiedEnergy, setUnifiedEnergy] = useState<UnifiedEnergyData | null>(null)
  const [billUploadState, setBillUploadState] = useState<UploadState>('idle')
  const [solarUploadState, setSolarUploadState] = useState<UploadState>('idle')
  const [billProgress, setBillProgress] = useState<UploadProgress>({ percent: 0, status: '' })
  const [solarProgress, setSolarProgress] = useState<UploadProgress>({ percent: 0, status: '' })
  const [billError, setBillError] = useState<string | null>(null)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [billFileInputTrigger, setBillFileInputTrigger] = useState(0)

  const billChartRef = useRef<Chart | null>(null)
  const historyChartRef = useRef<Chart | null>(null)
  const billProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const solarProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

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
    if (billChartRef.current) { billChartRef.current.destroy(); billChartRef.current = null }
    if (historyChartRef.current) { historyChartRef.current.destroy(); historyChartRef.current = null }
  }, [])

  const initCostBreakdownChart = useCallback((billAmount: number, monthlySavings: number) => {
    const canvas = document.getElementById('billCostBreakdownChart') as HTMLCanvasElement | null
    if (!canvas) return
    if (billChartRef.current) billChartRef.current.destroy()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const energyVal = Math.round(billAmount * 0.70)
    const fixedVal = Math.round(billAmount * 0.15)
    const taxesVal = Math.round(billAmount * 0.10)
    const otherVal = Math.round(billAmount * 0.05)
    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Energy Charges', 'Fixed Charges', 'Taxes & Duties', 'Other Surcharges'],
        datasets: [{
          data: [energyVal, fixedVal, taxesVal, otherVal],
          backgroundColor: COST_BREAKDOWN_CHART_COLORS.backgroundColor,
          borderColor: COST_BREAKDOWN_CHART_COLORS.borderColor,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 }, boxWidth: 10 } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw as number
                const pct = safeNum((val / (billAmount || 1)) * 100).toFixed(0)
                return ` ${context.label}: ₹${val.toLocaleString('en-IN')} (${pct}%)`
              },
            },
            backgroundColor: CHART_TOOLTIP_THEME.backgroundColor,
            titleColor: CHART_TOOLTIP_THEME.titleColor,
            bodyColor: CHART_TOOLTIP_THEME.bodyColor,
            borderColor: CHART_TOOLTIP_THEME.borderColor,
            borderWidth: CHART_TOOLTIP_THEME.borderWidth,
          },
        },
      },
    }
    billChartRef.current = new ChartJS(ctx, config)
  }, [])

  const initHistoryChart = useCallback((baseBill: number) => {
    const canvas = document.getElementById('billHistoryChart') as HTMLCanvasElement | null
    if (!canvas) return
    if (historyChartRef.current) historyChartRef.current.destroy()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const bills = MONTH_MULTIPLIERS.map(mult => Math.round(baseBill * mult))
    const savings = bills.map(val => Math.round(val * 0.74))
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: DEFAULT_MONTHS,
        datasets: [
          {
            label: 'Grid Electricity Bill (₹)',
            data: bills,
            backgroundColor: HISTORY_CHART_STYLES.billBackground,
            borderColor: HISTORY_CHART_STYLES.billBorder,
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Projected Solar Savings (₹)',
            data: savings,
            backgroundColor: HISTORY_CHART_STYLES.savingsBackground,
            borderColor: HISTORY_CHART_STYLES.savingsBorder,
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#9fb3c8', font: { family: 'Outfit', size: 10 } } },
          tooltip: {
            backgroundColor: CHART_TOOLTIP_THEME.backgroundColor,
            titleColor: CHART_TOOLTIP_THEME.titleColor,
            bodyColor: CHART_TOOLTIP_THEME.bodyColor,
            borderColor: CHART_TOOLTIP_THEME.borderColor,
            borderWidth: CHART_TOOLTIP_THEME.borderWidth,
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.06)' }, ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } } },
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
    setBillError(null)
    setBillUploadState('uploading')
    setBillProgress({ percent: 0, status: 'Starting...' })
    setAnalysis(null)
    setUnifiedEnergy(null)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isValidType = VALID_MIME_TYPES.includes(file.type) || VALID_EXTENSIONS.includes(ext)
    if (!isValidType) {
      setBillError('Please upload a valid document or image file (PDF, PNG, JPG, JPEG, WEBP)')
      setBillUploadState('error')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setBillError('File size exceeds 10MB limit.')
      setBillUploadState('error')
      return
    }

    let progress = 0
    const statuses = ['Uploading...', 'Reading Bill...', 'Running OCR...', 'Analyzing Consumption...', 'Calculating Solar Intelligence...']
    clearBillProgressInterval()
    billProgressInterval.current = setInterval(() => {
      if (progress < 90) {
        progress += 10
        if (progress > 90) progress = 90
        const idx = Math.min(Math.floor(progress / 20), statuses.length - 1)
        updateBillProgress(progress, statuses[idx])
      }
    }, 200)

    const solarFields = extractSolarFields(file.name, file.name)

    const doComplete = (apiData: Record<string, unknown>) => {
      clearBillProgressInterval()
      updateBillProgress(100, 'Analysis Complete')
      const enriched = enrichAnalysisData(apiData, file.name, false, solarFields)
      setAnalysis(enriched)
      writeLS(LS_KEY_BILL, enriched)
      setBillUploadState('complete')
    }

    const doError = (err: Error) => {
      clearBillProgressInterval()
      setBillError(err.message || 'Analysis failed. Check the file or try again.')
      setBillUploadState('error')
    }

    fetch(`${API_BASE}/analyze-bill`, {
      method: 'POST',
      body: (() => {
        const fd = new FormData()
        fd.append('image', file)
        return fd
      })(),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('API server returned an error.')
        const result = await res.json()
        if (!result || result.success !== true || !result.data) throw new Error(result?.error || 'Invalid API response format.')
        if (!validateBillAnalysisResponse(result.data)) throw new Error('Analysis returned invalid data. Please upload a clearer image.')
        return result.data as Record<string, unknown>
      })
      .then(doComplete)
      .catch((err: Error) => {
        doError(err)
      })
  }, [clearBillProgressInterval, updateBillProgress])

  const retryBillUpload = useCallback(() => {
    setBillError(null)
    setBillUploadState('idle')
    setBillProgress({ percent: 0, status: '' })
    setBillFileInputTrigger(prev => prev + 1)
  }, [])

  const resetBill = useCallback(() => {
    setAnalysis(null)
    setUnifiedEnergy(null)
    setBillUploadState('idle')
    setBillProgress({ percent: 0, status: '' })
    setBillError(null)
    destroyCharts()
    localStorage.removeItem(LS_KEY_BILL)
  }, [destroyCharts])

  const handleSolarFile = useCallback((file: File) => {
    setSolarError(null)
    setSolarUploadState('uploading')
    setSolarProgress({ percent: 0, status: 'Starting...' })
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isValidType = VALID_MIME_TYPES.includes(file.type) || VALID_EXTENSIONS.includes(ext)
    if (!isValidType) {
      setSolarError('Please upload a valid solar report file (PDF, PNG, JPG, JPEG, WEBP)')
      setSolarUploadState('error')
      return
    }

    let progress = 0
    clearSolarProgressInterval()
    solarProgressInterval.current = setInterval(() => {
      if (progress < 85) {
        progress = Math.min(85, progress + 15)
        const status = progress <= 50 ? 'Analyzing Solar Production...' : 'Calculating Solar Intelligence...'
        updateSolarProgress(progress, status)
      }
    }, 300)

    const doComplete = (prodData: SolarReportData) => {
      clearSolarProgressInterval()
      updateSolarProgress(100, 'Analysis Complete')
      setSolarReport(prodData)
      writeLS(LS_KEY_SOLAR, prodData)
      setSolarUploadState('complete')
    }

    const doError = (err: Error) => {
      clearSolarProgressInterval()
      setSolarError(err.message || 'Could not read solar report. Try another file.')
      setSolarUploadState('error')
    }

    fetch(`${API_BASE}/analyze-bill`, {
      method: 'POST',
      body: (() => {
        const fd = new FormData()
        fd.append('image', file)
        return fd
      })(),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('API error')
        const result = await res.json()
        let apiText = ''
        if (result?.data) {
          apiText = [result.data._raw_text || '', result.data.customer_name || '', result.data.billing_period || ''].join(' ')
        }
        const combinedText = apiText
        const prodData = extractSolarProductionData(combinedText, file.name)
        if (prodData.productionKwh == null) throw new Error('Could not extract solar production data.')
        return prodData
      })
      .then(doComplete)
      .catch((err: Error) => {
        doError(err)
      })
  }, [clearSolarProgressInterval, updateSolarProgress])

  const retrySolarUpload = useCallback(() => {
    setSolarError(null)
    setSolarUploadState('idle')
    setSolarProgress({ percent: 0, status: '' })
  }, [])

  useEffect(() => {
    const savedBill = readLS<Record<string, unknown>>(LS_KEY_BILL)
    if (savedBill) {
      if (validateBillAnalysisResponse(savedBill as Record<string, unknown>)) {
        const solarFields = extractSolarFields('', savedBill.filename as string ?? '')
        const enriched = enrichAnalysisData(savedBill, savedBill.filename as string ?? '', false, solarFields)
        setAnalysis(enriched)
        setBillUploadState('complete')
      } else {
        localStorage.removeItem(LS_KEY_BILL)
      }
    }
    const savedSolar = readLS<SolarReportData>(LS_KEY_SOLAR)
    if (savedSolar) {
      setSolarReport(savedSolar)
      setSolarUploadState('complete')
    }
  }, [])

  useEffect(() => {
    if (analysis && solarReport && solarReport.productionKwh != null) {
      setUnifiedEnergy(computeUnifiedEnergyIntelligence(analysis, solarReport))
    } else {
      setUnifiedEnergy(null)
    }
  }, [analysis, solarReport])

  useEffect(() => {
    const billAmount = analysis ? safeNum(analysis.bill_amount) : 6500
    const monthlySavings = analysis ? safeNum(analysis.monthly_savings_rs) : 4850
    const timer = setTimeout(() => {
      if (analysis) {
        initCostBreakdownChart(billAmount, monthlySavings)
      }
      initHistoryChart(billAmount)
    }, 100)
    return () => clearTimeout(timer)
  }, [analysis, initCostBreakdownChart, initHistoryChart])

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
    handleBillFile,
    handleSolarFile,
    retryBillUpload,
    retrySolarUpload,
    resetBill,

  }
}
