import React from 'react'
import { formatNumber, getStatusBadgeStyle } from '../../utils/referral'
import type { ReferralHistoryEntry } from '../../types/rewards.types'

interface Props {
  history: ReferralHistoryEntry[]
  loading: boolean
}

export default function ReferralHistoryTable({ history, loading }: Props) {
  return (
    <div className="card-base" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: '12px' }}>
        <span className="kpi-title">Referral History</span>
      </div>
      <div className="table-responsive-wrapper" style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
        <table className="saas-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
              <th style={{ padding: '10px 8px' }}>Referred User</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px' }}>Points Earned</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-navy)' }}>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Loading referral history...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No referrals yet. Share your code to get started!
                </td>
              </tr>
            ) : (
              history.map((h, i) => {
                const badge = getStatusBadgeStyle(h.status)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color-light)' }}>
                    <td style={{ padding: '10px 8px' }}>{h.referred_name || h.referred_email}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}><strong>{formatNumber(h.points_earned)}</strong></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
