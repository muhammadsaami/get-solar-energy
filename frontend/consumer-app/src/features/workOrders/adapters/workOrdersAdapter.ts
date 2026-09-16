import type {
  CanonicalWorkOrder,
  AdaptedWorkOrdersData,
} from '../types/workOrders.types'

export function adaptWorkOrdersData(orders: CanonicalWorkOrder[]): AdaptedWorkOrdersData {
  const assigned = orders.filter(o => o.status === 'Assigned')
  const inProgress = orders.filter(o => o.status === 'In Progress')
  const completed = orders.filter(o => o.status === 'Completed' || o.status === 'Verified')

  const totalEarnedBudget = completed.reduce((acc, curr) => acc + (curr.budget || 0), 0)
  const completionRatePercent = orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0

  return {
    raw: orders,
    assigned,
    inProgress,
    completed,
    summary: {
      totalWorkOrders: orders.length,
      assignedCount: assigned.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      totalEarnedBudget,
      completionRatePercent,
    },
  }
}
