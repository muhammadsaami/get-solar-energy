export type WorkOrderStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Verified' | 'All'

export interface RawBackendWorkOrder {
  id: number
  job_title: string
  job_type: string
  city: string
  budget?: number
  status: WorkOrderStatus
  notes?: string
  proof_photo_url?: string
  assigned_at: string
  completed_at?: string
}

export interface CanonicalWorkOrder {
  id: number
  jobTitle: string
  jobType: string
  city: string
  budget: number
  status: WorkOrderStatus
  notes: string
  proofPhotoUrl?: string
  assignedAt: string
  assignedTimeAgo: string
  completedAt?: string
  customerName?: string
  address?: string
  contactPhone?: string
  requiredTools?: string[]
}

export interface WorkOrdersSummary {
  totalWorkOrders: number
  assignedCount: number
  inProgressCount: number
  completedCount: number
  totalEarnedBudget: number
  completionRatePercent: number
}

export interface AdaptedWorkOrdersData {
  raw: CanonicalWorkOrder[]
  assigned: CanonicalWorkOrder[]
  inProgress: CanonicalWorkOrder[]
  completed: CanonicalWorkOrder[]
  summary: WorkOrdersSummary
}

export interface WorkOrdersFilters {
  status: WorkOrderStatus
  city: string
  jobType: string
  searchQuery: string
}
