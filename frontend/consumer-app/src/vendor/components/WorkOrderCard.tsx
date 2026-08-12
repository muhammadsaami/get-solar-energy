import React from 'react'
import type { VendorTask } from '../types/vendor.types'

interface WorkOrderCardProps {
  task: VendorTask
}

export default function WorkOrderCard({ task }: WorkOrderCardProps) {
  const isOverdue = Boolean(task.overdueDays && task.overdueDays > 0)
  const accentColor = isOverdue ? 'var(--vendor-danger)' : 'var(--vendor-primary)'

  return (
    <div className="vendor-glass-card" style={{
      padding: '16px 20px',
      borderLeft: `4px solid ${accentColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: accentColor,
          }}>
            {isOverdue ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
              {task.title}
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '11.5px', color: 'var(--vendor-text-muted)', flexWrap: 'wrap' }}>
              <span>Due Date: <strong style={{ color: 'var(--vendor-text-secondary)' }}>{task.dueDate || 'N/A'}</strong></span>
              {task.department && <span>Department: <strong style={{ color: 'var(--vendor-text-secondary)' }}>{task.department}</strong></span>}
              {task.progress !== undefined && <span>Progress: <strong style={{ color: 'var(--vendor-primary)' }}>{task.progress}%</strong></span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <span style={{
            fontSize: '10.5px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
            backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(23, 168, 229, 0.15)',
            color: isOverdue ? 'var(--vendor-danger)' : 'var(--vendor-primary)',
            border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'var(--vendor-primary-border)'}`,
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            {task.priority || 'Normal'}
          </span>
          {isOverdue && (
            <span style={{ fontSize: '11px', color: 'var(--vendor-danger)', fontWeight: 700 }}>
              {task.overdueDays}d overdue
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
