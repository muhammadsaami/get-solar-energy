import api from './api/client'
import { readUserStorage, type IdentifiableUser } from '../utils/userStorage'

export interface AnalysisSlots {
  bill: Record<string, unknown> | null
  solar: Record<string, unknown> | null
  roof: Record<string, unknown> | null
  roi: Record<string, unknown> | null
  roiChart: Array<Record<string, unknown>>
}

export const customerDashboardService = {
  async loadDashboard() {
    const [statsRes, billsRes, analyticsRes] = await Promise.all([
      api.get('/dashboard/stats').catch(() => null),
      api.get('/dashboard/recent-bills').catch(() => null),
      api.get('/dashboard/analytics').catch(() => null),
    ])
    return {
      stats: statsRes?.data || {},
      recentBills: Array.isArray(billsRes?.data) ? billsRes.data : [],
      analytics: analyticsRes?.data || {},
    }
  },

  /**
   * Reads analysis data strictly scoped to the authenticated customer user.
   * If the user is unauthenticated or has not completed an analysis,
   * all slots return null/empty, guaranteeing no cross-user data leakage.
   */
  readLocalAnalysis(user?: IdentifiableUser | null): AnalysisSlots {
    if (!user || (!user.id && !user.email)) {
      return {
        bill: null,
        solar: null,
        roof: null,
        roi: null,
        roiChart: [],
      }
    }

    const bill = readUserStorage<Record<string, unknown>>('lastBillAnalysis', user)
    const solar = readUserStorage<Record<string, unknown>>('lastSolarProduction', user)
    const roof = readUserStorage<Record<string, unknown>>('lastRoofAnalysis', user)
    const roiState = readUserStorage<{
      result?: Record<string, unknown> | null
      formData?: Record<string, unknown>
      chartData?: Array<Record<string, unknown>>
    }>('roiAnalysisState', user)

    return {
      bill,
      solar,
      roof,
      roi: roiState?.result || null,
      roiChart: Array.isArray(roiState?.chartData) ? roiState.chartData : [],
    }
  },

  /**
   * Derives journey checklist completion strictly from verified customer analysis slots.
   * Fresh customer without analysis starts at 0/5 (all false).
   */
  deriveJourney(slots: AnalysisSlots) {
    const hasValidBill = Boolean(
      (slots.bill && (Number(slots.bill.bill_amount) > 0 || Number(slots.bill.monthly_units) > 0 || Number(slots.bill.recommended_kw) > 0)) ||
      (slots.solar && (Number(slots.solar.productionKwh) > 0 || Number(slots.solar.system_size_kw) > 0))
    )

    const hasValidRoof = Boolean(
      slots.roof && (Number(slots.roof.recommendedKw) > 0 || Number(slots.roof.system_size_kw) > 0 || Number(slots.roof.roof_area_sqft) > 0 || Number(slots.roof.area_sqft) > 0)
    )

    const hasValidRoi = Boolean(
      slots.roi && (Number(slots.roi.annualSavings) > 0 || Number(slots.roi.annual_savings) > 0 || Number(slots.roi.paybackPeriod) > 0 || Number(slots.roi.netCost) > 0)
    )

    return {
      bill: hasValidBill,
      roof: hasValidRoof,
      roi: hasValidRoi,
      proposal: false,
      installation: false,
    }
  },
}