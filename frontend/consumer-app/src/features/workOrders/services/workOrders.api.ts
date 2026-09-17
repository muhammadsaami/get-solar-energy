import { workOrdersService } from './workOrders.service'
import type { WorkOrderStatus } from '../types/workOrders.types'

export const workOrdersApi = {
  getMyWorkOrders() {
    return workOrdersService.getMyWorkOrders()
  },

  updateWorkOrderStatus(workOrderId: number, status: WorkOrderStatus, notes?: string, proofPhotoUrl?: string) {
    return workOrdersService.updateWorkOrderStatus(workOrderId, status, notes, proofPhotoUrl)
  },
}
