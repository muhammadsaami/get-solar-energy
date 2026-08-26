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
  result: ROIResult | null
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
