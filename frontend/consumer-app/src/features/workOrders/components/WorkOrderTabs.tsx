import React from 'react'

interface WorkOrderTabsProps {
  activeTab: 'all' | 'assigned' | 'inProgress' | 'completed'
  onTabChange: (tab: 'all' | 'assigned' | 'inProgress' | 'completed') => void
  totalCount: number
  assignedCount: number
  inProgressCount: number
  completedCount: number
}

export default function WorkOrderTabs({
  activeTab,
  onTabChange,
  totalCount,
  assignedCount,
  inProgressCount,
  completedCount,
}: WorkOrderTabsProps) {
  return (
    <div className="wo-tabs">
      <button
        className={`wo-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => onTabChange('all')}
      >
        All Orders ({totalCount})
      </button>
      <button
        className={`wo-tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
        onClick={() => onTabChange('assigned')}
      >
        Assigned ({assignedCount})
      </button>
      <button
        className={`wo-tab-btn ${activeTab === 'inProgress' ? 'active' : ''}`}
        onClick={() => onTabChange('inProgress')}
      >
        In Progress ({inProgressCount})
      </button>
      <button
        className={`wo-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
        onClick={() => onTabChange('completed')}
      >
        Completed ({completedCount})
      </button>
    </div>
  )
}
