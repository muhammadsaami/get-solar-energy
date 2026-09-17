import React from 'react'
import type { WorkOrdersSummary } from '../types/workOrders.types'
import { MdAssignment, MdAssignmentTurnedIn, MdAutorenew, MdCheckCircle, MdAttachMoney } from 'react-icons/md'

interface WorkOrdersKPIsProps {
  summary: WorkOrdersSummary
}

export default function WorkOrdersKPIs({ summary }: WorkOrdersKPIsProps) {
  return (
    <div className="wo-kpi-grid">
      <div className="wo-kpi-card">
        <div className="wo-kpi-icon">
          <MdAssignment />
        </div>
        <div>
          <div className="wo-kpi-val">{summary.totalWorkOrders}</div>
          <div className="wo-kpi-lbl">Total Work Orders</div>
        </div>
      </div>

      <div className="wo-kpi-card">
        <div className="wo-kpi-icon" style={{ background: 'rgba(0, 174, 239, 0.1)', color: '#00aeef' }}>
          <MdAssignmentTurnedIn />
        </div>
        <div>
          <div className="wo-kpi-val">{summary.assignedCount}</div>
          <div className="wo-kpi-lbl">Assigned</div>
        </div>
      </div>

      <div className="wo-kpi-card">
        <div className="wo-kpi-icon" style={{ background: 'rgba(247, 147, 30, 0.1)', color: '#f7931e' }}>
          <MdAutorenew />
        </div>
        <div>
          <div className="wo-kpi-val">{summary.inProgressCount}</div>
          <div className="wo-kpi-lbl">In Progress</div>
        </div>
      </div>

      <div className="wo-kpi-card">
        <div className="wo-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdCheckCircle />
        </div>
        <div>
          <div className="wo-kpi-val">{summary.completedCount}</div>
          <div className="wo-kpi-lbl">Completed</div>
        </div>
      </div>

      <div className="wo-kpi-card">
        <div className="wo-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdAttachMoney />
        </div>
        <div>
          <div className="wo-kpi-val">₹{summary.totalEarnedBudget.toLocaleString('en-IN')}</div>
          <div className="wo-kpi-lbl">Earned Budget</div>
        </div>
      </div>
    </div>
  )
}
