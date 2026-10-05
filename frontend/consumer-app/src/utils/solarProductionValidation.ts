import type {
  ManualSolarFormState,
  ManualSolarValidationErrors,
  ManualSolarReadingPayload,
  SolarReportingPeriodType,
} from '../types/solarProduction.types'
import type { SolarReportData } from '../hooks/billAnalyzer.types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Validates a YYYY-MM-DD date string strictly.
 */
export function isValidDateString(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false
  const trimmed = val.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) return false
  const y = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const d = parseInt(match[3], 10)
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false

  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/**
 * Validates solar production manual entry form state.
 * Implements Step 4, Step 5, Step 8 validation rules.
 */
export function validateManualSolarInput(
  state: ManualSolarFormState
): ManualSolarValidationErrors {
  const errors: ManualSolarValidationErrors = {}

  // 1. Period Enum validation
  const validPeriods: SolarReportingPeriodType[] = [
    'day',
    'week',
    'month',
    'year',
    'lifetime',
    'custom',
  ]
  if (!validPeriods.includes(state.periodType)) {
    errors.periodType = 'Please select a valid reporting period.'
  }

  // 2. Production validation (Strict numeric, finite, >= 0, reject NaN / Infinity / negative)
  const rawProd = state.productionKwh.trim()
  if (!rawProd) {
    errors.productionKwh = 'Solar production reading is required.'
  } else {
    const prodNum = Number(rawProd)
    if (isNaN(prodNum) || !isFinite(prodNum)) {
      errors.productionKwh = 'Production reading must be a valid finite number.'
    } else if (prodNum < 0) {
      errors.productionKwh = 'Solar production reading cannot be negative.'
    }
  }

  // 3. Installed Capacity (Optional, but if provided must be numeric, finite, > 0)
  const rawCap = state.installedCapacityKwp.trim()
  if (rawCap) {
    const capNum = Number(rawCap)
    if (isNaN(capNum) || !isFinite(capNum)) {
      errors.installedCapacityKwp = 'Installed capacity must be a valid number.'
    } else if (capNum <= 0) {
      errors.installedCapacityKwp = 'Installed capacity must be greater than 0 kWp.'
    }
  }

  // 4. Period-specific date validations
  switch (state.periodType) {
    case 'day': {
      if (!isValidDateString(state.date)) {
        errors.date = 'Please enter a valid reading date (YYYY-MM-DD).'
      }
      break
    }
    case 'week': {
      if (!isValidDateString(state.weekStartDate)) {
        errors.startDate = 'Week start date is required (YYYY-MM-DD).'
      }
      if (!isValidDateString(state.weekEndDate)) {
        errors.endDate = 'Week end date is required (YYYY-MM-DD).'
      }
      if (
        isValidDateString(state.weekStartDate) &&
        isValidDateString(state.weekEndDate)
      ) {
        if (state.weekStartDate > state.weekEndDate) {
          errors.endDate = 'Week end date cannot be earlier than week start date.'
        }
      }
      break
    }
    case 'month': {
      if (!state.month || !MONTH_NAMES.includes(state.month)) {
        errors.startDate = 'Please select a valid calendar month.'
      }
      const yearNum = parseInt(state.year, 10)
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        errors.endDate = 'Please enter a valid 4-digit year (e.g. 2026).'
      }
      break
    }
    case 'year': {
      const yearNum = parseInt(state.year, 10)
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        errors.endDate = 'Please enter a valid 4-digit year (e.g. 2026).'
      }
      break
    }
    case 'lifetime': {
      if (!isValidDateString(state.lifetimeAsOfDate)) {
        errors.date = 'Please enter a valid "As of" date for lifetime production.'
      }
      break
    }
    case 'custom': {
      if (!isValidDateString(state.customStartDate)) {
        errors.startDate = 'Start date is required.'
      }
      if (!isValidDateString(state.customEndDate)) {
        errors.endDate = 'End date is required.'
      }
      if (
        isValidDateString(state.customStartDate) &&
        isValidDateString(state.customEndDate)
      ) {
        if (state.customStartDate > state.customEndDate) {
          errors.endDate = 'Start date cannot be after end date.'
        }
      }
      break
    }
  }

  // 5. Daily points validation (if provided)
  if (state.dailyPoints && state.dailyPoints.length > 0) {
    for (let i = 0; i < state.dailyPoints.length; i++) {
      const pt = state.dailyPoints[i]
      if (!isValidDateString(pt.date)) {
        errors.dailyPoints = `Reading #${i + 1} has an invalid date.`
        break
      }
      if (isNaN(pt.productionKwh) || !isFinite(pt.productionKwh) || pt.productionKwh < 0) {
        errors.dailyPoints = `Reading #${i + 1} must be a valid non-negative number.`
        break
      }
    }
  }

  return errors
}

