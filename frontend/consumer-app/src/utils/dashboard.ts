import { formatCurrency, formatUnits } from './formatters'
import { calculateSubsidy } from './solar'
import type { CustomerDashboardData } from '../hooks/useCustomerDashboard'

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export interface DashboardDerived {
  isSamplePreview: boolean
  isFreshUser: boolean
  monthlyBill: number | null
  monthlyUnits: number | null
  recommendedKw: number | null
  annualSavings: number | null
  lifetimeSavings: number | null
  systemCost: number | null
  paybackYears: number | null
  productionKwh: number | null
  roofSystemKw: number | null
  roiPercent: number | null
  readinessPercent: number | null
  completedSteps: number
  totalSteps: number
  activities: Array<{ id: string; label: string; date: string }>
}

export function deriveDashboard(data: CustomerDashboardData, isDemoMode = false): DashboardDerived {
  const { bill, solar, roof, roi } = data.analysis
  const stats = data.stats || {}

  // Determine if the customer has genuine customer-owned analysis data
  const hasRealAnalysis = Boolean(
    (bill && (num(bill.bill_amount) > 0 || num(bill.monthly_units) > 0 || num(bill.recommended_kw) > 0)) ||
    (solar && (num(solar.productionKwh) > 0 || num(solar.system_size_kw) > 0)) ||
    (roof && (num(roof.recommendedKw) > 0 || num(roof.system_size_kw) > 0 || num(roof.roof_area_sqft) > 0 || num(roof.area_sqft) > 0)) ||
    (roi && (num(roi.annualSavings) > 0 || num(roi.annual_savings) > 0 || num(roi.lifetimeSavings) > 0 || num(roi.netCost) > 0)) ||
    (Array.isArray(data.recentBills) && data.recentBills.length > 0)
  )

  // Explicit demo preview: only active if user explicitly chose demo mode AND has no real analysis
  const isSamplePreview = !hasRealAnalysis && isDemoMode
  const isFreshUser = !hasRealAnalysis && !isDemoMode

  // 1. Fresh User State: Return clean empty metrics (no fake fallbacks)
  if (isFreshUser) {
    return {
      isSamplePreview: false,
      isFreshUser: true,
      monthlyBill: null,
      monthlyUnits: null,
      recommendedKw: null,
      annualSavings: null,
      lifetimeSavings: null,
      systemCost: null,
      paybackYears: null,
      productionKwh: null,
      roofSystemKw: null,
      roiPercent: null,
      readinessPercent: null,
      completedSteps: 0,
      totalSteps: 5,
      activities: [],
    }
  }

  // 2. Explicit Demo Mode State: Return standard sample preview values clearly marked as demo
  if (isSamplePreview) {
    const sampleMonthlyBill = num(stats.avg_bill) || 2667
    const sampleMonthlyUnits = num(stats.avg_units) || 390
    const sampleKw = 3
    const sampleAnnualSavings = 91800
    const sampleCost = 165000
    const samplePayback = 2.7
    const sampleLifetime = 2043000

    return {
      isSamplePreview: true,
      isFreshUser: false,
      monthlyBill: sampleMonthlyBill,
      monthlyUnits: sampleMonthlyUnits,
      recommendedKw: sampleKw,
      annualSavings: sampleAnnualSavings,
      lifetimeSavings: sampleLifetime,
      systemCost: sampleCost,
      paybackYears: samplePayback,
      productionKwh: 360,
      roofSystemKw: sampleKw,
      roiPercent: 24.5,
      readinessPercent: 75,
      completedSteps: 3,
      totalSteps: 5,
      activities: [
        { id: 'demo-bill', label: 'Sample Bill Analysis (Demo)', date: 'Demo Data' },
        { id: 'demo-roof', label: 'Sample Roof Vision AI (Demo)', date: 'Demo Data' },
        { id: 'demo-roi', label: 'Sample ROI Calculation (Demo)', date: 'Demo Data' },
      ],
    }
  }

  // 3. Genuine Customer-Owned Analysis State
  const monthlyBill = num(bill?.bill_amount) || null
  const monthlyUnits = num(bill?.monthly_units) || null
  const recommendedKw = (num(bill?.recommended_kw) || num(roof?.recommendedKw) || num(roof?.system_size_kw)) || null
  const roofSystemKw = (num(roof?.recommendedKw) || num(roof?.system_size_kw) || num(roof?.recommended_kw)) || null

  const capacityKw = recommendedKw || roofSystemKw || (monthlyUnits && monthlyUnits > 0 ? Math.max(1, Math.round((monthlyUnits / 135) * 2) / 2) : 0)

  const monthlySavings = num(bill?.monthly_savings_rs) || (monthlyBill && monthlyBill > 0 ? Math.round(monthlyBill * 0.9) : 0)

  const annualSavings = (num(roi?.annualSavings) ||
    num(roi?.annual_savings) ||
    num(roi?.annual_savings_rs) ||
    (monthlySavings > 0 ? monthlySavings * 12 : 0) ||
    num(bill?.annual_savings)) || null

  const systemCost = (num(bill?.system_cost_rs) || num(roi?.systemCost) || num(roi?.system_cost) || (capacityKw > 0 ? capacityKw * 55000 : 0)) || null

  const subsidy = capacityKw > 0 ? calculateSubsidy(capacityKw) : 0
  const netInvestment = systemCost ? Math.max(0, systemCost - subsidy) : 0

  let paybackYears: number | null = null
  const roiPayback = num(roi?.paybackPeriod) || num(roi?.paybackYears) || num(roi?.payback_period)
  if (roiPayback > 0 && roiPayback <= 15) {
    paybackYears = roiPayback
  } else if (netInvestment > 0 && annualSavings && annualSavings > 0) {
    paybackYears = parseFloat((netInvestment / annualSavings).toFixed(1))
  } else if (num(bill?.payback_years) > 0 && num(bill?.payback_years) <= 15) {
    paybackYears = num(bill?.payback_years)
  }

  const lifetimeSavings = (num(bill?.savings_25yr) ||
    num(roi?.lifetimeSavings) ||
    num(roi?.lifetime_savings_rs) ||
    (annualSavings && annualSavings > 0 ? Math.max(0, (annualSavings * 25) - netInvestment) : 0)) || null

  const productionKwh = solar?.productionKwh ? num(solar.productionKwh) : (capacityKw > 0 ? capacityKw * 120 : null)

  const roiPercent = (num(roi?.roi) || num(roi?.roiPercent) || (netInvestment > 0 && lifetimeSavings && lifetimeSavings > 0 ? parseFloat((((lifetimeSavings - netInvestment) / netInvestment) * 100).toFixed(1)) : null))

  const completion = Object.values(data.journey).filter(Boolean).length
  const readinessPercent = completion > 0 ? Math.min(100, Math.round((completion / 4) * 100)) : null

  const activities: Array<{ id: string; label: string; date: string }> = []
  if (bill || solar) activities.push({ id: 'ab', label: 'Electricity bill analyzed', date: new Date().toLocaleDateString() })
  if (roof) activities.push({ id: 'ar', label: 'Roof analysis completed', date: new Date().toLocaleDateString() })
  if (roi) activities.push({ id: 'aroi', label: 'ROI calculated', date: new Date().toLocaleDateString() })
  for (const b of data.recentBills.slice(0, 4)) {
    const stamp = b.created_at ? new Date(String(b.created_at)).toLocaleDateString() : new Date().toLocaleDateString()
    activities.push({ id: `rb-${b.id}`, label: `${b.billing_period || 'Bill'} analyzed`, date: stamp })
  }

  return {
    isSamplePreview: false,
    isFreshUser: false,
    monthlyBill,
    monthlyUnits,
    recommendedKw: capacityKw > 0 ? capacityKw : null,
    annualSavings,
    lifetimeSavings,
    systemCost,
    paybackYears,
    productionKwh,
    roofSystemKw: roofSystemKw || (capacityKw > 0 ? capacityKw : null),
    roiPercent,
    readinessPercent,
    completedSteps: completion,
    totalSteps: 5,
    activities,
  }
}

export const fmtINR = (n: number | null | undefined) => (n !== null && n !== undefined && n > 0 ? formatCurrency(n) : '—')
export const fmtUnits = (n: number | null | undefined) => (n !== null && n !== undefined && n > 0 ? formatUnits(n) : '—')