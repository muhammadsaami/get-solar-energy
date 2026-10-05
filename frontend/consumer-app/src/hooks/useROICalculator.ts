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

import { getUserStorageKey, readUserStorage, type IdentifiableUser } from '../utils/userStorage'
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
  monthlyUnits: '',
}

function getInitialForm(persistedForm?: ROIFormData): ROIFormData {
  if (persistedForm && typeof persistedForm.monthlyBill === 'number' && persistedForm.monthlyBill > 0) {
    return persistedForm
  }
  const user = tokenManager.getUser() as IdentifiableUser | null
  const bill = readUserStorage<Record<string, unknown>>('lastBillAnalysis', user)
  if (bill) {
    const billAmount = Number(bill.billAmount ?? bill.bill_amount ?? bill.amount)
    const monthlyUnits = Number(bill.monthlyConsumptionKwh ?? bill.monthly_units ?? bill.kwhConsumption)
    const recommendedKw = Number(bill.recommendedKw ?? bill.recommended_kw)
    const derivedKw = recommendedKw > 0
      ? recommendedKw
      : (monthlyUnits > 0 ? Math.max(1, Math.round((monthlyUnits / 135) * 2) / 2) : '')

    return {
      monthlyBill: Number.isFinite(billAmount) && billAmount > 0 ? billAmount : '',
      sunHours: '',
      systemSize: Number.isFinite(derivedKw) && derivedKw > 0 ? derivedKw : '',
      panelQuality: 'mono',
      monthlyUnits: Number.isFinite(monthlyUnits) && monthlyUnits > 0 ? monthlyUnits : '',
    }
  }
  return EMPTY_FORM
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
      r.recommendedKw, r.systemCost, r.netCost,
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

  const [formData, setFormData] = useState<ROIFormData>(() =>
    persisted?.formData ?? getInitialForm()
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
  const setMonthlyUnits = useCallback(
    (v: number | '') => updateForm('monthlyUnits', v),
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

    const user = tokenManager.getUser() as IdentifiableUser | null
    const userLocation = readUserStorage<string>('current_location', user)
    const lastBill = readUserStorage<Record<string, unknown>>('lastBillAnalysis', user)
    const userState = (lastBill?.state as string) || (lastBill?.providerState as string) || userLocation || 'Uttar Pradesh'

    try {
      const apiResponse = await calculateROI({
        monthly_bill: bill,
        state: userState,
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
    setMonthlyUnits,
    setSunHours,
    setSystemSize,
    setPanelQuality,
    calculate,
    reset,
  }
}
