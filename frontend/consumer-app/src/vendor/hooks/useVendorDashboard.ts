import { useState, useEffect, useCallback } from 'react'
import { getVendorDashboard, getVendorAlerts } from '../services/vendor.service'
import type { VendorDashboardData, VendorKpis, VendorVisit, VendorTask, VendorAlert } from '../types/vendor.types'

interface UseVendorDashboardReturn {
  data: VendorDashboardData | null
  alerts: VendorAlert[]
  kpis: VendorKpis | null
  todaysVisits: VendorVisit[]
  upcomingVisits: VendorVisit[]
  todaysTasks: VendorTask[]
  overdueTasks: VendorTask[]
  team: string
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useVendorDashboard(): UseVendorDashboardReturn {
  const [data, setData] = useState<VendorDashboardData | null>(null)
  const [alerts, setAlerts] = useState<VendorAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardData, alertsData] = await Promise.all([
        getVendorDashboard(),
        getVendorAlerts(),
      ])
      setData(dashboardData)
      setAlerts(alertsData.alerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    data,
    alerts,
    kpis: data?.kpis ?? null,
    todaysVisits: data?.todaysVisits ?? [],
    upcomingVisits: data?.upcomingVisits ?? [],
    todaysTasks: data?.todaysTasks ?? [],
    overdueTasks: data?.overdueTasks ?? [],
    team: data?.team ?? '',
    loading,
    error,
    refresh: load,
  }
}
