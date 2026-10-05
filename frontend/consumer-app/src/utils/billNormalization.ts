/**
 * Canonical Bill Normalization Layer
 * 
 * Enforces strict semantic boundaries across all GET Solar Energy components:
 * 1. Monthly Consumption (Billed Units) — electricity consumption reported by the utility bill.
 * 2. Grid Import — electricity imported from the utility grid (separate from consumption).
 * 3. Grid Export — solar electricity exported to the grid.
 * 4. Net Billed Units — units invoiced after solar net-metering credits (never replaces monthly consumption).
 * 5. Solar Generation — extracted from dedicated solar production reports or inverter (never inferred from bill consumption).
 * 6. Solar Surplus (Opening / Closing) — net-metering banking ledger credits.
 */

export interface NormalizedBillData {
  customerName: string
  consumerNumber: string
  discom: string
  billingPeriod: string

  // Authoritative energy metrics — strictly isolated
  monthlyConsumptionKwh: number | null
  gridImportKwh: number | null
  gridExportKwh: number | null
  netBilledUnitsKwh: number | null
  solarGenerationKwh: number | null
  openingSolarSurplusKwh: number | null
  closingSolarSurplusKwh: number | null
  netGridEnergyKwh: number | null

  // Financial metrics
  billAmount: number | null
  perUnitRate: number | null
  recommendedKw: number | null
  monthlySavingsRs: number | null
  systemCostRs: number | null
  paybackYears: number | null
  savings25YearsRs: number | null

  // Metadata
  isSolarConsumer: boolean
  source: 'upload' | 'manual' | 'api' | 'cache'
  confidence?: number | string | null
}

function safePositiveNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) && n > 0 ? n : null
}

function safeNonNegativeNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Normalizes raw or stored bill analysis data into the canonical semantic model.
 * Does NOT allow cross-metric fallback (e.g., consumption falling back to solar generation or grid export).
 */
