import api from '../../services/api/client'
import { getUser } from '../../utils/referral'
import type {
  AMCApiContract,
  AMCRecommendationApiResponse,
  AMCRecommendationRequest,
} from '../types/amc.types'

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
): Promise<T | null> {
  try {
    return await fetchWithCache(key, () => retryFetch(fetcher, 2))
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

function getDefaultRecommendationRequest(): Partial<AMCRecommendationRequest> {
  const billAnalysis = readLocalStorageAnalysis<{
    customer_name?: string
    city?: string
    system_size_kw?: number
    monthly_generation_units?: number
    [key: string]: unknown
  }>('lastBillAnalysis')

  const user = getUser() as { email: string; name: string; referral_code: string; city?: string } | null

  return {
    customer_name: user?.name || billAnalysis?.customer_name || 'Customer',
    city: user?.city || billAnalysis?.city || '',
    system_size_kw: billAnalysis?.system_size_kw || 5.0,
    current_generation_units: billAnalysis?.monthly_generation_units || 0,
    expected_generation_units: billAnalysis?.monthly_generation_units
      ? Math.round(billAnalysis.monthly_generation_units * 1.1)
      : 0,
  }
}

export async function fetchAMCRecommendation(
  request: AMCRecommendationRequest,
  signal?: AbortSignal,
): Promise<AMCRecommendationApiResponse | null> {
  const cacheKey = `amc-recommendation-${request.customer_name}-${request.system_size_kw}`

  try {
    const cached = getCached<AMCRecommendationApiResponse>(cacheKey)
    if (cached) return cached

    const { data } = await api.post<AMCRecommendationApiResponse>(
      '/amc-recommendation',
      request,
      { signal },
    )

    setCache(cacheKey, data)
    return data
  } catch {
    return null
  }
}

async function lookupCustomerId(): Promise<number | null> {
  const user = getUser()
  if (!user?.email) return null

  try {
    const { data: customers } = await api.get<Array<{ id: number; email?: string; customer_name?: string }>>('/customers', {
      params: { skip: 0, limit: 100 },
    })

    if (!customers || !Array.isArray(customers)) return null

    const match = customers.find(
      (c) => c.email?.toLowerCase() === user.email.toLowerCase(),
    )
    return match?.id ?? null
  } catch {
    return null
  }
}

export async function fetchAMCContract(
  signal?: AbortSignal,
): Promise<AMCApiContract | null> {
  const customerId = await lookupCustomerId()
  if (!customerId) return null

  return safeFetch(
    `amc-contract-${customerId}`,
    async () => {
      const { data: response } = await api.get<{ success: boolean; data?: AMCApiContract; message?: string }>(
        `/crm/customers/${customerId}/amc`,
        { signal },
      )
      return response.data ?? null
    },
  )
}

export async function updateAMCContract(
  contractData: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<AMCApiContract | null> {
  const customerId = await lookupCustomerId()
  if (!customerId) return null

  try {
    const { data: response } = await api.put<{ success: boolean; data?: AMCApiContract }>(
      `/crm/customers/${customerId}/amc`,
      contractData,
      { signal },
    )
    clearCache()
    return response.data ?? null
  } catch {
    return null
  }
}

export async function fetchAllAMCSources(
  signal?: AbortSignal,
): Promise<{
  contract: AMCApiContract | null
  errors: Record<string, string | null>
}> {
  const errors: Record<string, string | null> = {}

  const contract = await fetchAMCContract(signal)

  return { contract, errors }
}

export function invalidateAMCCache(): void {
  clearCache()
}

export { getDefaultRecommendationRequest }
