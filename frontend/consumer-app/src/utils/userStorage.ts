/**
 * User-Scoped Storage Utility
 * Ensures all customer-specific client-side analyses, drafts, and caches
 * are strictly isolated by authenticated user ID (with email fallback),
 * preventing data bleed across sessions, accounts, and new registrations.
 */

export interface IdentifiableUser {
  id?: string | number | null
  email?: string | null
}

const LEGACY_GLOBAL_KEYS = [
  'lastBillAnalysis',
  'lastRoofAnalysis',
  'roiAnalysisState',
  'lastSolarProduction',
  'solar_bill_analysis',
  'solar_roof_analysis',
  'solarChatHistory',
  'enterpriseAIHistory',
  'enterpriseAISessionId',
  'lastGeneratedAmc',
  'lastRewardsData',
  'userPreferences',
  'notifications',
  'activityLog',
  'honestbite_access_token',
  'honestbite_refresh_token',
  'current_stage_id',
  'solar_estimate_bill',
  'solar_estimate_city',
  'gse_customer_profile_extras',
  'get-solar-energy.location',
  'get-solar-energy.saved-locations',
]

/**
 * Derives a canonical, storage-safe user identifier.
 * Prioritizes stable authenticated user ID, falling back to normalized email.
 */
export function getUserKey(user?: IdentifiableUser | null): string {
  if (!user) return 'anon'
  if (user.id !== undefined && user.id !== null && String(user.id).trim() !== '') {
    return `id_${String(user.id).trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`
  }
  if (user.email && typeof user.email === 'string' && user.email.trim() !== '') {
    return `em_${user.email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}`
  }
  return 'anon'
}

/**
 * Returns a user-scoped localStorage key.
 * Example: `gse_u_id_9ca2538e_lastBillAnalysis`
 */
export function getUserStorageKey(key: string, user?: IdentifiableUser | null): string {
  const userKey = getUserKey(user)
  return `gse_u_${userKey}_${key}`
}

/**
 * Reads a typed JSON object or primitive from user-scoped storage.
 */
export function readUserStorage<T>(key: string, user?: IdentifiableUser | null, fallback?: T): T | null {
  try {
    const storageKey = getUserStorageKey(key, user)
    const raw = localStorage.getItem(storageKey)
    if (raw === null || raw === undefined) return fallback ?? null
    try {
      const parsed = JSON.parse(raw)
      return (parsed === null ? (fallback ?? null) : parsed) as T
    } catch {
      return (raw as unknown) as T
    }
  } catch {
    return fallback ?? null
  }
}

/**
 * Writes a typed object to user-scoped storage.
 */
export function writeUserStorage(key: string, data: unknown, user?: IdentifiableUser | null): void {
  try {
    const storageKey = getUserStorageKey(key, user)
    if (data === null || data === undefined) {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, JSON.stringify(data))
    }
  } catch {
    // Silently ignore storage quota/access errors
  }
}

/**
 * Removes a specific key from user-scoped storage.
 */
export function removeUserStorage(key: string, user?: IdentifiableUser | null): void {
  try {
    const storageKey = getUserStorageKey(key, user)
    localStorage.removeItem(storageKey)
  } catch {
    // Silently ignore storage errors
  }
}

/**
 * Purges all legacy un-scoped analysis keys from localStorage so old
 * test/demo/previous runs never bleed into fresh or existing sessions.
 */
export function clearLegacyGlobalAnalysisKeys(): void {
  try {
    for (const key of LEGACY_GLOBAL_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Purges all storage keys scoped to a specific user.
 */
export function clearActiveUserStorage(user?: IdentifiableUser | null): void {
  try {
    if (!user) return
    const userKey = getUserKey(user)
    const prefix = `gse_u_${userKey}_`
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    for (const k of keysToRemove) {
      localStorage.removeItem(k)
    }
  } catch {
    // Ignore storage errors
  }
}
