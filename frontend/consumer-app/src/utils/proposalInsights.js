/**
 * Deterministic local proposal math shared by proposal surfaces.
 * Mirrors the customer Proposal page formulas exactly (no AI, no backend).
 */
export function computeProposalInsights({ recommendedKw, electricityRate, roofArea, monthlyBill }) {
  const kw = parseFloat(recommendedKw) || 0
  const rate = parseFloat(electricityRate) || 8.0
  const area = parseFloat(roofArea) || 0
  const monthlyGen = kw * 4.5 * 30
  const annualGen = monthlyGen * 12
  const monthlySavings = monthlyGen * rate
  const annualSavings = monthlySavings * 12
  const systemCost = kw * 52000
  const subsidy = kw === 0 ? 0 : kw <= 2 ? kw * 30000 : kw <= 3 ? 60000 + (kw - 2) * 18000 : 78000
  const netCost = Math.max(0, systemCost - subsidy)
  const payback = annualSavings > 0 ? (netCost / annualSavings).toFixed(1) : '—'
  const lifetimeSavings = annualSavings > 0 ? annualSavings * 25 - netCost : 0
  const co2 = (annualGen * 0.00082).toFixed(2)
  const trees = Math.round(annualGen * 0.045)
  const panels = kw > 0 ? Math.ceil((kw * 1000) / 540) : 0

  const monthlyCurve = [
    { month: 'Jan', gen: Math.round(monthlyGen * 0.95), savings: Math.round(monthlyGen * 0.95 * rate) },
    { month: 'Feb', gen: Math.round(monthlyGen * 1.05), savings: Math.round(monthlyGen * 1.05 * rate) },
    { month: 'Mar', gen: Math.round(monthlyGen * 1.20), savings: Math.round(monthlyGen * 1.20 * rate) },
    { month: 'Apr', gen: Math.round(monthlyGen * 1.25), savings: Math.round(monthlyGen * 1.25 * rate) },
    { month: 'May', gen: Math.round(monthlyGen * 1.30), savings: Math.round(monthlyGen * 1.30 * rate) },
    { month: 'Jun', gen: Math.round(monthlyGen * 1.10), savings: Math.round(monthlyGen * 1.10 * rate) },
    { month: 'Jul', gen: Math.round(monthlyGen * 0.75), savings: Math.round(monthlyGen * 0.75 * rate) },
    { month: 'Aug', gen: Math.round(monthlyGen * 0.70), savings: Math.round(monthlyGen * 0.70 * rate) },
    { month: 'Sep', gen: Math.round(monthlyGen * 0.85), savings: Math.round(monthlyGen * 0.85 * rate) },
    { month: 'Oct', gen: Math.round(monthlyGen * 1.05), savings: Math.round(monthlyGen * 1.05 * rate) },
    { month: 'Nov', gen: Math.round(monthlyGen * 0.95), savings: Math.round(monthlyGen * 0.95 * rate) },
    { month: 'Dec', gen: Math.round(monthlyGen * 0.90), savings: Math.round(monthlyGen * 0.90 * rate) },
  ]

  return {
    kw, rate, area, monthlyGen, annualGen, monthlySavings, annualSavings,
    systemCost, subsidy, netCost, payback, lifetimeSavings, co2, trees, panels, monthlyCurve,
    avgMonthlyBill: parseFloat(monthlyBill) || 0,
    highestConsumptionMonth: null,
  }
}
