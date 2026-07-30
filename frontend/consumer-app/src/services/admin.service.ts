import api from './api/client'
import type { AdminDashboardData, AdminActivity, AdminHealth } from '../pages/admin/admin.types'
import type { AuditLogEntry, MLStatus, MLMetrics } from '../pages/audit/audit.types'
import { mapDashboardData, mapActivityItems, mapHealthData } from './admin.mapper'

function deepMapKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map((i: unknown) => deepMapKeys<T>(i)) as unknown as T
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key.replace(/_(\w)/g, (_, c) => c.toUpperCase())] = deepMapKeys(value)
    }
    return result as T
  }
  return obj as T
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboardData | null> {
    const res = await api.get('/admin/dashboard')
    const raw = res.data?.data
    return raw ? mapDashboardData(raw) : null
  },

  async getActivity(limit = 50): Promise<AdminActivity[]> {
    const res = await api.get('/admin/activity', { params: { limit } })
    const raw = res.data?.data
    return Array.isArray(raw) ? mapActivityItems(raw) : []
  },

  async getHealth(): Promise<AdminHealth | null> {
    const res = await api.get('/admin/health')
    const raw = res.data?.data
    return raw ? mapHealthData(raw) : null
  },

  async getAuditLog(limit = 200): Promise<AuditLogEntry[]> {
    const res = await api.get('/crm/audit-log', { params: { limit } })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<AuditLogEntry[]>(raw) : []
  },

  async getMlStatus(): Promise<MLStatus | null> {
    const res = await api.get('/ml/status')
    const raw = res.data?.data
    return raw ? deepMapKeys<MLStatus>(raw) : null
  },

  async getMlMetrics(): Promise<MLMetrics | null> {
    const res = await api.get('/ml/metrics')
    const raw = res.data?.data
    return raw ? deepMapKeys<MLMetrics>(raw) : null
  },
}