import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getUser } from '../../utils/referral'
import { fetchAllReportSources, invalidateCache } from '../services/report.service'
import { mapAllSources } from '../mappers/reportMapper'
import { aggregateReportItems } from '../utils/reportAggregator'
import type {
  ReportsCenterState,
  ReportItem,
  ReportFilters,
} from '../types/report.types'
import { DEFAULT_REPORT_SUMMARY, DEFAULT_REPORT_FILTERS } from '../types/report.types'

function initialState(): ReportsCenterState {
  return {
    summaryCards: DEFAULT_REPORT_SUMMARY,
    reportItems: [],
    history: [],
    loading: true,
    error: null,
    filters: { ...DEFAULT_REPORT_FILTERS },
    generatingTemplateId: null,
  }
}

export function useReportsCenter() {
  const user = getUser()
  const fetchRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<ReportsCenterState>(initialState)
  const [allItems, setAllItems] = useState<ReportItem[]>([])

  const loadData = useCallback(async () => {
    abortRef.current?.abort()
    if (!user?.email) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    fetchRef.current = true

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const sources = await fetchAllReportSources(user.email, controller.signal)

      if (controller.signal.aborted) {
        fetchRef.current = false
        return
      }

      const { summaryCards, reportItems } = mapAllSources(sources)

      const hasError = Object.values(sources.errors).some((e) => e !== null)
      const errorState = hasError
        ? {
            hasError: true,
            sources: sources.errors,
            message: 'Some report data could not be loaded.',
          }
        : null

      setAllItems(reportItems)
      setState((prev) => ({
        ...prev,
        summaryCards,
        loading: false,
        error: errorState,
      }))
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        fetchRef.current = false
        return
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        error: {
          hasError: true,
          sources: {},
          message: err instanceof Error ? err.message : 'Failed to load report data.',
        },
      }))
    } finally {
      fetchRef.current = false
    }
  }, [user?.email])

  useEffect(() => {
    loadData()
    return () => {
      abortRef.current?.abort()
    }
  }, [loadData])

  const refresh = useCallback(() => {
    invalidateCache()
    setAllItems((prev) => [...prev])
    setState((prev) => ({ ...prev, filters: { ...DEFAULT_REPORT_FILTERS } }))
    loadData()
  }, [loadData])

  const setFilter = useCallback((filter: Partial<ReportFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filter },
    }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, search },
    }))
  }, [])

  const addHistoryItem = useCallback((item: import('../types/report.types').ReportHistoryItem) => {
    setState((prev) => ({
      ...prev,
      history: [item, ...prev.history].slice(0, 50),
    }))
  }, [])

  const setGeneratingTemplateId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, generatingTemplateId: id }))
  }, [])

  const aggregated = useMemo(
    () => aggregateReportItems(allItems, state.filters),
    [allItems, state.filters],
  )

  const visibleItems = useMemo(() => aggregated.visible, [aggregated.visible])
  const totalCount = useMemo(() => aggregated.total, [aggregated.total])

  return {
    reportItems: visibleItems,
    totalCount,
    summaryCards: state.summaryCards,
    history: state.history,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    generatingTemplateId: state.generatingTemplateId,
    refresh,
    setFilter,
    setSearch,
    addHistoryItem,
    setGeneratingTemplateId,
  }
}
