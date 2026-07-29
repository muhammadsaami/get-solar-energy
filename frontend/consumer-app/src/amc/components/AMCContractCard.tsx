import React from 'react'
import { MdDescription, MdCalendarToday, MdAttachMoney, MdHome } from 'react-icons/md'
import type { AMCContract } from '../types/amc.types'
import { CONTRACT_STATUS_LABELS } from '../config/amc.config'

interface AMCContractCardProps {
  contract: AMCContract | null
  loading: boolean
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `\u20B9${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `\u20B9${(val / 1000).toFixed(0)}K`
  return `\u20B9${val}`
}

function AMCContractCardComponent({ contract, loading }: AMCContractCardProps) {
  if (loading) {
    return (
      <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <div className="skeleton skeleton-text narrow" style={{ width: '140px' }} />
        </div>
        <div style={{ marginTop: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '8px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Contract Details</span>
        </div>
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          No active AMC contract found. Use the AI Recommendation tab to find a plan.
        </div>
      </div>
    )
  }

  const statusLabel = CONTRACT_STATUS_LABELS[contract.status] || CONTRACT_STATUS_LABELS.none

  const details = [
    { icon: MdDescription, label: 'Plan', value: contract.planName },
    { icon: MdCalendarToday, label: 'Valid Until', value: formatDate(contract.endDate) },
    { icon: MdAttachMoney, label: 'Annual Cost', value: formatCurrency(contract.annualCost) },
    { icon: MdHome, label: 'System Size', value: `${contract.systemSizeKw} kW` },
  ]

  return (
    <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <span className="kpi-title">Contract Details</span>
        <span className={`status-badge ${statusLabel.className}`} style={{ fontSize: '9px' }}>
          {statusLabel.text}
        </span>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <Icon style={{ fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)', minWidth: '80px' }}>{label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{value}</span>
          </div>
        ))}
      </div>
      {contract.daysUntilExpiry > 0 && contract.status !== 'expired' && (
        <div style={{ marginTop: '12px', fontSize: '10px', color: contract.status === 'expiring' ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
          {contract.daysUntilExpiry} days remaining
        </div>
      )}
    </div>
  )
}

export const AMCContractCard = React.memo(AMCContractCardComponent)
