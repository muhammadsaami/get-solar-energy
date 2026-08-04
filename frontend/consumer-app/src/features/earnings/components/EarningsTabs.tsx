import React from 'react'

interface EarningsTabsProps {
  activeTab: 'all' | 'paid' | 'pending' | 'processing'
  onTabChange: (tab: 'all' | 'paid' | 'pending' | 'processing') => void
  totalCount: number
  paidCount: number
  pendingCount: number
  processingCount: number
}

export default function EarningsTabs({
  activeTab,
  onTabChange,
  totalCount,
  paidCount,
  pendingCount,
  processingCount,
}: EarningsTabsProps) {
  return (
    <div className="earnings-tabs">
      <button
        className={`earnings-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => onTabChange('all')}
      >
        All Transactions ({totalCount})
      </button>
      <button
        className={`earnings-tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
        onClick={() => onTabChange('paid')}
      >
        Paid ({paidCount})
      </button>
      <button
        className={`earnings-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
        onClick={() => onTabChange('pending')}
      >
        Pending ({pendingCount})
      </button>
      <button
        className={`earnings-tab-btn ${activeTab === 'processing' ? 'active' : ''}`}
        onClick={() => onTabChange('processing')}
      >
        Processing ({processingCount})
      </button>
    </div>
  )
}
