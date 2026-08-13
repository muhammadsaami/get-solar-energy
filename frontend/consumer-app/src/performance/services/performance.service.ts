import api from '../../services/api/client'

export interface PlantSummaryItem {
  id: number
  capacity_kw: number
  inverter_brand?: string | null
  city: string
  status: string
  installed_at?: string | null
}

export interface PlantDashboardResponse {
  success: boolean
  plant_id: number
  capacity_kw: number
  status: string
  today_generation_kwh: number | null
  today_expected_kwh: number
  monthly_total_kwh: number
  monthly_expected_kwh: number
  unread_alerts: number
}

export interface PlantHealthResponse {
  success: boolean
  health_score: number | null
  status_label: string
  based_on_days: number
  message?: string
}

export interface PlantAlertItem {
  id: number
  alert_type: string
  severity: string
  message: string
  is_read: boolean
  created_at: string
}

const CACHE_TTL_MS = 2 * 60 * 1000

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

export function clearPerformanceCache(): void {
  cache.clear()
}

// ── Phase 4 Plant Monitoring APIs ──────────────────────────────────────────

export async function fetchMyPlants(signal?: AbortSignal): Promise<PlantSummaryItem[]> {
  const cached = getCached<PlantSummaryItem[]>('my-plants')
  if (cached) return cached

  try {
    const res = await api.get<{ success: boolean; plants: PlantSummaryItem[] }>('/plants/my', { signal })
    const plants = res.data?.plants || []
    setCache('my-plants', plants)
    return plants
  } catch {
    return []
  }
}

export async function fetchPlantDashboard(plantId: number, signal?: AbortSignal): Promise<PlantDashboardResponse | null> {
  const cacheKey = `plant-dash-${plantId}`
  const cached = getCached<PlantDashboardResponse>(cacheKey)
  if (cached) return cached

  try {
    const res = await api.get<PlantDashboardResponse>(`/plants/${plantId}/dashboard`, { signal })
    if (res.data?.success) {
      setCache(cacheKey, res.data)
      return res.data
    }
    return null
  } catch {
    return null
  }
}

export async function fetchPlantHealth(plantId: number, signal?: AbortSignal): Promise<PlantHealthResponse | null> {
  const cacheKey = `plant-health-${plantId}`
  const cached = getCached<PlantHealthResponse>(cacheKey)
  if (cached) return cached

  try {
    const res = await api.get<PlantHealthResponse>(`/plants/${plantId}/health-score`, { signal })
    if (res.data?.success) {
      setCache(cacheKey, res.data)
      return res.data
    }
    return null
  } catch {
    return null
  }
}

export async function fetchPlantAlerts(plantId: number, signal?: AbortSignal): Promise<PlantAlertItem[]> {
  try {
    const res = await api.get<{ success: boolean; alerts: PlantAlertItem[] }>(`/plants/${plantId}/alerts`, { signal })
    return res.data?.alerts || []
  } catch {
    return []
  }
}

export async function simulatePlantReading(plantId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post<{ success: boolean; message?: string }>(`/plants/${plantId}/simulate-reading`)
    clearPerformanceCache()
    return res.data
  } catch (err: any) {
    const msg = err.response?.data?.detail || err.message || 'Simulation error'
    return { success: false, message: msg }
  }
}

export async function markAlertAsRead(alertId: number): Promise<boolean> {
  try {
    const res = await api.patch<{ success: boolean }>(`/plants/alerts/${alertId}/read`)
    return !!res.data?.success
  } catch {
    return false
  }
}

// ── Legacy / Fallback Stats API ────────────────────────────────────────────

export async function fetchDashboardStats(signal?: AbortSignal): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/dashboard/stats', { signal })
    return data
  } catch {
    return null
  }
}

export async function fetchRecentBills(limit = 20, signal?: AbortSignal): Promise<unknown[] | null> {
  try {
    const { data } = await api.get<unknown[]>('/dashboard/recent-bills', { params: { limit }, signal })
    return data
  } catch {
    return null
  }
}

export function invalidatePerformanceCache(): void {
  clearPerformanceCache()
}
