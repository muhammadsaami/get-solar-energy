import React from 'react'
import type { CanonicalEarning, PayoutStatus } from '../types/earnings.types'
import { MdWork, MdAccessTime, MdChevronRight, MdReceipt } from 'react-icons/md'

interface EarningCardProps {
  earning: CanonicalEarning
  onSelect: (earning: CanonicalEarning) => void
}

export default function EarningCard({ earning, onSelect }: EarningCardProps) {
  const getStatusClass = (status: PayoutStatus) => {
    switch (status) {
      case 'Paid': return 'paid'
      case 'Pending': return 'pending'
      case 'Processing': return 'processing'
      default: return ''
    }
  }

  return (
    <div className="earnings-card">
      <div className="earnings-card-header">
        <div>
          <h3 className="earnings-card-title">{earning.workOrderTitle}</h3>
          <div className="earnings-meta-row">
            <span className="earnings-meta-item">
              <MdWork style={{ color: '#00aeef' }} /> {earning.jobType}
            </span>
            <span className="earnings-meta-item">
              <MdAccessTime style={{ color: '#94a3b8' }} /> {earning.createdTimeAgo}
            </span>
          </div>
        </div>

        <span className={`earnings-payout-pill ${getStatusClass(earning.payoutStatus)}`}>
          {earning.payoutStatus}
        </span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdReceipt style={{ color: '#f7931e' }} /> {earning.transactionRef}
        </span>
        <span style={{ color: '#94a3b8' }}>WO #{earning.workOrderId}</span>
      </div>

      <div className="earnings-card-footer">
        <div>
          <span className="earnings-amount-lbl">Payout Amount</span>
          <span className="earnings-amount-val">₹{earning.amount.toLocaleString('en-IN')}</span>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={() => onSelect(earning)}>
          Payout Details <MdChevronRight />
        </button>
      </div>
    </div>
  )
}
