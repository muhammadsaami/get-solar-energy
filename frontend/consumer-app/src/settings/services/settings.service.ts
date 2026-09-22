import type { SettingsPreferences } from '../types/settings.types'
import { DEFAULT_PREFERENCES, STORAGE_KEY, NOTIFICATIONS_KEY, ACTIVITY_LOG_KEY } from '../config/settings.config'
import { getUserStorageKey, type IdentifiableUser } from '../../utils/userStorage'
import { tokenManager } from '../../services/auth/tokenManager'

const LEGACY_GLOBAL_KEYS = [STORAGE_KEY, NOTIFICATIONS_KEY, ACTIVITY_LOG_KEY]

function currentUser(): IdentifiableUser | null {
  try {
    return (tokenManager.getUser() as IdentifiableUser | null) ?? null
  } catch {
    return null
  }
}

function scopedKey(base: string, user?: IdentifiableUser | null): string {
  return getUserStorageKey(base, user ?? currentUser())
}

function purgeLegacyGlobalKeys(): void {
  // Legacy global values carry no trustworthy ownership: never migrate them
  // into any account. Remove them so they cannot hydrate another customer's state.
  try {
    for (const key of LEGACY_GLOBAL_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    /* noop */
  }
}

export function loadPreferences(user?: IdentifiableUser | null): SettingsPreferences {
  try {
    const key = scopedKey(STORAGE_KEY, user)
    const raw = localStorage.getItem(key)
    if (!raw) {
      purgeLegacyGlobalKeys()
      return { ...DEFAULT_PREFERENCES }
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(key)
      return { ...DEFAULT_PREFERENCES }
    }
    const tariff = parsed.tariff !== undefined && parsed.tariff !== null
      ? (typeof parsed.tariff === 'number' ? parsed.tariff.toFixed(2) : String(parsed.tariff))
      : DEFAULT_PREFERENCES.tariff
    return {
      discom: parsed.discom ?? DEFAULT_PREFERENCES.discom,
      tariff,
      netMetering: parsed.netMetering ?? DEFAULT_PREFERENCES.netMetering,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(prefs: SettingsPreferences, user?: IdentifiableUser | null): void {
  try {
    localStorage.setItem(scopedKey(STORAGE_KEY, user), JSON.stringify(prefs))
    purgeLegacyGlobalKeys()
  } catch {
    /* storage full or unavailable */
  }
}

export function addActivityLog(type: string, title: string, description: string, user?: IdentifiableUser | null): void {
  try {
    const key = scopedKey(ACTIVITY_LOG_KEY, user)
    const raw = localStorage.getItem(key)
    let logs: Array<{ type: string; title: string; description: string; timestamp: string }> = []
    try {
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) logs = parsed
    } catch {
      logs = []
    }
    logs.unshift({
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 100)))
    purgeLegacyGlobalKeys()
  } catch {
    // silently fail — localStorage write is best-effort
  }
}

export function createNotification(category: string, title: string, message: string, user?: IdentifiableUser | null): void {
  try {
    const key = scopedKey(NOTIFICATIONS_KEY, user)
    const raw = localStorage.getItem(key)
    let notifications: Array<{ category: string; title: string; message: string; read: boolean; timestamp: string }> = []
    try {
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) notifications = parsed
    } catch {
      notifications = []
    }
    notifications.unshift({
      category,
      title,
      message,
      read: false,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(key, JSON.stringify(notifications.slice(0, 50)))
    purgeLegacyGlobalKeys()
  } catch {
    // silently fail — localStorage write is best-effort
  }
}
