import { useState, useEffect, useCallback, useMemo } from 'react'
import { workOrdersApi } from '../services/workOrders.api'
import { adaptWorkOrdersData } from '../adapters/workOrdersAdapter'
import type {
  CanonicalWorkOrder,
  AdaptedWorkOrdersData,
  WorkOrdersFilters,
  WorkOrderStatus,
} from '../types/workOrders.types'
import { DEFAULT_WORK_ORDER_FILTERS } from '../constants/workOrders.constants'
import { useNotificationStore } from '../../../stores/notificationStore'

export function useWorkOrders() {
  const [data, setData] = useState<AdaptedWorkOrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tabs & Filters State
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'inProgress' | 'completed'>('all')
  const [filters, setFilters] = useState<WorkOrdersFilters>(DEFAULT_WORK_ORDER_FILTERS)

  // Drawer State
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<CanonicalWorkOrder | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const addToast = useNotificationStore(s => s.addToast)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rawOrders = await workOrdersApi.getMyWorkOrders()
      const adapted = adaptWorkOrdersData(rawOrders)
      setData(adapted)
    } catch {
      setError('Failed to load technician work orders.')
      addToast({ type: 'error', message: 'Failed to load work orders' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openDrawer = useCallback((order: CanonicalWorkOrder) => {
    setSelectedWorkOrder(order)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedWorkOrder(null)
  }, [])

  const handleUpdateStatus = useCallback(
    async (workOrderId: number, nextStatus: WorkOrderStatus, notes?: string, proofPhotoUrl?: string) => {
      setUpdatingId(workOrderId)
      try {
        const res = await workOrdersApi.updateWorkOrderStatus(workOrderId, nextStatus, notes, proofPhotoUrl)
        if (res.success) {
          addToast({ type: 'success', message: res.message || `Work order updated to '${nextStatus}'` })
          if (selectedWorkOrder && selectedWorkOrder.id === workOrderId) {
            setSelectedWorkOrder(prev => (prev ? { ...prev, status: nextStatus } : null))
          }
          await loadData()
        } else {
          addToast({ type: 'error', message: res.message || 'Update failed.' })
        }
      } catch {
        addToast({ type: 'error', message: 'Status update error. Proof photo may be required.' })
      } finally {
        setUpdatingId(null)
      }
    },
    [loadData, selectedWorkOrder, addToast]
  )

  const filteredWorkOrders = useMemo(() => {
    if (!data) return []
    let list = data.raw

    if (activeTab === 'assigned') list = data.assigned
    else if (activeTab === 'inProgress') list = data.inProgress
    else if (activeTab === 'completed') list = data.completed

    if (filters.status !== 'All') {
      list = list.filter(o => o.status === filters.status)
    }

    if (filters.city !== 'All') {
      list = list.filter(o => o.city.toLowerCase() === filters.city.toLowerCase())
    }

    if (filters.jobType !== 'All') {
      list = list.filter(o => o.jobType === filters.jobType)
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim()
      list = list.filter(
        o =>
          o.jobTitle.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.notes.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q))
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
    selectedWorkOrder,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleUpdateStatus,
    updatingId,
    filteredWorkOrders,
    reload: loadData,
  }
}
