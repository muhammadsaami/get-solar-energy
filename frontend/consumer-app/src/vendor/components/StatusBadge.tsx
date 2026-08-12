import React from 'react'

export type StatusType = 'active' | 'completed' | 'pending' | 'warning' | 'cancelled' | 'in_progress'

interface StatusBadgeProps {
  status: string
  type?: StatusType
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const normalized = (type || status).toLowerCase().replace(/\s+/g, '_')

  let bg = 'var(--vendor-primary-surface)'
  let color = 'var(--vendor-primary)'
  let border = 'var(--vendor-primary-border)'

  if (['completed', 'active', 'paid', 'verified', 'passed'].includes(normalized)) {
    bg = 'var(--vendor-success-surface)'
    color = 'var(--vendor-success)'
    border = 'rgba(16, 185, 129, 0.3)'
  } else if (['in_progress', 'pending', 'assigned', 'applied'].includes(normalized)) {
    bg = 'var(--vendor-warning-surface)'
    color = 'var(--vendor-warning)'
    border = 'rgba(245, 158, 11, 0.3)'
  } else if (['cancelled', 'rejected', 'failed', 'unpaid'].includes(normalized)) {
    bg = 'var(--vendor-danger-surface)'
    color = 'var(--vendor-danger)'
    border = 'rgba(239, 68, 68, 0.3)'
  }

  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: '12px',
      backgroundColor: bg,
      color: color,
      border: `1px solid ${border}`,
      textTransform: 'capitalize',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
      {status}
    </span>
  )
}

export default StatusBadge
