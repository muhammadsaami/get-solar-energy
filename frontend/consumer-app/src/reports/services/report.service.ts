import api from '../../services/api/client'
import type {
  DashboardStats,
  BillRecord,
  ApiSuccessResponse,
  ProjectItem,
} from '../../activities/types/activity.types'
import type { ReportSourceResult } from '../types/report.types'

const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS })
}

function clearCache(): void {
  cache.clear()
}

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached) return cached
  const data = await fetcher()
  setCache(key, data)
  return data
}

async function retryFetch<T>(
  fn: () => Promise<T>,
  retries = 2,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastError = err
      if (signal?.aborted) throw err
      const status = (err as { response?: { status?: number } })?.response?.status
      const isTransient = !status || status >= 500 || status === 429
      if (!isTransient || attempt === retries) throw err
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
    }
  }
  throw lastError
}

async function safeFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T | null> {
  try {
    return await fetchWithCache(key, () => retryFetch(fetcher, 2, signal), signal)
  } catch {
    return null
  }
}

async function fetchDashboardStats(signal?: AbortSignal): Promise<DashboardStats | null> {
  return safeFetch(
    'report-stats',
    async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats', { signal })
      return data
    },
    signal,
  )
}

async function fetchRecentBills(
  limit = 20,
  signal?: AbortSignal,
): Promise<BillRecord[] | null> {
  return safeFetch(
    `report-bills-${limit}`,
    async () => {
      const { data } = await api.get<BillRecord[]>('/dashboard/recent-bills', {
        params: { limit },
        signal,
      })
      return data
    },
    signal,
  )
}

async function fetchReferralSummary(
  email: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown> | null> {
  return safeFetch(
    `report-referral-${email}`,
    async () => {
      const { data } = await api.get<{ success: boolean }>(
        `/referral/summary/${encodeURIComponent(email)}`,
        { signal },
      )
      return data
    },
    signal,
  )
}

async function fetchProjectMetrics(signal?: AbortSignal): Promise<Record<string, unknown> | null> {
  return safeFetch(
    'report-project-metrics',
    async () => {
      const { data } = await api.get<ApiSuccessResponse<ProjectItem[]>>('/projects/metrics', {
        signal,
      })
      return data.data
    },
    signal,
  )
}

export async function fetchAllReportSources(
  email: string,
  signal?: AbortSignal,
): Promise<ReportSourceResult> {
  const errors: Record<string, string | null> = {}

  const recordError = (source: string, result: unknown) => {
    errors[source] = result === null ? 'Failed to load' : null
  }

  const results = await Promise.allSettled([
    fetchDashboardStats(signal).then((r) => { recordError('stats', r); return r }),
    fetchRecentBills(20, signal).then((r) => { recordError('bills', r); return r }),
    fetchReferralSummary(email, signal).then((r) => { recordError('referralSummary', r); return r }),
    fetchProjectMetrics(signal).then((r) => { recordError('projectMetrics', r); return r }),
  ])

  return {
    stats: results[0].status === 'fulfilled' ? results[0].value : null,
    bills: results[1].status === 'fulfilled' ? results[1].value : null,
    roi: null,
    referralSummary: results[2].status === 'fulfilled' ? results[2].value : null,
    projectMetrics: results[3].status === 'fulfilled' ? results[3].value : null,
    errors,
  }
}

export function invalidateCache(): void {
  clearCache()
}
