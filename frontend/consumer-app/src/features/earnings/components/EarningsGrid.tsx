import React from 'react'
import type { CanonicalEarning } from '../types/earnings.types'
import EarningCard from './EarningCard'

interface EarningsGridProps {
  earnings: CanonicalEarning[]
  onSelect: (earning: CanonicalEarning) => void
}

export default function EarningsGrid({ earnings, onSelect }: EarningsGridProps) {
  if (earnings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: 'rgba(8, 24, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        No payout transaction records match your search or filter criteria.
      </div>
    )
  }

  return (
    <div className="earnings-card-grid">
      {earnings.map(earning => (
        <EarningCard key={earning.id} earning={earning} onSelect={onSelect} />
      ))}
    </div>
  )
}
