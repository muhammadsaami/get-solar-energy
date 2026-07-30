import type { AdminDashboardData } from '../admin/admin.types'
import type { CrmPipelineMetrics, CrmCustomer } from '../crm/crm.types'

export interface BIFilterState {
  datePreset: 'today' | '7d' | '30d' | 'quarter' | 'year' | 'custom'
  dateRange: { start: string; end: string } | null
  region: string
  vendor: string
  salesperson: string
  segment: string
  projectStatus: string
}

export interface BIDashboardData {
  admin: AdminDashboardData | null
  pipeline: CrmPipelineMetrics | null
  customers: CrmCustomer[]
  loading: boolean
  error: string | null
}

export interface BISectionProps {
  data: BIDashboardData
  filters: BIFilterState
  onNavigate: (path: string) => void
}

export const FILTER_KEYS: (keyof BIFilterState)[] = [
  'datePreset', 'region', 'vendor', 'salesperson', 'segment', 'projectStatus'
]

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
] as const
