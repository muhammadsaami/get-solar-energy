import { useEffect, useState } from 'react'
import { customerDashboardService } from '../services/customerDashboard.service'
import { useNotificationStore } from '../stores/notificationStore'

export interface CustomerDashboardData {
  ready: boolean
  loading: boolean
  error: string | null
  stats: Record<string, unknown>
  analytics: Record<string, unknown>
  recentBills: Array<Record<string, unknown>>
  analysis: {
    bill: Record<string, unknown> | null
    solar: Record<string, unknown> | null
    roof: Record<string, unknown> | null
    roi: Record<string, unknown> | null
    roiChart: Array<Record<string, unknown>>
  }
  journey: {
    bill: boolean
    roof: boolean
    roi: boolean
    proposal: boolean
    installation: boolean
  }
}

const EMPTY_ANALYSIS = { bill: null, solar: null, roof: null, roi: null, roiChart: [] }
const EMPTY_JOURNEY = { bill: false, roof: false, roi: false, proposal: false, installation: false }

const EMPTY: CustomerDashboardData = {
  ready: false,
  loading: true,
  error: null,
  stats: {},
  analytics: {},
  recentBills: [],
  analysis: EMPTY_ANALYSIS,
  journey: EMPTY_JOURNEY,
}

export function useCustomerDashboard(refreshKey = 0): CustomerDashboardData {
  const [state, setState] = useState<CustomerDashboardData>(EMPTY)
  const addToast = useNotificationStore((s) => s.addToast)

  useEffect(() => {
    let active = true
    async function load() {
      const slots = customerDashboardService.readLocalAnalysis()
      const journey = customerDashboardService.deriveJourney(slots)
      setState((prev) => ({ ...prev, loading: true, ready: false, error: null }))
      try {
        const result = await customerDashboardService.loadDashboard()
        if (!active) return
        setState({
          loading: false,
          ready: true,
          error: null,
          stats: (result.stats as Record<string, unknown>) || {},
          analytics: (result.analytics as Record<string, unknown>) || {},
          recentBills: result.recentBills,
          analysis: slots,
          journey,
        })
      } catch {
        if (!active) return
        setState({
          ...EMPTY,
          loading: false,
          error: 'Dashboard data is temporarily unavailable.',
        })
        addToast({ type: 'error', message: 'Could not refresh dashboard metrics.' })
      }
    }
    load()
    return () => {
      active = false
    }
  }, [refreshKey, addToast])

  return state
}