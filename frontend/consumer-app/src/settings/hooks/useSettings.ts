import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotificationStore } from '../../stores/notificationStore'
import { loadPreferences, savePreferences, addActivityLog, createNotification } from '../services/settings.service'
import type { SettingsPreferences, ReadonlyProfile, SettingsError } from '../types/settings.types'
import { DEFAULT_PREFERENCES, MIN_TARIFF, MAX_TARIFF, DISCOM_OPTIONS, NET_METERING_OPTIONS } from '../config/settings.config'

interface AuthUser {
  name: string
  displayRole?: string
}

export function useSettings() {
  const auth = useAuth() as unknown as { user: AuthUser | null }
  const addToast = useNotificationStore((s) => s.addToast)

  const [preferences, setPreferences] = useState<SettingsPreferences>({ ...DEFAULT_PREFERENCES })
  const [readonlyProfile, setReadonlyProfile] = useState<ReadonlyProfile>({ name: '', role: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<SettingsError | null>(null)
  const [initialPreferences, setInitialPreferences] = useState<SettingsPreferences | null>(null)

  useEffect(() => {
    try {
      const user = auth?.user
      setReadonlyProfile({
        name: user?.name || 'User',
        role: user?.displayRole ?? 'Standard User',
      })

      const saved = loadPreferences()
      setPreferences(saved)
      setInitialPreferences({ ...saved })
    } catch (err) {
      setError({
        hasError: true,
        message: err instanceof Error ? err.message : 'Failed to load settings.',
      })
    } finally {
      setLoading(false)
    }
  }, [auth?.user])

  const isDirty = initialPreferences !== null && (
    preferences.discom !== initialPreferences.discom ||
    preferences.tariff !== initialPreferences.tariff ||
    preferences.netMetering !== initialPreferences.netMetering
  )

  const updatePreference = useCallback(<K extends keyof SettingsPreferences>(
    key: K,
    value: SettingsPreferences[K],
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }, [])

  const validate = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {}
    const validDiscoms = DISCOM_OPTIONS.map((o) => o.value)
    const validMetering = NET_METERING_OPTIONS.map((o) => o.value)

    if (!validDiscoms.includes(preferences.discom)) {
      errors.discom = 'Please select a valid DISCOM.'
    }
    const tariffNum = parseFloat(preferences.tariff)
    if (
      isNaN(tariffNum) ||
      tariffNum < MIN_TARIFF ||
      tariffNum > MAX_TARIFF
    ) {
      errors.tariff = `Tariff must be between \u20B9${MIN_TARIFF} and \u20B9${MAX_TARIFF}/kWh.`
    }
    if (!validMetering.includes(preferences.netMetering)) {
      errors.netMetering = 'Please select a valid net metering type.'
    }
    return errors
  }, [preferences])

  const save = useCallback(() => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setError({ hasError: true, message: Object.values(validationErrors).join(' ') })
      return
    }

    setSaving(true)
    setError(null)

    try {
      savePreferences(preferences)
      setInitialPreferences({ ...preferences })

      addToast({ type: 'success', message: 'Preferences saved successfully!' })

      addActivityLog(
        'settings',
        'Settings Saved',
        `Updated Utility to ${preferences.discom.toUpperCase()}, Tariff to \u20B9${preferences.tariff}/kWh, and Metering to ${preferences.netMetering.toUpperCase()}.`,
      )
      createNotification(
        'system',
        'Settings Saved',
        'Utility configurations and custom tariff rates successfully updated.',
      )
      addActivityLog('settings', 'Profile Updated', 'Profile details updated and synced.')
      createNotification(
        'system',
        'Profile Updated',
        'User profile configurations synced with platform registry.',
      )
    } catch (err) {
      setError({
        hasError: true,
        message: err instanceof Error ? err.message : 'Failed to save preferences.',
      })
    } finally {
      setSaving(false)
    }
  }, [preferences, validate, addToast])

  const clearError = useCallback(() => setError(null), [])

  return {
    preferences,
    readonlyProfile,
    loading,
    saving,
    error,
    isDirty,
    updatePreference,
    save,
    clearError,
  }
}
