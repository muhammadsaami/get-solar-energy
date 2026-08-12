import { formatCurrency, formatUnits } from './formatters'
import type { CustomerDashboardData } from '../hooks/useCustomerDashboard'

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export interface DashboardDerived {
  monthlyBill: number
  monthlyUnits: number
  recommendedKw: number
  annualSavings: number
  lifetimeSavings: number
  systemCost: number
  paybackYears: number | null
  productionKwh: number | null
  roofSystemKw: number
  roiPercent: number | null
  readinessPercent: number
  completedSteps: number
  totalSteps: number
  activities: Array<{ id: string; label: string; date: string }>
}

export function deriveDashboard(data: CustomerDashboardData): DashboardDerived {
  const { bill, solar, roof, roi } = data.analysis
  const stats = data.stats || {}

  const monthlyBill = num(bill?.bill_amount) || num(stats.avg_bill)
  const monthlyUnits = num(bill?.monthly_units) || num(stats.avg_units)
  const recommendedKw = num(bill?.recommended_kw) || num(stats.avg_system_size)
  const monthlySavings = num(bill?.monthly_savings_rs)
  const annualSavings =
    monthlySavings * 12 ||
    num(bill?.annual_savings) ||
    num(roi?.annualSavings) ||
    num(roi?.annual_savings_rs)
  const systemCost = num(bill?.system_cost_rs) || num(roi?.systemCost)
  const lifetimeSavings =
    num(bill?.savings_25yr) ||
    num(roi?.lifetimeSavings) ||
    num(roi?.lifetime_savings_rs) ||
    annualSavings * 25
  const paybackYears =
    num(bill?.payback_years) || num(roi?.paybackYears) || num(roi?.payback_years) || null

  const productionKwh = solar?.productionKwh ? num(solar.productionKwh) : null
  const roofSystemKw = num(roof?.recommendedKw) || num(roof?.system_size_kw) || num(roof?.recommended_kw)
  const roiPercent = num(roi?.roi) || num(roi?.roiPercent) || null

  const completion = Object.values(data.journey).filter(Boolean).length
  const readinessPercent = Math.min(100, Math.round((completion / 4) * 100))

  const activities: Array<{ id: string; label: string; date: string }> = []
  if (bill || solar) activities.push({ id: 'ab', label: 'Electricity bill analyzed', date: new Date().toLocaleDateString() })
  if (roof) activities.push({ id: 'ar', label: 'Roof analysis completed', date: new Date().toLocaleDateString() })
  if (roi) activities.push({ id: 'aroi', label: 'ROI calculated', date: new Date().toLocaleDateString() })
  for (const b of data.recentBills.slice(0, 4)) {
    const stamp = b.created_at ? new Date(String(b.created_at)).toLocaleDateString() : new Date().toLocaleDateString()
    activities.push({ id: `rb-${b.id}`, label: `${b.billing_period || 'Bill'} analyzed`, date: stamp })
  }

  return {
    monthlyBill,
    monthlyUnits,
    recommendedKw,
    annualSavings,
    lifetimeSavings,
    systemCost,
    paybackYears,
    productionKwh,
    roofSystemKw,
    roiPercent,
    readinessPercent,
    completedSteps: completion,
    totalSteps: 4,
    activities,
  }
}

export const fmtINR = (n: number) => (n ? formatCurrency(n) : '—')
export const fmtUnits = (n: number) => (n ? formatUnits(n) : '—')