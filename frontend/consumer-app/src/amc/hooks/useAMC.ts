import { useState, useEffect, useCallback, useRef } from 'react'
import { getUser } from '../../utils/referral'
import { fetchAllAMCSources, fetchAMCRecommendation, getDefaultRecommendationRequest, invalidateAMCCache } from '../services/amc.service'
import { aggregateAMCData } from '../aggregators/amcAggregator'
import type { AMCState, AMCRecommendationRequest, TabId } from '../types/amc.types'
import { INITIAL_AMC_STATE } from '../types/amc.types'
import { STALE_AFTER_MS } from '../config/amc.config'

export function useAMC() {
  const user = getUser()
  const abortRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<AMCState>(INITIAL_AMC_STATE)

  const loadData = useCallback(async () => {
    abortRef.current?.abort()

    if (!user?.email) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const sources = await fetchAllAMCSources(controller.signal)

      if (controller.signal.aborted) return

      const aggregated = aggregateAMCData(sources.contract, null)

      const hasError = Object.values(sources.errors).some((e) => e !== null)
      const errorState = hasError
        ? { hasError: true, message: 'Some AMC data could not be loaded.' }
        : null

      setState((prev) => ({
        ...prev,
        contract: aggregated.contract,
        kpis: aggregated.kpis,
        serviceHistory: aggregated.serviceHistory,
        visits: aggregated.visits,
        loading: false,
        error: errorState,
        tab: 'overview',
        lastUpdated: new Date().toISOString(),
        stale: false,
      }))
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: {
          hasError: true,
          message: err instanceof Error ? err.message : 'Failed to load AMC data.',
        },
      }))
    }
  }, [user?.email])

  useEffect(() => {
    loadData()
    return () => {
      abortRef.current?.abort()
    }
  }, [loadData])

  const refresh = useCallback(() => {
    invalidateAMCCache()
    loadData()
  }, [loadData])

  const getRecommendation = useCallback(async (overrides?: Partial<AMCRecommendationRequest>) => {
    const controller = new AbortController()

    setState((prev) => ({ ...prev, recommending: true }))

    try {
      const defaults = getDefaultRecommendationRequest()
      const request: AMCRecommendationRequest = {
        customer_name: defaults.customer_name || 'Customer',
        city: defaults.city || '',
        system_size_kw: defaults.system_size_kw || 5.0,
        installation_date: overrides?.installation_date || '2022-01-01',
        last_service_date: overrides?.last_service_date || '',
        current_generation_units: defaults.current_generation_units || 0,
        expected_generation_units: defaults.expected_generation_units || 0,
        inverter_error_codes: overrides?.inverter_error_codes || 'None',
        panel_cleaning_done: overrides?.panel_cleaning_done ?? false,
        physical_damage_observed: overrides?.physical_damage_observed ?? false,
        damage_details: overrides?.damage_details || 'None',
        ...overrides,
      }

      const raw = await fetchAMCRecommendation(request, controller.signal)

      if (controller.signal.aborted) return

      if (raw?.success) {
        setState((prev) => {
          const aggregated = aggregateAMCData(
            prev.contract as Parameters<typeof aggregateAMCData>[0],
            raw,
          )
          return {
            ...prev,
            recommendation: aggregated.recommendation,
            recommending: false,
            tab: 'recommendation',
          }
        })
      } else {
        setState((prev) => ({
          ...prev,
          recommending: false,
          error: { hasError: true, message: raw?.error || 'Recommendation failed.' },
        }))
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return
      setState((prev) => ({
        ...prev,
        recommending: false,
        error: {
          hasError: true,
          message: err instanceof Error ? err.message : 'Recommendation request failed.',
        },
      }))
    }
  }, [])

  const setTab = useCallback((tab: TabId) => {
    setState((prev) => ({ ...prev, tab }))
  }, [])

  const isStale = state.lastUpdated
    ? Date.now() - new Date(state.lastUpdated).getTime() > STALE_AFTER_MS
    : false

  return {
    contract: state.contract,
    kpis: state.kpis,
    recommendation: state.recommendation,
    serviceHistory: state.serviceHistory,
    visits: state.visits,
    loading: state.loading,
    recommending: state.recommending,
    tab: state.tab,
    error: state.error,
    stale: isStale,
    refresh,
    getRecommendation,
    setTab,
  }
}
