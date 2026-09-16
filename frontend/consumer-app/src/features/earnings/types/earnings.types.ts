export type PayoutStatus = 'Paid' | 'Pending' | 'Processing' | 'All'

export interface RawBackendEarningSummary {
  total_earned: number
  total_paid: number
  total_pending: number
  total_jobs_completed: number
}

export interface RawBackendEarning {
  id: number
  work_order_id: number
  amount: number
  payout_status: PayoutStatus
  created_at: string
  paid_at?: string
}

export interface RawBackendEarningsResponse {
  success: boolean
  summary: RawBackendEarningSummary
  earnings: RawBackendEarning[]
}

export interface CanonicalEarning {
  id: number
  workOrderId: number
  amount: number
  payoutStatus: PayoutStatus
  createdAt: string
  createdTimeAgo: string
  paidAt?: string
  workOrderTitle: string
  jobType: string
  paymentMethod: string
  transactionRef: string
}

export interface EarningsSummary {
  totalEarned: number
  totalPaid: number
  totalPending: number
  totalJobsCompleted: number
  averageEarnedPerJob: number
  payoutCompletionRate: number
}

export interface AdaptedEarningsData {
  raw: CanonicalEarning[]
  paid: CanonicalEarning[]
  pending: CanonicalEarning[]
  processing: CanonicalEarning[]
  summary: EarningsSummary
}

export interface EarningsFilters {
  payoutStatus: PayoutStatus
  jobType: string
  searchQuery: string
}
