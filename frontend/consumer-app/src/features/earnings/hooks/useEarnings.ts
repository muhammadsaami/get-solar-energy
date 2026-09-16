import { useState, useEffect, useCallback, useMemo } from 'react'
import { earningsApi } from '../services/earnings.api'
import { adaptEarningsData } from '../adapters/earningsAdapter'
import type {
  CanonicalEarning,
  AdaptedEarningsData,
  EarningsFilters,
} from '../types/earnings.types'
import { DEFAULT_EARNINGS_FILTERS } from '../constants/earnings.constants'
import { useNotificationStore } from '../../../stores/notificationStore'

export function useEarnings() {
  const [data, setData] = useState<AdaptedEarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab & Filters State
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'processing'>('all')
  const [filters, setFilters] = useState<EarningsFilters>(DEFAULT_EARNINGS_FILTERS)

  // Drawer State
  const [selectedEarning, setSelectedEarning] = useState<CanonicalEarning | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const addToast = useNotificationStore(s => s.addToast)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await earningsApi.getEarnings()
      const adapted = adaptEarningsData(res.summary, res.earnings)
      setData(adapted)
    } catch {
      setError('Failed to load technician payout earnings.')
      addToast({ type: 'error', message: 'Failed to load earnings summary' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openDrawer = useCallback((earning: CanonicalEarning) => {
    setSelectedEarning(earning)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedEarning(null)
  }, [])

  const filteredEarnings = useMemo(() => {
    if (!data) return []
    let list = data.raw

    if (activeTab === 'paid') list = data.paid
    else if (activeTab === 'pending') list = data.pending
    else if (activeTab === 'processing') list = data.processing

    if (filters.payoutStatus !== 'All') {
      list = list.filter(e => e.payoutStatus === filters.payoutStatus)
    }

    if (filters.jobType !== 'All') {
      list = list.filter(e => e.jobType === filters.jobType)
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim()
      list = list.filter(
        e =>
          e.workOrderTitle.toLowerCase().includes(q) ||
          e.transactionRef.toLowerCase().includes(q) ||
          String(e.workOrderId).includes(q)
      )
    }

    return list
  }, [data, activeTab, filters])

  return {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    selectedEarning,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    filteredEarnings,
    reload: loadData,
  }
}
