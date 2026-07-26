import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getUser } from '../../utils/referral'
import { fetchAllSources, invalidateCache } from '../services/activity.service'
import { mapAllSources } from '../mappers/activityMapper'
import { aggregateActivities } from '../utils/activityAggregator'
import type {
  ActivityCenterState,
  ActivityFilters,
  ActivityItem,
  ActivityPagination,
  PerSourceErrors,
} from '../types/activity.types'
import { DEFAULT_FILTERS, DEFAULT_PAGINATION, DEFAULT_SUMMARY } from '../types/activity.types'

function initialState(): ActivityCenterState {
  return {
    activities: [],
    summaryCards: DEFAULT_SUMMARY,
    alerts: [],
    loading: true,
    error: null,
    filters: { ...DEFAULT_FILTERS },
    pagination: { ...DEFAULT_PAGINATION },
  }
}

export function useActivityCenter() {
  const user = getUser()
  const fetchRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<ActivityCenterState>(initialState)
  const [allItems, setAllItems] = useState<ActivityItem[]>([])

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
      const sources = await fetchAllSources(user.email, controller.signal)

      if (controller.signal.aborted) {
        fetchRef.current = false
        return
      }

      const { activities, alerts, summaryCards } = mapAllSources(sources)

      const hasError = Object.values(sources.errors).some((e) => e !== null)
      const errorState = hasError
        ? {
            hasError: true,
            sources: sources.errors as PerSourceErrors,
            message: 'Some activity data could not be loaded.',
          }
        : null

      setAllItems(activities)
      setState((prev) => ({
        ...prev,
        summaryCards,
        alerts,
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
          message: err instanceof Error ? err.message : 'Failed to load activity data.',
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
    setState((prev) => ({ ...prev, pagination: { ...DEFAULT_PAGINATION } }))
    loadData()
  }, [loadData])

  const setFilter = useCallback((filter: Partial<ActivityFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filter },
      pagination: { ...prev.pagination, page: 1 },
    }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, search },
      pagination: { ...prev.pagination, page: 1 },
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }))
  }, [])

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (prev.pagination.isLoadingMore || !prev.pagination.hasMore) return prev
      return {
        ...prev,
        pagination: { ...prev.pagination, page: prev.pagination.page + 1, isLoadingMore: true },
      }
    })
  }, [])

  const pagination: ActivityPagination = useMemo(
    () => ({
      ...state.pagination,
    }),
    [state.pagination.page, state.pagination.limit, state.pagination.isLoadingMore],
  )

  const aggregated = useMemo(
    () => aggregateActivities(allItems, state.filters, pagination),
    [allItems, state.filters, pagination],
  )

  const visibleActivities = useMemo(() => aggregated.visible, [aggregated.visible])
  const totalCount = useMemo(() => aggregated.total, [aggregated.total])
  const hasMore = useMemo(() => aggregated.hasMore, [aggregated.hasMore])

  const resultPagination: ActivityPagination = useMemo(
    () => ({
      ...pagination,
      total: totalCount,
      hasMore: hasMore || pagination.isLoadingMore,
    }),
    [pagination, totalCount, hasMore],
  )

  return {
    activities: visibleActivities,
    summaryCards: state.summaryCards,
    alerts: state.alerts,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    pagination: resultPagination,
    refresh,
    setFilter,
    setSearch,
    setPage,
    loadMore,
  }
}
