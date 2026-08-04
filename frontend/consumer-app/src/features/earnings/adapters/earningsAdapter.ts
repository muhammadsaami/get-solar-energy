import type {
  RawBackendEarningSummary,
  CanonicalEarning,
  AdaptedEarningsData,
} from '../types/earnings.types'

export function adaptEarningsData(
  summary: RawBackendEarningSummary,
  earnings: CanonicalEarning[]
): AdaptedEarningsData {
  const paid = earnings.filter(e => e.payoutStatus === 'Paid')
  const pending = earnings.filter(e => e.payoutStatus === 'Pending')
  const processing = earnings.filter(e => e.payoutStatus === 'Processing')

  const totalEarned = summary.total_earned || earnings.reduce((acc, curr) => acc + curr.amount, 0)
  const totalPaid = summary.total_paid || paid.reduce((acc, curr) => acc + curr.amount, 0)
  const totalPending = summary.total_pending || pending.reduce((acc, curr) => acc + curr.amount, 0)
  const totalJobsCompleted = summary.total_jobs_completed || earnings.length

  const averageEarnedPerJob = totalJobsCompleted > 0 ? Math.round(totalEarned / totalJobsCompleted) : 0
  const payoutCompletionRate = totalEarned > 0 ? Math.round((totalPaid / totalEarned) * 100) : 0

  return {
    raw: earnings,
    paid,
    pending,
    processing,
    summary: {
      totalEarned,
      totalPaid,
      totalPending,
      totalJobsCompleted,
      averageEarnedPerJob,
      payoutCompletionRate,
    },
  }
}
