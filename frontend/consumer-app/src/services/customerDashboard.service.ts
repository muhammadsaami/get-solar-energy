import api from './api/client'

interface AnalysisSlots {
  bill: Record<string, unknown> | null
  solar: Record<string, unknown> | null
  roof: Record<string, unknown> | null
  roi: Record<string, unknown> | null
  roiChart: Array<Record<string, unknown>>
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readLS<T>(key: string): T | null {
  try {
    return safeParse<T>(localStorage.getItem(key))
  } catch {
    return null
  }
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

  readLocalAnalysis(): AnalysisSlots {
    const bill = readLS<Record<string, unknown>>('lastBillAnalysis')
    const solar = readLS<Record<string, unknown>>('lastSolarProduction')
    const roof = readLS<Record<string, unknown>>('lastRoofAnalysis')
    const roiState = readLS<{
      result?: Record<string, unknown> | null
      formData?: Record<string, unknown>
      chartData?: Array<Record<string, unknown>>
    }>('roiAnalysisState')
    return {
      bill,
      solar,
      roof,
      roi: roiState?.result || null,
      roiChart: Array.isArray(roiState?.chartData) ? roiState.chartData : [],
    }
  },

  deriveJourney(slots: AnalysisSlots) {
    return {
      bill: Boolean(slots.bill || slots.solar),
      roof: Boolean(slots.roof),
      roi: Boolean(slots.roi),
      proposal: false,
      installation: false,
    }
  },
}