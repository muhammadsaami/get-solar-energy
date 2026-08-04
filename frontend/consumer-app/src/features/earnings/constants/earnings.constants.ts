import type { PayoutStatus } from '../types/earnings.types'

export const PAYOUT_STATUSES: PayoutStatus[] = ['Paid', 'Pending', 'Processing']

export const EARNING_JOB_TYPES = ['Solar Installation', 'AMC Inspection', 'High-Voltage Repair', 'DISCOM Audit']

export const DEFAULT_EARNINGS_FILTERS = {
  payoutStatus: 'All' as const,
  jobType: 'All',
  searchQuery: '',
}
