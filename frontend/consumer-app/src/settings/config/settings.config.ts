import type { SettingsPreferences } from '../types/settings.types'

export interface DiscomOption {
  value: string
  label: string
}

export interface NetMeteringOption {
  value: string
  label: string
}

export const DISCOM_OPTIONS: DiscomOption[] = [
  { value: 'dvvnl', label: 'DVVNL - Dakshinanchal Vidyut Vitran Nigam Ltd' },
  { value: 'bescom', label: 'BESCOM - Bangalore Electricity Supply Company' },
  { value: 'mseb', label: 'MSEDCL - Maharashtra State Electricity Distribution' },
  { value: 'bses', label: 'BSES Yamuna Power Limited - Delhi' },
]

export const NET_METERING_OPTIONS: NetMeteringOption[] = [
  { value: 'net', label: 'Net Metering' },
  { value: 'gross', label: 'Gross Metering' },
  { value: 'behind', label: 'Behind the Meter (Zero Export)' },
]

export const DEFAULT_TARIFF = "7.50"
export const MIN_TARIFF = 1.0
export const MAX_TARIFF = 25.0
export const TARIFF_STEP = 0.01

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  discom: 'dvvnl',
  tariff: DEFAULT_TARIFF,
  netMetering: 'net',
}

export const STORAGE_KEY = 'userPreferences'

export const NOTIFICATIONS_KEY = 'notifications'
export const ACTIVITY_LOG_KEY = 'activityLog'
