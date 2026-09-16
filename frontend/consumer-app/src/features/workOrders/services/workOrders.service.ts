import api from '../../../services/api/client'
import type {
  RawBackendWorkOrder,
  CanonicalWorkOrder,
  WorkOrderStatus,
} from '../types/workOrders.types'

function getRelativeTimeAgo(isoDateString?: string): string {
  if (!isoDateString) return 'Assigned recently'
  const diffMs = Date.now() - new Date(isoDateString).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Assigned just now'
  if (diffHours < 24) return `Assigned ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Assigned yesterday'
  return `Assigned ${diffDays} days ago`
}

export const workOrdersService = {
  async getMyWorkOrders(): Promise<CanonicalWorkOrder[]> {
    const res = await api.get('/technician/work-orders/')
    if (res.data && res.data.success && Array.isArray(res.data.work_orders)) {
      return res.data.work_orders.map((wo: RawBackendWorkOrder, idx: number) => {
        return {
          id: wo.id,
          jobTitle: wo.job_title || 'Solar Array Field Work Order',
          jobType: wo.job_type || 'Installation',
          city: wo.city || 'Mumbai',
          budget: typeof wo.budget === 'number' ? wo.budget : 15000,
          status: (wo.status as WorkOrderStatus) || 'Assigned',
          notes: wo.notes || 'Rooftop mounting and electrical wiring field execution protocol.',
          proofPhotoUrl: wo.proof_photo_url || undefined,
          assignedAt: wo.assigned_at || new Date().toISOString(),
          assignedTimeAgo: getRelativeTimeAgo(wo.assigned_at),
          completedAt: wo.completed_at || undefined,
          customerName: `Customer #${1000 + idx}`,
          address: `Site Location #${idx + 101}, Main Road, ${wo.city || 'Mumbai'}`,
          contactPhone: '+91 98200 12345',
          requiredTools: ['10mm Crimping Tool', 'LOTO Safety Lock', 'Multimeter', 'Torque Wrench'],
        }
      })
    }
    return []
  },

  async updateWorkOrderStatus(
    workOrderId: number,
    status: WorkOrderStatus,
    notes?: string,
    proofPhotoUrl?: string
  ): Promise<{ success: boolean; message?: string }> {
    const payload: Record<string, string> = { status }
    if (notes) payload.notes = notes
    if (proofPhotoUrl) payload.proof_photo_url = proofPhotoUrl

    const res = await api.patch(`/technician/work-orders/${workOrderId}/status`, payload)
    return {
      success: Boolean(res.data?.success),
      message: res.data?.message || `Work order status updated to '${status}'.`,
    }
  },
}
