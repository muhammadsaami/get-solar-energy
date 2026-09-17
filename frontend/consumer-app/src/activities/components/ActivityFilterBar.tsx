import React from 'react'
import type { ActivityFilters, ActivityCategory } from '../types/activity.types'

interface ActivityFilterBarProps {
  filters: ActivityFilters
  onFilterChange: (filter: Partial<ActivityFilters>) => void
  onSearchChange: (search: string) => void
}

const CATEGORY_FILTERS: { label: string; value: ActivityCategory | 'all' }[] = [
  { label: 'All Activity', value: 'all' },
  { label: 'Assessments', value: 'assessment' },
  { label: 'Reports', value: 'report' },
  { label: 'Rewards', value: 'reward' },
  { label: 'AI Assistant', value: 'ai' },
  { label: 'System', value: 'system' },
]

export function ActivityFilterBar({ filters, onFilterChange, onSearchChange }: ActivityFilterBarProps) {
  const activeCategory = filters.categories.length === 1 ? filters.categories[0] : 'all'

  return (
    <div className="timeline-filters">
      {CATEGORY_FILTERS.map((f) => (
        <button
          key={f.value}
          className={`filter-btn${activeCategory === f.value ? ' active' : ''}`}
          onClick={() => onFilterChange({ categories: f.value === 'all' ? [] : [f.value as ActivityCategory] })}
          data-filter={f.value}
        >
          {f.label}
        </button>
      ))}
      <div style={{ marginLeft: 'auto', minWidth: '180px' }}>
        <input
          type="text"
          placeholder="Search activity..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'var(--bg-input, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-color)',
            color: 'var(--text-navy)',
            fontSize: '11px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
