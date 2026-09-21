import { useState, useCallback, useRef } from 'react'
import { calculateROI } from '../services/roi.service'
import { calculateFallbackROI } from '../utils/solar'
import {
  type CalcStatus,
  type ROIFormData,
  type ROIResult,
  type ROIState,
  type ChartDataPoint,
  type PanelQuality,
  type UseROICalculatorReturn,
  type ROIPersistence,
} from './roiCalculator.types'

import { getUserStorageKey, type IdentifiableUser } from '../utils/userStorage'
import { tokenManager } from '../services/auth/tokenManager'

function getRoiStorageKey(): string {
  const user = tokenManager.getUser() as IdentifiableUser | null
  return getUserStorageKey('roiAnalysisState', user)
}

const EMPTY_FORM: ROIFormData = {
  monthlyBill: '',
  sunHours: '',
  systemSize: '',
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
    const raw = localStorage.getItem(getRoiStorageKey())
    if (!raw) return null
    const parsed: ROIPersistence = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) {
      localStorage.removeItem(getRoiStorageKey())
      localStorage.removeItem('roiAnalysisState')
      return null
    }
    if (!parsed.formData) {
      localStorage.removeItem(getRoiStorageKey())
      localStorage.removeItem('roiAnalysisState')
      return null
    }
    const bill = parsed.formData.monthlyBill
    if (typeof bill !== 'number' || bill <= 0) {
      localStorage.removeItem(getRoiStorageKey())
      localStorage.removeItem('roiAnalysisState')
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
      localStorage.removeItem(getRoiStorageKey())
      localStorage.removeItem('roiAnalysisState')
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
    try {
      localStorage.removeItem(getRoiStorageKey())
      localStorage.removeItem('roiAnalysisState')
    } catch { /* noop */ }
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
    localStorage.setItem(getRoiStorageKey(), JSON.stringify(data))
  } catch {
    /* noop */
  }
}

export function useROICalculator(): UseROICalculatorReturn {
  const persisted = loadPersistence()

  const [formData, setFormData] = useState<ROIFormData>(
    persisted?.formData ?? EMPTY_FORM,
  )
  const [result, setResult] = useState<ROIResult | null>(
    persisted?.result ?? null,
  )
  const [status, setStatus] = useState<CalcStatus>(
    persisted?.status ?? 'idle',
  )
  const [error, setError] = useState<string | null>(
    persisted?.error ?? null,
  )
  const [chartData, setChartData] = useState<ChartDataPoint[]>(
    persisted?.chartData ?? [],
  )
  const [hasCalculated, setHasCalculated] = useState<boolean>(
    Boolean(persisted?.result),
  )
  const calcCount = useRef(0)

  const updateForm = useCallback(<K extends keyof ROIFormData>(
    key: K,
    value: ROIFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setMonthlyBill = useCallback(
    (v: number | '') => updateForm('monthlyBill', v),
    [updateForm],
  )
  const setSunHours = useCallback(
    (v: number | '') => updateForm('sunHours', v),
    [updateForm],
  )
  const setSystemSize = useCallback(
    (v: number | '') => updateForm('systemSize', v),
    [updateForm],
  )
  const setPanelQuality = useCallback(
    (v: PanelQuality) => updateForm('panelQuality', v),
    [updateForm],
  )

  const calculate = useCallback(async () => {
    const rawBill = formData.monthlyBill
    const rawSize = formData.systemSize

    const bill = typeof rawBill === 'number' ? rawBill : parseFloat(String(rawBill || ''))
    const size = typeof rawSize === 'number' ? rawSize : parseFloat(String(rawSize || ''))

    if (isNaN(bill) || bill <= 0 || isNaN(size) || size <= 0) {
      setError('Please enter your monthly electricity bill and target system capacity.')
      setStatus('error')
      return
    }

    const count = ++calcCount.current
    setStatus('loading')
    setError(null)

    let roiResult: ROIResult

    try {
      const apiResponse = await calculateROI({
        monthly_bill: bill,
        state: 'Uttar Pradesh',
        roof_type: 'flat',
        system_size: size,
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
        monthlyBill: bill,
        systemSize: size,
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
    setFormData(EMPTY_FORM)
    setResult(null)
    setStatus('idle')
    setHasCalculated(false)
    setError(null)
    setChartData([])
    try {
      localStorage.removeItem(getRoiStorageKey())
      localStorage.removeItem('roiAnalysisState')
    } catch { /* noop */ }
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