/**
 * Builds the canonical payload from valid form state.
 */
export function buildCanonicalSolarPayload(
  state: ManualSolarFormState
): ManualSolarReadingPayload {
  const prodKwh = Math.round(Number(state.productionKwh) * 100) / 100
  const capKwp = state.installedCapacityKwp.trim()
    ? Math.round(Number(state.installedCapacityKwp) * 100) / 100
    : null

  let startDate = ''
  let endDate = ''
  let month: string | null = null
  let year: string | number | null = null

  switch (state.periodType) {
    case 'day': {
      startDate = state.date
      endDate = state.date
      const parts = state.date.split('-')
      year = parts[0]
      month = MONTH_NAMES[parseInt(parts[1], 10) - 1] || null
      break
    }
    case 'week': {
      startDate = state.weekStartDate
      endDate = state.weekEndDate
      const parts = state.weekStartDate.split('-')
      year = parts[0]
      month = MONTH_NAMES[parseInt(parts[1], 10) - 1] || null
      break
    }
    case 'month': {
      month = state.month
      year = state.year
      const mIdx = MONTH_NAMES.indexOf(state.month)
      const mPad = String(mIdx + 1).padStart(2, '0')
      startDate = `${state.year}-${mPad}-01`
      const lastDay = new Date(Date.UTC(parseInt(state.year, 10), mIdx + 1, 0)).getUTCDate()
      endDate = `${state.year}-${mPad}-${String(lastDay).padStart(2, '0')}`
      break
    }
    case 'year': {
      year = state.year
      month = null
      startDate = `${state.year}-01-01`
      endDate = `${state.year}-12-31`
      break
    }
    case 'lifetime': {
      endDate = state.lifetimeAsOfDate
      startDate = 'All-Time'
      const parts = state.lifetimeAsOfDate.split('-')
      year = parts[0]
      month = null
      break
    }
    case 'custom': {
      startDate = state.customStartDate
      endDate = state.customEndDate
      const parts = state.customStartDate.split('-')
      year = parts[0]
      month = MONTH_NAMES[parseInt(parts[1], 10) - 1] || null
      break
    }
  }

  return {
    periodType: state.periodType,
    startDate,
    endDate,
    productionKwh: prodKwh,
    installedCapacityKwp: capKwp,
    month,
    year,
    dailyPoints: state.dailyPoints.length > 0 ? state.dailyPoints : null,
    source: 'manual',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Returns formatted period summary text.
 */
export function formatPeriodSummary(payload: {
  periodType?: SolarReportingPeriodType | null
  startDate?: string | null
  endDate?: string | null
  month?: string | null
  year?: string | number | null
}): string {
  const pType = payload.periodType || 'month'
  switch (pType) {
    case 'day':
      return `Day · ${payload.startDate || '—'}`
    case 'week':
      return `Week · ${payload.startDate || '—'} to ${payload.endDate || '—'}`
    case 'month':
      return `Month · ${payload.month || '—'} ${payload.year || ''}`.trim()
    case 'year':
      return `Year · ${payload.year || '—'}`
    case 'lifetime':
      return `Lifetime (as of ${payload.endDate || 'today'})`
    case 'custom':
      return `Custom · ${payload.startDate || '—'} to ${payload.endDate || '—'}`
    default:
      return `${payload.month || ''} ${payload.year || ''}`.trim() || '—'
  }
}

/**
 * Converts canonical payload to SolarReportData
 */
export function toSolarReportData(payload: ManualSolarReadingPayload): SolarReportData {
  let dailyGen: number | null = null
  if (payload.dailyPoints && payload.dailyPoints.length > 0) {
    const totalDaily = payload.dailyPoints.reduce((s, p) => s + (p.productionKwh || 0), 0)
    dailyGen = Math.round((totalDaily / payload.dailyPoints.length) * 100) / 100
  } else if (payload.periodType === 'day') {
    dailyGen = payload.productionKwh
  } else if (payload.periodType === 'month' && payload.productionKwh != null) {
    dailyGen = Math.round((payload.productionKwh / 30) * 10) / 10
  }

  return {
    productionKwh: payload.productionKwh,
    systemSizeKw: payload.installedCapacityKwp,
    month: payload.month || null,
    year: payload.year || null,
    periodType: payload.periodType,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    source: 'manual',
    dailyGenerationKwh: dailyGen,
  }
}

/**
 * Consolidated validator returning { isValid, errors, data }
 */
export function validateSolarProductionInput(state: ManualSolarFormState): {
  isValid: boolean
  errors: ManualSolarValidationErrors
  data?: SolarReportData
} {
  const errors = validateManualSolarInput(state)
  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors }
  }
  const payload = buildCanonicalSolarPayload(state)
  return {
    isValid: true,
    errors: {},
    data: toSolarReportData(payload),
  }
}

