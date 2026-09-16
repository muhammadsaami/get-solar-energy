import { useState, useEffect, useCallback } from 'react'
import { technicianDashboardService } from '../../services/technicianDashboard.service'
import type {
  TechnicianDashboardData, TechnicianKpis, TechnicianProfile,
  ScheduleItem, NotificationItem, PerformanceData, TrainingProgress,
} from '../types/technician.types'

export interface UseTechnicianDashboardReturn {
  data: TechnicianDashboardData | null
  kpis: TechnicianKpis | null
  profile: TechnicianProfile | null
  schedule: ScheduleItem[]
  notifications: NotificationItem[]
  performance: PerformanceData | null
  training: TrainingProgress | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTechnicianDashboard(): UseTechnicianDashboardReturn {
  const [data, setData] = useState<TechnicianDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await technicianDashboardService.loadDashboard()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load technician dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    data,
    kpis: data?.kpis ?? null,
    profile: data?.profile ?? null,
    schedule: data?.schedule ?? [],
    notifications: data?.notifications ?? [],
    performance: data?.performance ?? null,
    training: data?.training ?? null,
    loading,
    error,
    refresh: load,
  }
}
