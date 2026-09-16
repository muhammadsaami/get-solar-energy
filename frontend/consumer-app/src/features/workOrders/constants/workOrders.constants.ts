import type { WorkOrderStatus } from '../types/workOrders.types'

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = ['Assigned', 'In Progress', 'Completed', 'Verified']

export const WORK_ORDER_CITIES = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur']

export const WORK_ORDER_TYPES = ['Installation', 'AMC', 'Repair', 'Inspection']

export const DEFAULT_WORK_ORDER_FILTERS = {
  status: 'All' as const,
  city: 'All',
  jobType: 'All',
  searchQuery: '',
}
