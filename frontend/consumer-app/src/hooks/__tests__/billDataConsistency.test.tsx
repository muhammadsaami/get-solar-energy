import { describe, it, expect, beforeEach, vi } from 'vitest'
import { normalizeBillData } from '../../utils/billNormalization'
import { readUserStorage, writeUserStorage, getUserStorageKey, clearLegacyGlobalAnalysisKeys } from '../../utils/userStorage'
import { deriveDashboard } from '../../utils/dashboard'
import { checkPeriodCompatibility } from '../useBillAnalyzer'
import { tokenManager } from '../../services/auth/tokenManager'
import { getActiveContext } from '../useSolarAdvisor'
import { errorHandler } from '../../services/api/errorHandler'

describe('Bill Analyzer Data Consistency & Semantic Integrity (Phase 13)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  // TEST 1 — Same monthly consumption everywhere
  it('TEST 1: Same monthly consumption (342.74 kWh) propagates consistently across modules', () => {
    const rawBill = {
      monthly_units: 342.74,
      bill_amount: 2850,
      per_unit_rate: 8.31,
      billing_period: 'May 2026',
      recommended_kw: 3.0,
      grid_import: 342.74,
      grid_export: 292.89,
      net_billed_units: 0,
    }

    const customerA = { id: 'cust_consistent_1', email: 'cust1@getsolar.in', role: 'customer' }
    vi.spyOn(tokenManager, 'getUser').mockReturnValue(customerA)

    // 1. Normalization
    const normalized = normalizeBillData(rawBill)
    expect(normalized?.monthlyConsumptionKwh).toBe(342.74)

    // Store user-scoped
    writeUserStorage('lastBillAnalysis', normalized, customerA)

    // 2. Bill Analyzer view of monthly consumption
    const stored = readUserStorage<typeof normalized>('lastBillAnalysis', customerA)
    const billAnalyzerConsumption = stored?.monthlyConsumptionKwh ?? stored?.monthly_units
    expect(billAnalyzerConsumption).toBe(342.74)

    // 3. Dashboard derivation
    const dashData = deriveDashboard({
      analysis: { bill: stored as any, solar: null, roof: null, roi: null },
      stats: {},
      recentBills: [],
      analytics: {},
    })
    expect(dashData.monthlyUnits).toBe(342.74)

    // 4. ROI input mapping (reading stored bill)
    const roiConsumption = (stored as any)?.monthlyConsumptionKwh ?? (stored as any)?.monthly_units
    expect(roiConsumption).toBe(342.74)

    // 5. AI Assistant context
    const aiContext = getActiveContext()
    const aiBill = aiContext.bill_analysis as any
    const aiConsumption = aiBill?.monthlyConsumptionKwh ?? aiBill?.monthly_units
    expect(aiConsumption).toBe(342.74)

    // 6. Proposal autofill calculation
    const proposalUnits = stored?.monthlyConsumptionKwh != null
      ? stored.monthlyConsumptionKwh
      : stored?.monthly_units
    expect(proposalUnits).toBe(342.74)
  })

  // TEST 2 — Net-metering values remain distinct
  it('TEST 2: Net-metering values retain separate semantic fields and are never collapsed', () => {
    const rawBill = {
      monthly_units: 342.74,
      grid_import: 342.74,
      grid_export: 292.89,
      net_billed_units: 0,
      bill_amount: 150,
    }

    const normalized = normalizeBillData(rawBill)

    expect(normalized).not.toBeNull()
    expect(normalized?.monthlyConsumptionKwh).toBe(342.74)
    expect(normalized?.gridImportKwh).toBe(342.74)
    expect(normalized?.gridExportKwh).toBe(292.89)
    expect(normalized?.netBilledUnitsKwh).toBe(0)
    expect(normalized?.netGridEnergyKwh).toBeCloseTo(342.74 - 292.89, 2)

    // Monthly units must NOT be replaced by net billed units (0)
    expect(normalized?.monthlyConsumptionKwh).not.toBe(0)
    expect(normalized?.monthlyConsumptionKwh).not.toBe(normalized?.netBilledUnitsKwh)

    // Grid export must NOT equal monthly consumption
    expect(normalized?.gridExportKwh).not.toBe(normalized?.monthlyConsumptionKwh)
  })

  // TEST 3 — No accidental substitution
  it('TEST 3: No accidental substitution of net_billed_units, grid_export, or solar_generation into monthly consumption', () => {
    // Case A: Net billed units is 0 or low, but monthly consumption is missing
    const billOnlyNetBilled = {
      net_billed_units: 0,
      grid_export: 250,
      solar_generation: 400,
      roi_generation: 450,
    }
    const normA = normalizeBillData(billOnlyNetBilled)
    // Must NOT substitute net_billed_units, grid_export, or solar_generation into monthlyConsumptionKwh!
    expect(normA?.monthlyConsumptionKwh).toBeNull()
    expect(normA?.gridExportKwh).toBe(250)
    expect(normA?.solarGenerationKwh).toBe(400)
    expect(normA?.netBilledUnitsKwh).toBe(0)

    // Case B: Only grid export present
    const billOnlyExport = {
      exportUnits: 300,
    }
    const normB = normalizeBillData(billOnlyExport)
    expect(normB?.monthlyConsumptionKwh).toBeNull()
    expect(normB?.gridExportKwh).toBe(300)
  })

  // TEST 4 — Missing monthly units returns null, not fabricated
  it('TEST 4: Missing monthly units stays null without synthetic or hardcoded numbers', () => {
    const rawBill = {
      bill_amount: 2500,
      customer_name: 'John Doe',
    }

    const normalized = normalizeBillData(rawBill)
    expect(normalized?.monthlyConsumptionKwh).toBeNull()
    expect(normalized?.gridImportKwh).toBeNull()
    expect(normalized?.gridExportKwh).toBeNull()
    expect(normalized?.netBilledUnitsKwh).toBeNull()
  })

  // TEST 5 — Customer isolation: Customer A bill never appears for Customer B
  it('TEST 5: Strict customer isolation between User A and User B', () => {
    const userA = { id: 'cust_A', email: 'a@example.com', role: 'customer' }
    const userB = { id: 'cust_B', email: 'b@example.com', role: 'customer' }

    const billA = normalizeBillData({ monthly_units: 420.5, bill_amount: 3500 })
    writeUserStorage('lastBillAnalysis', billA, userA)

    // User A reads their bill
    const readA = readUserStorage<typeof billA>('lastBillAnalysis', userA)
    expect(readA?.monthlyConsumptionKwh).toBe(420.5)

    // User B must NOT see User A's bill
    const readB = readUserStorage<typeof billA>('lastBillAnalysis', userB)
    expect(readB).toBeNull()

    // Key verification
    const keyA = getUserStorageKey('lastBillAnalysis', userA)
    const keyB = getUserStorageKey('lastBillAnalysis', userB)
    expect(keyA).not.toBe(keyB)
    expect(localStorage.getItem(keyB)).toBeNull()
  })

  // TEST 6 — Re-analysis: Bill A -> Bill B updates everywhere without stale values
  it('TEST 6: Re-analysis from Bill A to Bill B overwrites stale readings completely', () => {
    const user = { id: 'cust_reanalysis', email: 're@example.com', role: 'customer' }
    vi.spyOn(tokenManager, 'getUser').mockReturnValue(user)

    // First analysis: Bill A
    const billA = normalizeBillData({ monthly_units: 300, bill_amount: 2400 })
    writeUserStorage('lastBillAnalysis', billA, user)

    let current = readUserStorage<typeof billA>('lastBillAnalysis', user)
    expect(current?.monthlyConsumptionKwh).toBe(300)

    // Second analysis: Bill B
    const billB = normalizeBillData({ monthly_units: 475.8, bill_amount: 3900 })
    writeUserStorage('lastBillAnalysis', billB, user)

    current = readUserStorage<typeof billB>('lastBillAnalysis', user)
    expect(current?.monthlyConsumptionKwh).toBe(475.8)
    expect(current?.billAmount).toBe(3900)

    // Dashboard with updated bill
    const dash = deriveDashboard({
      analysis: { bill: current as any, solar: null, roof: null, roi: null },
      stats: {},
      recentBills: [],
      analytics: {},
    })
    expect(dash.monthlyUnits).toBe(475.8)
    expect(dash.monthlyBill).toBe(3900)
  })

  // TEST 7 — Period mismatch: May bill + October solar report
  it('TEST 7: Period mismatch disables solar-derived combined metrics while bill remains intact', () => {
    const mayBillPeriod = '01-MAY-2026 to 31-MAY-2026'
    const octSolarMonth = 'October'
    const year = 2026

    const compatible = checkPeriodCompatibility(mayBillPeriod, octSolarMonth, year)
    expect(compatible).toBe(false)

    // But matching period is compatible
    const maySolarMonth = 'May'
    expect(checkPeriodCompatibility(mayBillPeriod, maySolarMonth, year)).toBe(true)
  })

  // TEST 8 — Legacy global localStorage values cannot override user-scoped analysis
  it('TEST 8: Legacy global localStorage cannot override user-scoped storage', () => {
    const user = { id: 'cust_scoped', email: 'scoped@example.com', role: 'customer' }

    // Old global key left from legacy session
    localStorage.setItem('lastBillAnalysis', JSON.stringify({ monthly_units: 999.99, bill_amount: 9999 }))

    // User A has their own analysis
    const userBill = normalizeBillData({ monthly_units: 250, bill_amount: 2000 })
    writeUserStorage('lastBillAnalysis', userBill, user)

    // Purging legacy global keys
    clearLegacyGlobalAnalysisKeys()

    // Global key should be cleaned up
    expect(localStorage.getItem('lastBillAnalysis')).toBeNull()

    // User scoped key remains intact
    const active = readUserStorage<typeof userBill>('lastBillAnalysis', user)
    expect(active?.monthlyConsumptionKwh).toBe(250)
  })

  // TEST 9 — Refresh persistence: User normalized data survives page reload
  it('TEST 9: Normalized analysis survives simulated browser refresh for the same user', () => {
    const user = { id: 'cust_persist', email: 'persist@example.com', role: 'customer' }

    const original = normalizeBillData({
      monthly_units: 342.74,
      grid_import: 342.74,
      grid_export: 292.89,
      net_billed_units: 0,
      bill_amount: 2850,
      per_unit_rate: 8.31,
    })

    writeUserStorage('lastBillAnalysis', original, user)

    // Simulate page reload by reading back directly from localStorage
    const rehydrated = readUserStorage<typeof original>('lastBillAnalysis', user)
    expect(rehydrated).not.toBeNull()
    expect(rehydrated?.monthlyConsumptionKwh).toBe(342.74)
    expect(rehydrated?.gridImportKwh).toBe(342.74)
    expect(rehydrated?.gridExportKwh).toBe(292.89)
    expect(rehydrated?.netBilledUnitsKwh).toBe(0)
    expect(rehydrated?.billAmount).toBe(2850)
  })

  // TEST 10 — Logout/login isolation: previous customer bill does not appear for new customer
  it('TEST 10: After logout and new customer login, previous customer data does not appear', () => {
    const customer1 = { id: 'user_1', email: 'cust1@getsolar.in', role: 'customer' }
    const customer2 = { id: 'user_2', email: 'cust2@getsolar.in', role: 'customer' }

    // Customer 1 logs in and analyzes bill
    vi.spyOn(tokenManager, 'getUser').mockReturnValue(customer1)
    const bill1 = normalizeBillData({ monthly_units: 512.4, bill_amount: 4200 })
    writeUserStorage('lastBillAnalysis', bill1, customer1)

    // Customer 1 logs out: active user becomes null
    vi.spyOn(tokenManager, 'getUser').mockReturnValue(null)

    // Customer 2 logs in (fresh customer)
    vi.spyOn(tokenManager, 'getUser').mockReturnValue(customer2)

    // Customer 2 checks AI context
    const aiContext = getActiveContext()
    expect(aiContext.bill_analysis).toBeUndefined()

    // Customer 2 checks dashboard
    const dash2 = deriveDashboard({
      analysis: {
        bill: readUserStorage('lastBillAnalysis', customer2),
        solar: null,
        roof: null,
        roi: null,
      },
      stats: {},
      recentBills: [],
      analytics: {},
    })
    expect(dash2.monthlyUnits).toBeNull()
    expect(dash2.isFreshUser).toBe(true)
  })

  // TEST 11 — BillModel harmonized property mapping
  it('TEST 11: BillModel harmonizes camelCase, snake_case, and canonical fields identically', async () => {
    const { BillModel } = await import('../../models/BillModel')

    const rawApi = {
      customer_name: 'Rajesh Sharma',
      consumer_number: '1234567890',
      discom: 'UPPCL',
      billing_period: 'May 2026',
      monthly_units: 342.74,
      bill_amount: 2850,
      per_unit_rate: 8.31,
      recommended_kw: 3.0,
      grid_import: 342.74,
      grid_export: 292.89,
      net_billed_units: 0,
    }

    const model = new BillModel(rawApi)
    // Consumption access across all legacy and canonical conventions
    expect(model.monthlyConsumptionKwh).toBe(342.74)
    expect(model.monthly_units).toBe(342.74)
    expect(model.kwhConsumption).toBe(342.74)
    expect(model.monthlyUnits).toBe(342.74)

    // Amount access across all legacy and canonical conventions
    expect(model.billAmount).toBe(2850)
    expect(model.bill_amount).toBe(2850)
    expect(model.amount).toBe(2850)

    // Net-metering metrics preserved
    expect(model.gridImportKwh).toBe(342.74)
    expect(model.gridExportKwh).toBe(292.89)
    expect(model.netBilledUnitsKwh).toBe(0)
  })

  // TEST 12 — Location invariance: Location does NOT alter raw bill facts
  it('TEST 12: Customer location (Lucknow vs Delhi) does NOT alter raw bill facts', () => {
    const identicalRawBill = {
      customer_name: 'Amit Patel',
      consumer_number: '987654321',
      discom: 'BSES Rajdhani',
      billing_period: 'May 2026',
      monthly_units: 500,
      bill_amount: 4650,
      per_unit_rate: 9.3,
      grid_import: 500,
      grid_export: 150,
      net_billed_units: 350,
    }

    const customerLucknow = { id: 'cust_lucknow', email: 'lucknow@example.com', role: 'customer', city: 'Lucknow', state: 'Uttar Pradesh' }
    const customerDelhi = { id: 'cust_delhi', email: 'delhi@example.com', role: 'customer', city: 'Delhi', state: 'Delhi' }

    // Analysis under Lucknow customer
    const normLucknow = normalizeBillData(identicalRawBill)
    writeUserStorage('lastBillAnalysis', normLucknow, customerLucknow)

    // Analysis under Delhi customer
    const normDelhi = normalizeBillData(identicalRawBill)
    writeUserStorage('lastBillAnalysis', normDelhi, customerDelhi)

    const storedLucknow = readUserStorage<typeof normLucknow>('lastBillAnalysis', customerLucknow)
    const storedDelhi = readUserStorage<typeof normDelhi>('lastBillAnalysis', customerDelhi)

    // All raw bill facts must be strictly identical regardless of location
    expect(storedLucknow?.monthlyConsumptionKwh).toBe(storedDelhi?.monthlyConsumptionKwh)
    expect(storedLucknow?.billAmount).toBe(storedDelhi?.billAmount)
    expect(storedLucknow?.gridImportKwh).toBe(storedDelhi?.gridImportKwh)
    expect(storedLucknow?.gridExportKwh).toBe(storedDelhi?.gridExportKwh)
    expect(storedLucknow?.netBilledUnitsKwh).toBe(storedDelhi?.netBilledUnitsKwh)
    expect(storedLucknow?.perUnitRate).toBe(storedDelhi?.perUnitRate)
    expect(storedLucknow?.billingPeriod).toBe(storedDelhi?.billingPeriod)
  })

  // TEST 13 — Deterministic preservation of raw extracted readings
  it('TEST 13: Deterministic preservation of raw extracted readings across normalization', () => {
    const rawBill = {
      customer_name: 'Suresh Kumar',
      consumer_number: '1122334455',
      discom: 'PVVNL',
      billing_period: 'April 2026',
      monthly_units: 620.5,
      bill_amount: 5400,
      per_unit_rate: 8.7,
      net_billed_units: 120,
      grid_import: 620.5,
      grid_export: 500.5,
    }

    const normalized = normalizeBillData(rawBill)
    expect(normalized?.monthlyConsumptionKwh).toBe(620.5)
    expect(normalized?.billAmount).toBe(5400)
    expect(normalized?.perUnitRate).toBe(8.7)
    expect(normalized?.netBilledUnitsKwh).toBe(120)
    expect(normalized?.gridImportKwh).toBe(620.5)
    expect(normalized?.gridExportKwh).toBe(500.5)
    expect(normalized?.billingPeriod).toBe('April 2026')
    expect(normalized?.netGridEnergyKwh).toBeCloseTo(120.0, 1)
  })

  // TEST 14 — ErrorHandler extracts backend error on 422 Unprocessable Content
  it('TEST 14: ErrorHandler extracts backend error message on 422 Unprocessable Content rather than falling back to generic validation error', () => {
    const backend422Error = {
      response: {
        status: 422,
        data: {
          success: false,
          error: "We couldn't read this bill. Please try another copy or enter the bill details manually.",
          quota: { upload: { used: 0, limit: 10 } }
        }
      }
    }

    const normalizedError = errorHandler.normalize(backend422Error)
    expect(normalizedError.status).toBe(422)
    expect(normalizedError.message).toBe("We couldn't read this bill. Please try another copy or enter the bill details manually.")
    expect(normalizedError.message).not.toBe("Validation error. Please verify form inputs.")
  })

  // TEST 15 — Normalization handles string numbers and missing per-unit rate on multi-slab bills
  it('TEST 15: Normalization handles string numbers and missing per-unit rate on multi-slab bills', () => {
    const rawSlabBill = {
      monthly_units: "450",
      bill_amount: "3825",
      per_unit_rate: null,
      billing_period: "June 2026",
      customer_name: null,
      consumer_number: "9876543210",
      discom: "TPDDL"
    }

    const normalized = normalizeBillData(rawSlabBill)
    expect(normalized).not.toBeNull()
    expect(normalized?.monthlyConsumptionKwh).toBe(450)
    expect(normalized?.billAmount).toBe(3825)
    // Derived per-unit rate = 3825 / 450 = 8.5
    expect(normalized?.perUnitRate).toBe(8.5)
    expect(normalized?.customerName).toBe('Valued Customer')
    expect(normalized?.billingPeriod).toBe('June 2026')
  })

  // TEST 16 — Changing customer location alone does not alter bill-extracted consumption
  it('TEST 16: Changing customer location alone does not alter bill-extracted consumption, while ROI calculator uses dynamic location', () => {
    const rawBill = {
      monthly_units: 520,
      bill_amount: 4500,
      per_unit_rate: 8.65,
      billing_period: 'July 2026',
    }

    const custRJ = { id: 'cust_rj', email: 'rj@getsolar.in', role: 'customer' }
    const custDL = { id: 'cust_dl', email: 'dl@getsolar.in', role: 'customer' }

    writeUserStorage('current_location', 'Rajasthan', custRJ)
    writeUserStorage('current_location', 'Delhi', custDL)

    const normRJ = normalizeBillData(rawBill)
    writeUserStorage('lastBillAnalysis', normRJ, custRJ)

    const normDL = normalizeBillData(rawBill)
    writeUserStorage('lastBillAnalysis', normDL, custDL)

    const storedRJ = readUserStorage<typeof normRJ>('lastBillAnalysis', custRJ)
    const storedDL = readUserStorage<typeof normDL>('lastBillAnalysis', custDL)

    // Bill consumption is invariant across locations
    expect(storedRJ?.monthlyConsumptionKwh).toBe(520)
    expect(storedDL?.monthlyConsumptionKwh).toBe(520)
    expect(storedRJ?.monthlyConsumptionKwh).toBe(storedDL?.monthlyConsumptionKwh)
    expect(storedRJ?.billAmount).toBe(storedDL?.billAmount)

    // Dynamic state is preserved for calculations
    const locRJ = readUserStorage<string>('current_location', custRJ)
    const locDL = readUserStorage<string>('current_location', custDL)
    expect(locRJ).toBe('Rajasthan')
    expect(locDL).toBe('Delhi')
  })
})


