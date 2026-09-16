export type RefreshHandler = () => Promise<boolean>

const REFRESH_TIMEOUT_MS = 10000
const MAX_REFRESH_ATTEMPTS = 1

let refreshHandler: RefreshHandler | null = null
let refreshPromise: Promise<boolean> | null = null
let refreshInFlight = false
let attempts = 0
let pendingQueue: Array<() => void> = []

export const refreshManager = {
  /** Register the actual token-refresh callable. Wired when the backend exists. */
  setRefreshHandler(handler: RefreshHandler | null): void {
    refreshHandler = handler
  },

  isRefreshing(): boolean {
    return refreshInFlight
  },

  getRefreshPromise(): Promise<boolean> | null {
    return refreshPromise
  },

  canRetry(): boolean {
    return attempts < MAX_REFRESH_ATTEMPTS
  },

  getAttemptCount(): number {
    return attempts
  },

  getQueuedCount(): number {
    return pendingQueue.length
  },

  /** Single-flight refresh. At most one refresh request may ever be in flight. */
  refresh(): Promise<boolean> {
    if (refreshPromise) return refreshPromise

    if (!refreshHandler) {
      return Promise.resolve(false)
    }

    refreshInFlight = true
    attempts += 1

    let timerId: ReturnType<typeof setTimeout> | null = null
    refreshPromise = (async () => {
      const timeout = new Promise<boolean>((resolve) => {
        timerId = setTimeout(() => resolve(false), REFRESH_TIMEOUT_MS)
      })
      const result = await Promise.race([refreshHandler!(), timeout])
      if (timerId) clearTimeout(timerId)
      return result
    })().finally(() => {
      if (timerId) clearTimeout(timerId)
      refreshInFlight = false
      refreshPromise = null
    })

    return refreshPromise
  },

  /** Re-run every request that was paused while a refresh was in flight. */
  drainQueue(): void {
    const pending = pendingQueue
    pendingQueue = []
    pending.forEach((resume) => resume())
  },

  reset(): void {
    attempts = 0
    refreshInFlight = false
    refreshPromise = null
    pendingQueue = []
  },
}

export const PROACTIVE_REFRESH_FRACTION = 0.7

export interface ProactiveRefreshScheduler {
  schedule(ttlMs: number, onRefresh: () => void): () => void
}

export const proactiveRefreshScheduler: ProactiveRefreshScheduler = {
  schedule(ttlMs, onRefresh) {
    if (!ttlMs || ttlMs <= 0) return () => {}

    const delay = Math.max(1000, Math.round(ttlMs * PROACTIVE_REFRESH_FRACTION))
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        onRefresh()
      } else {
        timer = setTimeout(tick, 30000)
      }
    }

    timer = setTimeout(tick, delay)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  },
}
