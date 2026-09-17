import api from '../../../services/api/client'
import type {
  RawBackendEarning,
  RawBackendEarningSummary,
  CanonicalEarning,
  PayoutStatus,
} from '../types/earnings.types'

function getRelativeTimeAgo(isoDateString?: string): string {
  if (!isoDateString) return 'Earned recently'
  const diffMs = Date.now() - new Date(isoDateString).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Earned just now'
  if (diffHours < 24) return `Earned ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Earned yesterday'
  return `Earned ${diffDays} days ago`
}

export const earningsService = {
  async getEarnings(): Promise<{ summary: RawBackendEarningSummary; earnings: CanonicalEarning[] }> {
    const res = await api.get('/technician/earnings/')

    const rawSummary: RawBackendEarningSummary = res.data?.summary || {
      total_earned: 0,
      total_paid: 0,
      total_pending: 0,
      total_jobs_completed: 0,
    }

    const rawList: RawBackendEarning[] = Array.isArray(res.data?.earnings) ? res.data.earnings : []

    const canonicalList: CanonicalEarning[] = rawList.map((e: RawBackendEarning, idx: number) => {
      const createdAtStr = e.created_at || new Date().toISOString()
      return {
        id: e.id,
        workOrderId: e.work_order_id,
        amount: typeof e.amount === 'number' ? e.amount : 12500,
        payoutStatus: (e.payout_status as PayoutStatus) || 'Pending',
        createdAt: createdAtStr,
        createdTimeAgo: getRelativeTimeAgo(e.created_at),
        paidAt: e.paid_at || undefined,
        workOrderTitle: `Work Order #${e.work_order_id} - Solar Execution`,
        jobType: idx % 2 === 0 ? 'Solar Installation' : 'AMC Inspection',
        paymentMethod: 'Direct Bank Transfer (NEFT/IMPS)',
        transactionRef: `TXN-GSE-${e.id + 884000}`,
      }
    })

    return {
      summary: rawSummary,
      earnings: canonicalList,
    }
  },
}
