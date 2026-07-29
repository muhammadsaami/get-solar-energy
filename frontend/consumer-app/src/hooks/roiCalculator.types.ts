export type PanelQuality = 'mono' | 'poly' | 'bifacial'

export type CalcStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ROIFormData {
  monthlyBill: number
  sunHours: number
  systemSize: number
  panelQuality: PanelQuality
}

export interface ROIResult {
  recommendedKw: number
  systemCost: number
  governmentSubsidy: number
  netCost: number
  monthlySavings: number
  annualSavings: number
  annualGeneration: number
  paybackPeriod: number
  lifetimeSavings: number
  roiPercentage: number
  co2Reduction: number
}

export interface ChartDataPoint {
  year: number
  cumulativeCashflow: number
}

export interface ROIState {
  formData: ROIFormData
  result: ROIResult
  status: CalcStatus
  error: string | null
  chartData: ChartDataPoint[]
}

export interface ROIPersistence {
  version: 1
  formData: ROIFormData
  result: ROIResult | null
  lastUpdated: string
}

export interface UseROICalculatorReturn extends ROIState {
  setMonthlyBill: (v: number) => void
  setSunHours: (v: number) => void
  setSystemSize: (v: number) => void
  setPanelQuality: (v: PanelQuality) => void
  calculate: () => Promise<void>
  reset: () => void
  hasCalculated: boolean
}

export const DEFAULT_RESULT: ROIResult = {
  recommendedKw: 3,
  systemCost: 180000,
  governmentSubsidy: 78000,
  netCost: 102000,
  monthlySavings: 6542,
  annualSavings: 78500,
  annualGeneration: 0,
  paybackPeriod: 1.3,
  lifetimeSavings: 1960000,
  roiPercentage: 0,
  co2Reduction: 0,
}

export function generateDefaultChartData(): ChartDataPoint[] {
  const defaultAnnualSavings = 58400
  const defaultNetCost = 102000
  const points: ChartDataPoint[] = []
  for (let year = 1; year <= 25; year++) {
    points.push({
      year,
      cumulativeCashflow: Math.round((year * defaultAnnualSavings) - defaultNetCost),
    })
  }
  return points
}
