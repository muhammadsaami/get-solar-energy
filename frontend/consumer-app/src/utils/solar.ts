export interface EstimateResult {
  recommendedSize: number
  monthlySavings: number
  annualSavings: number
  paybackYears: number
}

export function calculateEstimate(
  _city: string,
  monthlyBill: number,
): EstimateResult {
  const recommendedSize = Math.max(
    1,
    Math.round((monthlyBill / 1600) * 2) / 2,
  )
  const monthlySavings = Math.round(monthlyBill * 0.9)
  const annualSavings = monthlySavings * 12
  const paybackYears = parseFloat((4 + recommendedSize * 0.15).toFixed(1))
  return { recommendedSize, monthlySavings, annualSavings, paybackYears }
}

export function calculateSubsidy(kW: number): number {
  if (kW <= 2) return Math.round(kW * 30000)
  if (kW <= 3) return 60000 + Math.round((kW - 2) * 18000)
  return 78000
}

export function formatInrCompact(amount: number): string {
  if (amount >= 100000) {
    return '\u20B9' + (amount / 100000).toFixed(1) + ' L'
  }
  return '\u20B9' + Math.round(amount).toLocaleString('en-IN')
}

export function calculateLifetimeReturn(annualSavings: number): number {
  return Math.round(annualSavings * 25 * 0.82)
}
