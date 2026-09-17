import type { SettingsPreferences } from '../types/settings.types'
import { DEFAULT_PREFERENCES, STORAGE_KEY, NOTIFICATIONS_KEY, ACTIVITY_LOG_KEY } from '../config/settings.config'

export function loadPreferences(): SettingsPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(raw)
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

export function savePreferences(prefs: SettingsPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function addActivityLog(type: string, title: string, description: string): void {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY)
    const logs: Array<{ type: string; title: string; description: string; timestamp: string }> = raw ? JSON.parse(raw) : []
    logs.unshift({
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs.slice(0, 100)))
  } catch {
    // silently fail — localStorage write is best-effort
  }
}

export function createNotification(category: string, title: string, message: string): void {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    const notifications: Array<{ category: string; title: string; message: string; read: boolean; timestamp: string }> = raw ? JSON.parse(raw) : []
    notifications.unshift({
      category,
      title,
      message,
      read: false,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)))
  } catch {
    // silently fail — localStorage write is best-effort
  }
}
