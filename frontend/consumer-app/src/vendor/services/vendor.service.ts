import api from '../../services/api/client'
import type { VendorDashboardData, VendorAlertsData, VendorTask } from '../types/vendor.types'

export async function getVendorDashboard(): Promise<VendorDashboardData> {
  const res = await api.get('/vendor/dashboard')
  return res.data?.data || { kpis: {} as VendorDashboardData['kpis'], projects: [], todaysVisits: [], upcomingVisits: [], todaysTasks: [], overdueTasks: [], team: '' }
}

export async function getVendorProjects(params?: Record<string, string>) {
  const res = await api.get('/vendor/projects', { params })
  return res.data?.data || []
}

export async function getVendorProject(projectId: string) {
  const res = await api.get(`/projects/${encodeURIComponent(projectId)}`)
  return res.data?.data || null
}

export async function updateVendorProjectStage(projectId: string, stage: string) {
  const res = await api.patch(`/projects/${encodeURIComponent(projectId)}/stage`, { stage })
  return res.data?.data || null
}

export async function getVendorTasks(params?: Record<string, string>): Promise<VendorTask[]> {
  const res = await api.get('/vendor/tasks', { params })
  return res.data?.data || []
}

export async function getCustomerDirectory() {
  const res = await api.get('/customers')
  return Array.isArray(res.data) ? res.data : []
}

export async function getVendorAlerts(): Promise<VendorAlertsData> {
  const res = await api.get('/vendor/alerts')
  return res.data?.data || { alerts: [], total: 0, critical: 0 }
}
