import api from '../../services/api/client'
import type {
  ApiSuccessResponse,
  CrmTimelineEvent,
  CrmTask,
  CrmMeeting,
  CrmFollowUp,
  CrmAlert,
  DashboardStats,
  BillRecord,
  ReferralHistoryItem,
  WalletTransactionItem,
  ProjectItem,
} from '../types/activity.types'

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

export async function fetchCrmTimeline(
  customerId: number,
  signal?: AbortSignal,
): Promise<CrmTimelineEvent[] | null> {
  return safeFetch(
    `crmTimeline-${customerId}`,
    async () => {
      const { data } = await api.get<ApiSuccessResponse<CrmTimelineEvent[]>>(
        `/crm/timeline/${customerId}`,
        { signal },
      )
      return data.data
    },
    signal,
  )
}

export async function fetchCrmTasks(
  customerId?: number,
  signal?: AbortSignal,
): Promise<CrmTask[] | null> {
  return safeFetch(
    `crmTasks-${customerId ?? 'all'}`,
    async () => {
      const params = customerId ? { customer_id: customerId } : undefined
      const { data } = await api.get<ApiSuccessResponse<CrmTask[]>>('/crm/tasks', {
        params,
        signal,
      })
      return data.data
    },
    signal,
  )
}

export async function fetchCrmMeetings(
  customerId?: number,
  signal?: AbortSignal,
): Promise<CrmMeeting[] | null> {
  return safeFetch(
    `crmMeetings-${customerId ?? 'all'}`,
    async () => {
      const params = customerId ? { customer_id: customerId } : undefined
      const { data } = await api.get<ApiSuccessResponse<CrmMeeting[]>>('/crm/meetings', {
        params,
        signal,
      })
      return data.data
    },
    signal,
  )
}

export async function fetchCrmFollowups(
  customerId?: number,
  signal?: AbortSignal,
): Promise<CrmFollowUp[] | null> {
  return safeFetch(
    `crmFollowups-${customerId ?? 'all'}`,
    async () => {
      const params = customerId ? { customer_id: customerId } : undefined
      const { data } = await api.get<ApiSuccessResponse<CrmFollowUp[]>>('/crm/followups', {
        params,
        signal,
      })
      return data.data
    },
    signal,
  )
}

export async function fetchCrmAlerts(
  severity?: string,
  signal?: AbortSignal,
): Promise<CrmAlert[] | null> {
  return safeFetch(
    `crmAlerts-${severity ?? 'all'}`,
    async () => {
      const params = severity ? { severity } : undefined
      const { data } = await api.get<ApiSuccessResponse<CrmAlert[]>>('/crm/alerts', {
        params,
        signal,
      })
      return data.data
    },
    signal,
  )
}

export async function fetchDashboardStats(
  signal?: AbortSignal,
): Promise<DashboardStats | null> {
  return safeFetch(
    'dashboardStats',
    async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats', { signal })
      return data
    },
    signal,
  )
}

export async function fetchRecentBills(
  limit = 20,
  signal?: AbortSignal,
): Promise<BillRecord[] | null> {
  return safeFetch(
    `recentBills-${limit}`,
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

export async function fetchReferralHistory(
  email: string,
  signal?: AbortSignal,
): Promise<ReferralHistoryItem[] | null> {
  return safeFetch(
    `referralHistory-${email}`,
    async () => {
      const { data } = await api.get<{ success: boolean; referral_history: ReferralHistoryItem[] }>(
        `/referral/history/${encodeURIComponent(email)}`,
        { signal },
      )
      return data.referral_history ?? null
    },
    signal,
  )
}

export async function fetchWalletTransactions(
  email: string,
  signal?: AbortSignal,
): Promise<WalletTransactionItem[] | null> {
  return safeFetch(
    `walletTransactions-${email}`,
    async () => {
      const { data } = await api.get<{
        success: boolean
        transactions: WalletTransactionItem[]
      }>(`/referral/wallet/${encodeURIComponent(email)}`, { signal })
      return data.transactions ?? null
    },
    signal,
  )
}

export async function fetchProjects(
  signal?: AbortSignal,
): Promise<ProjectItem[] | null> {
  return safeFetch(
    'projects',
    async () => {
      const { data } = await api.get<ApiSuccessResponse<ProjectItem[]>>('/projects', {
        signal,
      })
      return data.data
    },
    signal,
  )
}

export function invalidateCache(): void {
  clearCache()
}

export interface SourceResult {
  timeline: CrmTimelineEvent[] | null
  tasks: CrmTask[] | null
  meetings: CrmMeeting[] | null
  followups: CrmFollowUp[] | null
  alerts: CrmAlert[] | null
  stats: DashboardStats | null
  bills: BillRecord[] | null
  referralHistory: ReferralHistoryItem[] | null
  walletTxns: WalletTransactionItem[] | null
  projects: ProjectItem[] | null
  errors: Record<string, string | null>
}

export async function fetchAllSources(
  email: string,
  signal?: AbortSignal,
): Promise<SourceResult> {
  const errors: Record<string, string | null> = {}

  const recordError = (source: string, result: unknown) => {
    errors[source] = result === null ? 'Failed to load' : null
  }

  const results = await Promise.allSettled([
    fetchCrmTimeline(1, signal).then((r) => { recordError('timeline', r); return r }),
    fetchCrmTasks(undefined, signal).then((r) => { recordError('tasks', r); return r }),
    fetchCrmMeetings(undefined, signal).then((r) => { recordError('meetings', r); return r }),
    fetchCrmFollowups(undefined, signal).then((r) => { recordError('followups', r); return r }),
    fetchCrmAlerts(undefined, signal).then((r) => { recordError('alerts', r); return r }),
    fetchDashboardStats(signal).then((r) => { recordError('stats', r); return r }),
    fetchRecentBills(20, signal).then((r) => { recordError('bills', r); return r }),
    fetchReferralHistory(email, signal).then((r) => { recordError('referralHistory', r); return r }),
    fetchWalletTransactions(email, signal).then((r) => { recordError('walletTxns', r); return r }),
    fetchProjects(signal).then((r) => { recordError('projects', r); return r }),
  ])

  return {
    timeline: results[0].status === 'fulfilled' ? results[0].value : null,
    tasks: results[1].status === 'fulfilled' ? results[1].value : null,
    meetings: results[2].status === 'fulfilled' ? results[2].value : null,
    followups: results[3].status === 'fulfilled' ? results[3].value : null,
    alerts: results[4].status === 'fulfilled' ? results[4].value : null,
    stats: results[5].status === 'fulfilled' ? results[5].value : null,
    bills: results[6].status === 'fulfilled' ? results[6].value : null,
    referralHistory: results[7].status === 'fulfilled' ? results[7].value : null,
    walletTxns: results[8].status === 'fulfilled' ? results[8].value : null,
    projects: results[9].status === 'fulfilled' ? results[9].value : null,
    errors,
  }
}
