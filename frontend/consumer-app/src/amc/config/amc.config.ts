import type { TabId } from '../types/amc.types'

export interface TabConfig {
  id: TabId
  label: string
  icon: string
}

export const AMC_TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: '\uD83D\uDCCA' },
  { id: 'history', label: 'Service History', icon: '\uD83D\uDCCB' },
  { id: 'recommendation', label: 'AI Recommendation', icon: '\uD83E\uDD16' },
]

export const DEFAULT_FORM_VALUES = {
  system_size: 5.0,
  monthly_generation: 0,
  city: 'Lucknow',
  years: 5,
  coverage_type: 'comprehensive',
}

export const COVERAGE_OPTIONS = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' },
]

export const CONTRACT_STATUS_LABELS: Record<string, { text: string; className: string }> = {
  active: { text: 'Active', className: 'badge-green' },
  expiring: { text: 'Expiring Soon', className: 'badge-yellow' },
  expired: { text: 'Expired', className: 'badge-red' },
  none: { text: 'No Contract', className: 'badge-gray' },
}

export const VISIT_STATUS_LABELS: Record<string, { text: string; className: string }> = {
  scheduled: { text: 'Scheduled', className: 'badge-blue' },
  completed: { text: 'Completed', className: 'badge-green' },
  cancelled: { text: 'Cancelled', className: 'badge-gray' },
}

export const STALE_AFTER_MS = 5 * 60 * 1000
