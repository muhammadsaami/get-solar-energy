import { getUserStorageKey, type IdentifiableUser } from './userStorage'
import { getUser } from './referral'
import type { AnalyticsResponse } from '../types/rewards.types'

const LEGACY_GLOBAL_KEY = 'lastRewardsData'

function currentUser(): IdentifiableUser | null {
  try {
    return (getUser() as unknown as IdentifiableUser | null) ?? null
  } catch {
    return null
  }
}

function scopedKey(user?: IdentifiableUser | null): string {
  return getUserStorageKey('lastRewardsData', user ?? currentUser())
}

function purgeLegacyGlobalKey(): void {
  // A legacy global value carries no trustworthy ownership: never migrate it
  // into any account. Remove it so it cannot hydrate another customer's state.
  try {
    if (localStorage.getItem(LEGACY_GLOBAL_KEY) !== null) {
      localStorage.removeItem(LEGACY_GLOBAL_KEY)
    }
  } catch {
    /* noop */
  }
}

export function saveRewardsToLocalStorage(data: AnalyticsResponse, user?: IdentifiableUser | null): void {
  try {
    localStorage.setItem(scopedKey(user), JSON.stringify(data))
  } catch {
    /* storage full or unavailable */
  }
}

export function loadRewardsFromLocalStorage(user?: IdentifiableUser | null): AnalyticsResponse | null {
  try {
    const raw = localStorage.getItem(scopedKey(user))
    if (!raw) {
      purgeLegacyGlobalKey()
      return null
    }
    const parsed = JSON.parse(raw) as AnalyticsResponse
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(scopedKey(user))
      return null
    }
    return parsed
  } catch {
    try {
      localStorage.removeItem(scopedKey(user))
    } catch {
      /* noop */
    }
    return null
  }
}

export function clearRewardsFromLocalStorage(user?: IdentifiableUser | null): void {
  try {
    localStorage.removeItem(scopedKey(user))
    purgeLegacyGlobalKey()
  } catch {
    /* noop */
  }
}
