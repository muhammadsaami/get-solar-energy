import React from 'react'

interface QuickFiltersProps {
  activeTab: 'open' | 'applied' | 'saved' | 'recommended' | 'companies'
  onTabChange: (tab: 'open' | 'applied' | 'saved' | 'recommended' | 'companies') => void
  openCount: number
  appliedCount: number
  savedCount: number
  recommendedCount: number
}

export default function QuickFilters({
  activeTab,
  onTabChange,
  openCount,
  appliedCount,
  savedCount,
  recommendedCount,
}: QuickFiltersProps) {
  return (
    <div className="job-tabs">
      <button
        className={`job-tab-btn ${activeTab === 'open' ? 'active' : ''}`}
        onClick={() => onTabChange('open')}
      >
        Open Jobs ({openCount})
      </button>
      <button
        className={`job-tab-btn ${activeTab === 'recommended' ? 'active' : ''}`}
        onClick={() => onTabChange('recommended')}
      >
        Recommended ({recommendedCount})
      </button>
      <button
        className={`job-tab-btn ${activeTab === 'applied' ? 'active' : ''}`}
        onClick={() => onTabChange('applied')}
      >
        Applied ({appliedCount})
      </button>
      <button
        className={`job-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
        onClick={() => onTabChange('saved')}
      >
        Saved ({savedCount})
      </button>
      <button
        className={`job-tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
        onClick={() => onTabChange('companies')}
      >
        Top Hiring Companies
      </button>
    </div>
  )
}
