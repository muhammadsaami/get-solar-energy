import React from 'react'
import type { CanonicalWorkOrder, WorkOrderStatus } from '../types/workOrders.types'
import { MdLocationOn, MdWork, MdAccessTime, MdChevronRight, MdCheckCircle, MdPlayArrow } from 'react-icons/md'

interface WorkOrderCardProps {
  order: CanonicalWorkOrder
  onSelect: (order: CanonicalWorkOrder) => void
  onUpdateStatus: (id: number, nextStatus: WorkOrderStatus) => void
  isUpdating?: boolean
}

export default function WorkOrderCard({
  order,
  onSelect,
  onUpdateStatus,
  isUpdating,
}: WorkOrderCardProps) {
  const getStatusClass = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Assigned': return 'assigned'
      case 'In Progress': return 'in-progress'
      case 'Completed': return 'completed'
      case 'Verified': return 'verified'
      default: return ''
    }
  }

  return (
    <div className="wo-card">
      <div className="wo-card-header">
        <div>
          <h3 className="wo-card-title">{order.jobTitle}</h3>
          <div className="wo-meta-row">
            <span className="wo-meta-item">
              <MdLocationOn style={{ color: '#00aeef' }} /> {order.city}
            </span>
            <span className="wo-meta-item">
              <MdWork style={{ color: '#f7931e' }} /> {order.jobType}
            </span>
            <span className="wo-meta-item">
              <MdAccessTime style={{ color: '#94a3b8' }} /> {order.assignedTimeAgo}
            </span>
          </div>
        </div>

        <span className={`wo-status-pill ${getStatusClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="wo-notes-preview">
        {order.notes}
      </div>

      <div className="wo-card-footer">
        <div>
          <span className="wo-budget-lbl">Payout Budget</span>
          <span className="wo-budget-val">₹{order.budget ? order.budget.toLocaleString('en-IN') : '15,000'}</span>
        </div>

        <div className="wo-card-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onSelect(order)}>
            Details <MdChevronRight />
          </button>

          {order.status === 'Assigned' && (
            <button
              className="btn btn-primary btn-sm"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(order.id, 'In Progress')}
            >
              <MdPlayArrow /> {isUpdating ? 'Starting...' : 'Start Job'}
            </button>
          )}

          {order.status === 'In Progress' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onSelect(order)}
            >
              Complete Job
            </button>
          )}

          {(order.status === 'Completed' || order.status === 'Verified') && (
            <button className="btn btn-secondary btn-sm" disabled style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              <MdCheckCircle /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