export function normalizeBillData(
  raw: unknown,
  source: 'upload' | 'manual' | 'api' | 'cache' = 'api'
): NormalizedBillData | null {
  if (!raw || typeof raw !== 'object') return null

  const data = raw as Record<string, unknown>

  // 1. Monthly Consumption (Billed Units): strictly from consumption fields, never from export/generation/net-billed
  const monthlyConsumptionKwh =
    safePositiveNum(data.monthlyConsumptionKwh) ??
    safePositiveNum(data.monthly_units) ??
    safePositiveNum(data.monthlyUnits) ??
    safePositiveNum(data.units) ??
    safePositiveNum(data.kwhConsumption) ??
    null

  // 2. Grid Import: strictly from import fields. Never fabricated from monthly units.
  const gridImportKwh =
    safeNonNegativeNum(data.gridImportKwh) ??
    safeNonNegativeNum(data.grid_import) ??
    safeNonNegativeNum(data.gridImport) ??
    safeNonNegativeNum(data.import_units) ??
    safeNonNegativeNum(data.importUnits) ??
    safeNonNegativeNum(data.grid_import_kwh) ??
    null

  // 3. Grid Export: strictly from export fields
  const gridExportKwh =
    safeNonNegativeNum(data.gridExportKwh) ??
    safeNonNegativeNum(data.grid_export) ??
    safeNonNegativeNum(data.gridExport) ??
    safeNonNegativeNum(data.export_units) ??
    safeNonNegativeNum(data.exportUnits) ??
    safeNonNegativeNum(data.solar_export_units) ??
    safeNonNegativeNum(data.grid_export_kwh) ??
    null

  // 4. Net Billed Units: strictly from invoiced net-billed fields. Never replaces consumption.
  const netBilledUnitsKwh =
    safeNonNegativeNum(data.netBilledUnitsKwh) ??
    safeNonNegativeNum(data.net_billed_units) ??
    safeNonNegativeNum(data.netBilledUnits) ??
    null

  // 5. Solar Generation: strictly from solar production analysis or inverter
  const solarGenerationKwh =
    safePositiveNum(data.solarGenerationKwh) ??
    safePositiveNum(data.solar_generation_units) ??
    safePositiveNum(data.solar_generation) ??
    safePositiveNum(data.solarGeneratedUnits) ??
    safePositiveNum(data.productionKwh) ??
    null

  // 6. Net-metering surplus credits
  const openingSolarSurplusKwh =
    safeNonNegativeNum(data.openingSolarSurplusKwh) ??
    safeNonNegativeNum(data.opening_solar_surplus) ??
    safeNonNegativeNum(data.openingSolarSurplus) ??
    null

  const closingSolarSurplusKwh =
    safeNonNegativeNum(data.closingSolarSurplusKwh) ??
    safeNonNegativeNum(data.closing_solar_surplus) ??
    safeNonNegativeNum(data.closingSolarSurplus) ??
    null

  // Net Grid Energy: physical import minus export (only when both are known)
  const netGridEnergyKwh =
    gridImportKwh !== null && gridExportKwh !== null
      ? gridImportKwh - gridExportKwh
      : null

  // Financial fields
  const billAmount =
    safePositiveNum(data.billAmount) ??
    safePositiveNum(data.bill_amount) ??
    safePositiveNum(data.total_amount) ??
    safePositiveNum(data.amount) ??
    null

  const perUnitRate =
    safePositiveNum(data.perUnitRate) ??
    safePositiveNum(data.per_unit_rate) ??
    (billAmount && monthlyConsumptionKwh ? Math.round((billAmount / monthlyConsumptionKwh) * 100) / 100 : null)

  const recommendedKw =
    safePositiveNum(data.recommendedKw) ??
    safePositiveNum(data.recommended_kw) ??
    (monthlyConsumptionKwh ? Math.round((monthlyConsumptionKwh / 135) * 2) / 2 : null)

  const monthlySavingsRs =
    safePositiveNum(data.monthlySavingsRs) ??
    safePositiveNum(data.monthly_savings_rs) ??
    safePositiveNum(data.monthly_savings) ??
    (recommendedKw && perUnitRate ? Math.round(recommendedKw * 135 * perUnitRate) : null)

  const systemCostRs =
    safePositiveNum(data.systemCostRs) ??
    safePositiveNum(data.system_cost_rs) ??
    safePositiveNum(data.system_cost) ??
    (recommendedKw ? Math.round(recommendedKw * 55000) : null)

  const paybackYears =
    safePositiveNum(data.paybackYears) ??
    safePositiveNum(data.payback_years) ??
    (systemCostRs && monthlySavingsRs && monthlySavingsRs > 0 ? parseFloat((systemCostRs / (monthlySavingsRs * 12)).toFixed(1)) : null)

  const savings25YearsRs =
    data.savings_25_years_rs !== undefined && Number.isFinite(Number(data.savings_25_years_rs))
      ? Number(data.savings_25_years_rs)
      : (monthlySavingsRs && systemCostRs ? (monthlySavingsRs * 12 * 25) - systemCostRs : null)

  const isSolarConsumer = Boolean(
    data.isSolarConsumer ||
    gridImportKwh !== null ||
    gridExportKwh !== null ||
    solarGenerationKwh !== null ||
    netBilledUnitsKwh !== null
  )

  return {
    customerName: String(data.customer_name || data.customerName || 'Valued Customer'),
    consumerNumber: String(data.consumer_number || data.consumerNumber || ''),
    discom: String(data.discom || ''),
    billingPeriod: String(data.billing_period || data.billingPeriod || ''),
    monthlyConsumptionKwh,
    gridImportKwh,
    gridExportKwh,
    netBilledUnitsKwh,
    solarGenerationKwh,
    openingSolarSurplusKwh,
    closingSolarSurplusKwh,
    netGridEnergyKwh,
    billAmount,
    perUnitRate,
    recommendedKw,
    monthlySavingsRs,
    systemCostRs,
    paybackYears,
    savings25YearsRs,
    isSolarConsumer,
    source,
    confidence: (data.confidence ?? (data.extractionConfidence as Record<string, unknown>)?.score) ?? null,
  }
}
