import type { AdminHealth, AdminHealthService } from '../admin/admin.types'

export interface AuditLogEntry {
  id: number
  action: string
  module: string
  entityType: string
  entityId: number | null
  user: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  ipAddress: string | null
  createdAt: string
}

export interface AuditFilterState {
  datePreset: 'today' | '7d' | '30d' | 'quarter' | 'year' | 'custom'
  dateRange: { start: string; end: string } | null
  severity: string
  module: string
  user: string
  search: string
  sortKey: string
  sortDir: 'asc' | 'desc'
}

export interface MLStatus {
  registryLoaded: boolean
  totalModels: number
  totalEncoders: number
  loaderCacheSize: number
  status: string
}

export interface MLMetrics {
  totalPredictions: number
  successfulPredictions: number
  failedPredictions: number
  successRate: number
  averageLatencyMs: number
  p95LatencyMs: number
  uptimeSeconds: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  loadedModels: number
  activeModels: number
  activeEncoders: number
}
