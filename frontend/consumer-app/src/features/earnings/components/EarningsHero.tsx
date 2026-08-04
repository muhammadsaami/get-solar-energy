import React from 'react'
import { MdAttachMoney, MdAccountBalance, MdVerifiedUser, MdDownload } from 'react-icons/md'

interface EarningsHeroProps {
  onExportClick: () => void
}

export default function EarningsHero({ onExportClick }: EarningsHeroProps) {
  return (
    <div className="earnings-hero">
      <div className="earnings-hero-header">
        <div className="earnings-hero-title-group">
          <h1>
            <MdAttachMoney style={{ color: '#10b981' }} /> Technician Earnings & Payouts
          </h1>
          <p>
            Track your verified solar installation payouts, AMC servicing earnings, pending bank transfers, and financial transaction history.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={onExportClick}
        >
          <MdDownload /> Export Statement
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdAccountBalance style={{ color: '#00aeef' }} /> Settlement Method: <strong style={{ color: '#ffffff' }}>Direct Bank Transfer (NEFT/IMPS)</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdVerifiedUser style={{ color: '#10b981' }} /> Payout Audit: <strong style={{ color: '#ffffff' }}>Auto-Generated on Work Order Completion</strong>
        </div>
      </div>
    </div>
  )
}
