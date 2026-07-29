import React from 'react'
import { formatNumber } from '../../utils/referral'
import type { LeaderboardEntry } from '../../types/rewards.types'

interface Props {
  leaderboard: LeaderboardEntry[]
  userEmail: string | undefined
  loading: boolean
}

const RANK_ICONS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49']

export default function Leaderboard({ leaderboard, userEmail, loading }: Props) {
  return (
    <div className="card-base" style={{ '--card-theme': '234, 179, 8' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: '12px' }}>
        <span className="kpi-title">Referral Leaderboard \u2014 Top 10</span>
      </div>
      <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
        <table className="saas-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
              <th style={{ padding: '10px 8px', width: '50px' }}>Rank</th>
              <th style={{ padding: '10px 8px' }}>User</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Points</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-navy)' }}>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Loading leaderboard...
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '28px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{'\uD83C\uDFC5'}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-navy)', marginBottom: '6px' }}>Not Ranked Yet</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '260px', margin: '0 auto 14px' }}>
                    Invite friends and earn rewards to appear on the leaderboard.
                  </div>
                </td>
              </tr>
            ) : (
              leaderboard.map((entry, i) => {
                const isMe = entry.email === userEmail
                const rankDisplay = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : `#${entry.rank}`
                return (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border-color-light)',
                    ...(isMe ? { background: 'rgba(54, 211, 153, 0.08)', fontWeight: 700 } : {}),
                  } as React.CSSProperties}>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>{rankDisplay}</td>
                    <td style={{ padding: '10px 8px' }}>
                      {entry.name}
                      {isMe && (
                        <span style={{ fontSize: '9px', background: 'var(--accent-green)', color: '#fff', padding: '1px 5px', borderRadius: '3px', marginLeft: '6px' }}>
                          YOU
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800 }}>{formatNumber(entry.points)}</td>
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
