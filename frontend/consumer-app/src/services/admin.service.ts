import api from './api/client'
import type { AdminDashboardData, AdminActivity, AdminHealth } from '../pages/admin/admin.types'
import { mapDashboardData, mapActivityItems, mapHealthData } from './admin.mapper'

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
}