import { useState, useCallback, useRef } from 'react'
import { calculateROI } from '../services/roi.service'
import { calculateFallbackROI } from '../utils/solar'
import {
  DEFAULT_RESULT,
  generateDefaultChartData,
  type CalcStatus,
  type ROIFormData,
  type ROIResult,
  type ROIState,
  type ChartDataPoint,
  type PanelQuality,
  type UseROICalculatorReturn,
  type ROIPersistence,
} from './roiCalculator.types'

const STORAGE_KEY = 'roiAnalysisState'

const DEFAULT_FORM: ROIFormData = {
  monthlyBill: 6500,
  sunHours: 5,
  systemSize: 3,
  panelQuality: 'mono',
}

function generateChartData(result: ROIResult): ChartDataPoint[] {
  const points: ChartDataPoint[] = []
  for (let year = 1; year <= 25; year++) {
    points.push({
      year,
      cumulativeCashflow: Math.round((year * result.annualSavings) - result.netCost),
    })
  }
  return points
}

function loadPersistence(): ROIState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: ROIPersistence = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (!parsed.formData || typeof parsed.formData.monthlyBill !== 'number') {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (!parsed.result) return null
    const r = parsed.result
    const numericFields = [
      r.recommendedKw, r.systemCost, r.governmentSubsidy, r.netCost,
      r.monthlySavings, r.annualSavings, r.annualGeneration, r.paybackPeriod,
      r.lifetimeSavings, r.roiPercentage, r.co2Reduction,
    ]
    const valid = numericFields.every(
      (f) => typeof f === 'number' && isFinite(f) && f >= 0,
    )
    if (!valid) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const chartData = generateChartData(r)
    return {
      formData: parsed.formData,
      result: r,
      status: 'success',
      error: null,
      chartData,
    }
  } catch {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
    return null
  }
}

function savePersistence(formData: ROIFormData, result: ROIResult | null): void {
  try {
    const data: ROIPersistence = {
      version: 1,
      formData,
      result,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* noop */
  }
}

export function useROICalculator(): UseROICalculatorReturn {
  const persisted = loadPersistence()

  const [formData, setFormData] = useState<ROIFormData>(
    persisted?.formData ?? DEFAULT_FORM,
  )
  const [result, setResult] = useState<ROIResult>(
    persisted?.result ?? DEFAULT_RESULT,
  )
  const [status, setStatus] = useState<CalcStatus>(
    persisted?.status ?? 'idle',
  )
  const [error, setError] = useState<string | null>(
    persisted?.error ?? null,
  )
  const [chartData, setChartData] = useState<ChartDataPoint[]>(
    persisted?.chartData ?? generateDefaultChartData(),
  )
  const [hasCalculated, setHasCalculated] = useState<boolean>(
    persisted?.result !== null,
  )
  const calcCount = useRef(0)

  const updateForm = useCallback(<K extends keyof ROIFormData>(
    key: K,
    value: ROIFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setMonthlyBill = useCallback(
    (v: number) => updateForm('monthlyBill', v),
    [updateForm],
  )
  const setSunHours = useCallback(
    (v: number) => updateForm('sunHours', v),
    [updateForm],
  )
  const setSystemSize = useCallback(
    (v: number) => updateForm('systemSize', v),
    [updateForm],
  )
  const setPanelQuality = useCallback(
    (v: PanelQuality) => updateForm('panelQuality', v),
    [updateForm],
  )

  const calculate = useCallback(async () => {
    const count = ++calcCount.current
    setStatus('loading')
    setError(null)

    let roiResult: ROIResult

    try {
      const apiResponse = await calculateROI({
        monthly_bill: formData.monthlyBill,
        state: 'Uttar Pradesh',
        roof_type: 'flat',
        system_size: formData.systemSize,
      })

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Invalid API response')
      }

      const d = apiResponse.data
      roiResult = {
        recommendedKw: d.recommended_kw,
        systemCost: d.system_cost,
        governmentSubsidy: d.government_subsidy,
        netCost: d.net_cost,
        monthlySavings: d.monthly_savings,
        annualSavings: d.annual_savings,
        annualGeneration: d.annual_generation,
        paybackPeriod: d.payback_period,
        lifetimeSavings: d.lifetime_savings,
        roiPercentage: d.roi_percentage,
        co2Reduction: d.co2_reduction,
      }
    } catch {
      const fallback = calculateFallbackROI({
        monthlyBill: formData.monthlyBill,
        systemSize: formData.systemSize,
      })
      roiResult = fallback
    }

    if (count !== calcCount.current) return

    setResult(roiResult)
    setStatus('success')
    setHasCalculated(true)
    const points = generateChartData(roiResult)
    setChartData(points)
    savePersistence(formData, roiResult)
  }, [formData])

  const reset = useCallback(() => {
    setFormData(DEFAULT_FORM)
    setResult(DEFAULT_RESULT)
    setStatus('idle')
    setHasCalculated(false)
    setError(null)
    setChartData(generateDefaultChartData())
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
  }, [])

  return {
    formData,
    result,
    status,
    error,
    chartData,
    hasCalculated,
    setMonthlyBill,
    setSunHours,
    setSystemSize,
    setPanelQuality,
    calculate,
    reset,
  }
}
