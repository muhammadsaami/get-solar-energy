import { useState, useEffect, useCallback, useRef } from 'react'
import { getUser } from '../../utils/referral'
import { fetchAllPerformanceSources, invalidatePerformanceCache } from '../services/performance.service'
import { mapAllSources } from '../mappers/performanceMapper'
import { aggregatePerformance } from '../aggregators/performanceAggregator'
import type { PerformanceState, PerformancePerSourceErrors } from '../types/performance.types'
import { initialState, DEFAULT_SUMMARY, DEFAULT_CHARTS } from '../types/performance.types'
import { STALE_AFTER_MS } from '../config/performanceCharts'

export function useSystemPerformance() {
  const user = getUser()
  const abortRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<PerformanceState>(initialState)

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
      const sources = await fetchAllPerformanceSources(controller.signal)

      if (controller.signal.aborted) return

      const mapped = mapAllSources(
        sources.stats,
        sources.health?.data ?? null,
        sources.cachedAnalysis,
        sources.errors as unknown as PerformancePerSourceErrors,
      )

      const aggregated = aggregatePerformance(mapped)

      const hasError = Object.values(sources.errors).some((e) => e !== null)
      const errorState = hasError
        ? {
            hasError: true,
            sources: sources.errors as Record<string, string | null>,
            message: 'Some performance data could not be loaded.',
          }
        : null

      setState((prev) => ({
        ...prev,
        summary: aggregated.summary,
        charts: aggregated.charts,
        loading: false,
        error: errorState,
        lastUpdated: aggregated.lastUpdated,
        stale: false,
      }))
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: {
          hasError: true,
          sources: {},
          message: err instanceof Error ? err.message : 'Failed to load performance data.',
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
    invalidatePerformanceCache()
    loadData()
  }, [loadData])

  const isStale = state.lastUpdated
    ? Date.now() - new Date(state.lastUpdated).getTime() > STALE_AFTER_MS
    : false

  return {
    summary: state.summary,
    charts: state.charts,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    stale: state.stale || isStale,
    refresh,
  }
}
