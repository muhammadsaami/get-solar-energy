import React from 'react'
import type { VendorTask } from '../types/vendor.types'

interface WorkOrderCardProps {
  task: VendorTask
}

const BADGE_CLASS: Record<string, string> = {
  critical: 'badge-red',
  high: 'badge-orange',
  medium: 'badge-yellow',
  low: 'badge-green',
}

export default function WorkOrderCard({ task }: WorkOrderCardProps) {
  const isOverdue = task.overdueDays && task.overdueDays > 0
  const borderColor = isOverdue ? 'var(--color-red)' : 'var(--border-subtle)'

  return (
    <div className="card-glass" style={{
      padding: 'var(--space-4)',
      borderLeft: `3px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: isOverdue ? 'var(--color-red-surface)' : 'var(--color-orange-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isOverdue ? 'var(--color-red)' : 'var(--color-orange)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <use href={isOverdue ? '#icon-alert-triangle' : '#icon-clipboard-check'} />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              {task.title}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Due: {task.dueDate || 'N/A'}</span>
              {task.department && <span>{task.department}</span>}
              {task.progress !== undefined && <span>{task.progress}% complete</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)', flexShrink: 0 }}>
          <span className={`badge ${BADGE_CLASS[task.priority] || 'badge-gray'}`}>
            {task.priority}
          </span>
          {isOverdue && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-red)', fontWeight: 600 }}>
              {task.overdueDays}d overdue
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
