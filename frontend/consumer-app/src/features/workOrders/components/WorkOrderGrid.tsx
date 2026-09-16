import React from 'react'
import type { CanonicalWorkOrder, WorkOrderStatus } from '../types/workOrders.types'
import WorkOrderCard from './WorkOrderCard'

interface WorkOrderGridProps {
  orders: CanonicalWorkOrder[]
  onSelect: (order: CanonicalWorkOrder) => void
  onUpdateStatus: (id: number, nextStatus: WorkOrderStatus) => void
  updatingId?: number | null
}

export default function WorkOrderGrid({
  orders,
  onSelect,
  onUpdateStatus,
  updatingId,
}: WorkOrderGridProps) {
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: 'rgba(8, 24, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        No work orders found matching your search or filters.
      </div>
    )
  }

  return (
    <div className="wo-card-grid">
      {orders.map(order => (
        <WorkOrderCard
          key={order.id}
          order={order}
          onSelect={onSelect}
          onUpdateStatus={onUpdateStatus}
          isUpdating={updatingId === order.id}
        />
      ))}
    </div>
  )
}
