export interface EstimateResult {
  recommendedSize: number
  monthlySavings: number
  annualSavings: number
  paybackYears: number
  systemCost: number
  subsidy: number
  netCost: number
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
  const systemCost = Math.round(recommendedSize * 55000)
  const subsidy = calculateSubsidy(recommendedSize)
  const netCost = Math.max(0, systemCost - subsidy)
  const paybackYears = annualSavings > 0
    ? parseFloat((netCost / annualSavings).toFixed(1))
    : parseFloat((4 + recommendedSize * 0.15).toFixed(1))
  return { recommendedSize, monthlySavings, annualSavings, paybackYears, systemCost, subsidy, netCost }
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

export interface FallbackROIInput {
  monthlyBill: number
  systemSize: number
}

export interface FallbackROIResult {
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

export function calculateFallbackROI(input: FallbackROIInput): FallbackROIResult {
  const { monthlyBill, systemSize } = input

  const systemCost = systemSize * 55000

  let governmentSubsidy = 0
  if (systemSize >= 3) {
    governmentSubsidy = 78000
  } else if (systemSize >= 2) {
    governmentSubsidy = 60000 + Math.round((systemSize - 2) * 18000)
  } else {
    governmentSubsidy = Math.round(systemSize * 30000)
  }

  const netCost = systemCost - governmentSubsidy
  const monthlySavings = Math.round(monthlyBill * 0.9)
  const annualSavings = monthlySavings * 12
  const monthlyGeneration = systemSize * 4.5 * 30
  const annualGeneration = Math.round(monthlyGeneration * 12)

  const paybackPeriod = annualSavings > 0
    ? parseFloat((netCost / annualSavings).toFixed(1))
    : 0

  const lifetimeSavings = Math.round((annualSavings * 25) - netCost)
  const roiPercentage = netCost > 0
    ? parseFloat((((lifetimeSavings - netCost) / netCost) * 100).toFixed(1))
    : 0

  const co2Reduction = parseFloat((annualGeneration * 0.82 / 1000).toFixed(2))

  return {
    recommendedKw: systemSize,
    systemCost,
    governmentSubsidy,
    netCost,
    monthlySavings,
    annualSavings,
    annualGeneration,
    paybackPeriod,
    lifetimeSavings,
    roiPercentage,
    co2Reduction,
  }
}
