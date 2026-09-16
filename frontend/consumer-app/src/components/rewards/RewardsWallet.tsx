import React from 'react'
import { formatNumber } from '../../utils/referral'
import type { WalletTransaction } from '../../types/rewards.types'

interface Props {
  totalPoints: number
  walletValue: number
  transactions: WalletTransaction[]
  loading: boolean
}

export default function RewardsWallet({ totalPoints, walletValue, transactions, loading }: Props) {
  return (
    <div className="card-base" style={{ '--card-theme': '23, 168, 229', marginBottom: '20px' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: '12px' }}>
        <span className="kpi-title">Rewards Wallet</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px', alignItems: 'start' }}>
        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Current Points</span>
          <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-blue)' }}>
            {loading ? '\u2014' : formatNumber(totalPoints)}
          </span>
        </div>
        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Wallet Value</span>
          <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-green)' }}>
            {loading ? '\u2014' : `\u20B9${formatNumber(walletValue)}`}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Recent Transactions</span>
          <div id="rwdTransactionsList" style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '11px' }}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '11px' }}>No transactions yet.</div>
            ) : (
              transactions.slice(0, 10).map((t, i) => {
                const isCredit = t.type === 'credit'
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    background: 'var(--bg-input)',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    fontSize: '11px',
                  }}>
                    <span style={{ color: 'var(--text-navy)' }}>{t.description}</span>
                    <span style={{ fontWeight: 800, color: isCredit ? 'var(--accent-green)' : '#ef4444' }}>
                      {isCredit ? '+' : ''}{formatNumber(t.points)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
