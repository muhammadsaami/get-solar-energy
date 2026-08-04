import api from './api/client'
import type {
  TechnicianDashboardData,
  TechnicianKpis,
  TechnicianProfile,
  ScheduleItem,
  NotificationItem,
  PerformanceData,
  TrainingProgress,
} from '../technician/types/technician.types'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function getDayGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 18) return 'Afternoon'
  return 'Evening'
}

let useMockData = false

export function setUseMockData(mock: boolean) {
  useMockData = mock
}

export const technicianDashboardService = {
  async loadDashboard(): Promise<TechnicianDashboardData | null> {
    if (useMockData) {
      return null
    }

    const [dashRes, notifRes] = await Promise.all([
      api.get('/technician/dashboard'),
      api.get('/technician/notifications').catch(() => null),
    ])

    const raw = dashRes.data || {}
    const notifRaw = notifRes?.data || {}

    const profile: TechnicianProfile = {
      name: raw.profile?.name || 'Technician',
      email: raw.profile?.email || '',
      phone: raw.profile?.phone || '',
      city: raw.profile?.city || '',
      skillLevel: raw.profile?.skill_level || 'Level 1',
      technicianId: 'TECH-' + (raw.profile?.id?.toString().padStart(4, '0') || '0001'),
      certificationLevel: raw.training_progress?.certifications_earned ? `${raw.training_progress.certifications_earned} Earned` : 'Certified Technician',
      verificationStatus: raw.profile?.kyc_status || 'Verified',
      availability: 'Available Today',
      serviceArea: raw.profile?.city ? `${raw.profile.city} Region` : 'Service Region',
    }

    const kpis: TechnicianKpis = {
      activeWorkOrders: raw.kpi_summary?.jobs_in_progress ?? 0,
      completedJobs: raw.kpi_summary?.jobs_completed ?? 0,
      monthlyEarnings: raw.kpi_summary?.total_earned ?? 0,
      customerRating: raw.performance_summary?.average_rating ?? 4.8,
      trainingProgress: raw.kpi_summary?.training_completion_pct ?? 0,
      certificationScore: raw.kpi_summary?.certifications_earned ? raw.kpi_summary.certifications_earned * 25 : 88,
    }

    const schedule: ScheduleItem[] = (raw.todays_schedule || []).map((item: Record<string, unknown>) => ({
      id: `wo-${item.work_order_id}`,
      title: (item.job_title as string) || 'Work Order',
      time: item.assigned_at ? new Date(item.assigned_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
      location: (item.city as string) || 'Site Location',
      priority: 'high',
      status: (item.status as string) || 'Assigned',
    }))

    const notifList = notifRaw.notifications || raw.notifications?.recent || []
    const notifications: NotificationItem[] = notifList.map((n: Record<string, unknown>) => ({
      id: String(n.id),
      message: (n.message as string) || (n.title as string) || '',
      type: (n.notification_type as NotificationItem['type']) || 'general',
      timestamp: n.created_at ? new Date(n.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      read: Boolean(n.is_read),
    }))

    const performance: PerformanceData = {
      completedJobs: [{ label: 'Total', value: raw.kpi_summary?.jobs_completed ?? 0 }],
      monthlyEarnings: [{ label: 'Earned', value: raw.earnings_summary?.total_earned ?? 0 }],
      customerSatisfaction: [{ label: 'Rating', value: raw.performance_summary?.average_rating ?? 4.8 }],
      trainingCompletion: [{ label: 'Passed', value: raw.training_progress?.modules_passed ?? 0 }],
    }

    const training: TrainingProgress = {
      currentLevel: raw.profile?.skill_level || 'Level 1',
      nextCertification: 'Master Installer',
      completionPercentage: raw.training_progress?.completion_pct ?? 0,
      remainingModules: (raw.training_progress?.total_modules ?? 0) - (raw.training_progress?.modules_passed ?? 0),
      totalModules: raw.training_progress?.total_modules ?? 0,
    }

    return {
      kpis,
      profile,
      schedule,
      notifications,
      performance,
      training,
    }
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await api.get('/technician/notifications')
    const notifList = res.data?.notifications || []
    return notifList.map((n: Record<string, unknown>) => ({
      id: String(n.id),
      message: (n.message as string) || (n.title as string) || '',
      type: (n.notification_type as NotificationItem['type']) || 'general',
      timestamp: n.created_at ? new Date(n.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      read: Boolean(n.is_read),
    }))
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/technician/notifications/${id}/read`)
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.patch('/technician/notifications/read-all')
  },
}

export { getGreeting, getDayGreeting }
