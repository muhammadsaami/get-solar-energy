import api from '../../services/api/client'

interface HealthApiResponse {
  success: boolean
  data?: {
    health_score?: number
    inverter_health?: number
    panel_health?: number
    battery_health?: number
    wiring_health?: number
    generation_drop_pct?: number
    issues?: string[]
    [key: string]: unknown
  }
  message?: string
}

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

function readLocalStorageAnalysis<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function fetchDashboardStats(
  signal?: AbortSignal,
): Promise<Record<string, unknown> | null> {
  return safeFetch(
    'perf-dashboard-stats',
    async () => {
      const { data } = await api.get<Record<string, unknown>>('/dashboard/stats', { signal })
      return data
    },
    signal,
  )
}

export async function fetchRecentBills(
  limit = 20,
  signal?: AbortSignal,
): Promise<unknown[] | null> {
  return safeFetch(
    `perf-recent-bills-${limit}`,
    async () => {
      const { data } = await api.get<unknown[]>('/dashboard/recent-bills', {
        params: { limit },
        signal,
      })
      return data
    },
    signal,
  )
}

export async function fetchHealthData(
  signal?: AbortSignal,
): Promise<HealthApiResponse | null> {
  const cachedAnalysis = readLocalStorageAnalysis<{
    health_score?: number
    system_size_kw?: number
    [key: string]: unknown
  }>('lastBillAnalysis')

  if (!cachedAnalysis) return null

  return safeFetch(
    'perf-amc-health',
    async () => {
      const { data } = await api.post<HealthApiResponse>(
        '/amc-recommendation',
        {
          system_size: cachedAnalysis.system_size_kw || 5.0,
          monthly_generation: cachedAnalysis.monthly_generation_units || 0,
          city: cachedAnalysis.city || 'Lucknow',
        },
        { signal },
      )
      return data
    },
    signal,
  )
}

export async function fetchGenerationFromCache(): Promise<Record<string, unknown> | null> {
  const billAnalysis = readLocalStorageAnalysis<Record<string, unknown>>('lastBillAnalysis')
  const roofAnalysis = readLocalStorageAnalysis<Record<string, unknown>>('lastRoofAnalysis')
  const roiAnalysis = readLocalStorageAnalysis<Record<string, unknown>>('roiAnalysisState')

  if (!billAnalysis && !roofAnalysis && !roiAnalysis) return null

  return {
    bill: billAnalysis,
    roof: roofAnalysis,
    roi: roiAnalysis,
  }
}

export async function fetchAlerts(
  signal?: AbortSignal,
): Promise<unknown[] | null> {
  return safeFetch(
    'perf-alerts',
    async () => {
      const { data } = await api.get<{ data?: unknown[] }>('/crm/alerts', { signal })
      return data?.data ?? null
    },
    signal,
  )
}

export async function fetchAllPerformanceSources(
  signal?: AbortSignal,
): Promise<{
  stats: Record<string, unknown> | null
  bills: unknown[] | null
  health: HealthApiResponse | null
  cachedAnalysis: Record<string, unknown> | null
  alerts: unknown[] | null
  errors: Record<string, string | null>
}> {
  const errors: Record<string, string | null> = {}

  const recordError = (source: string, result: unknown) => {
    errors[source] = result === null ? 'Failed to load' : null
  }

  const results = await Promise.allSettled([
    fetchDashboardStats(signal).then((r) => { recordError('stats', r); return r }),
    fetchRecentBills(20, signal).then((r) => { recordError('bills', r); return r }),
    fetchHealthData(signal).then((r) => { recordError('health', r); return r }),
    fetchAlerts(signal).then((r) => { recordError('alerts', r); return r }),
  ])

  const cachedAnalysis = await fetchGenerationFromCache()

  return {
    stats: results[0].status === 'fulfilled' ? results[0].value : null,
    bills: results[1].status === 'fulfilled' ? results[1].value : null,
    health: results[2].status === 'fulfilled' ? results[2].value : null,
    alerts: results[3].status === 'fulfilled' ? results[3].value : null,
    cachedAnalysis,
    errors,
  }
}

export function invalidatePerformanceCache(): void {
  clearCache()
}
