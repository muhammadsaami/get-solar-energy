import React from 'react'
import type { ReportFilters, ReportCategory } from '../types/report.types'

interface ReportsFiltersProps {
  filters: ReportFilters
  onFilterChange: (filter: Partial<ReportFilters>) => void
  onSearchChange: (search: string) => void
}

const CATEGORY_FILTERS: { label: string; value: ReportCategory | 'all' }[] = [
  { label: 'All Reports', value: 'all' },
  { label: 'Assessments', value: 'assessment' },
  { label: 'Financial', value: 'financial' },
  { label: 'Technical', value: 'technical' },
  { label: 'Comprehensive', value: 'comprehensive' },
]

function ReportsFiltersComponent({ filters, onFilterChange, onSearchChange }: ReportsFiltersProps) {
  return (
    <div className="timeline-filters" style={{ marginBottom: '20px' }}>
      {CATEGORY_FILTERS.map((f) => (
        <button
          key={f.value}
          className={`filter-btn${filters.category === f.value ? ' active' : ''}`}
          onClick={() => onFilterChange({ category: f.value })}
          data-filter={f.value}
        >
          {f.label}
        </button>
      ))}
      <div style={{ marginLeft: 'auto', minWidth: '180px' }}>
        <input
          type="text"
          placeholder="Search reports..."
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

export const ReportsFilters = React.memo(ReportsFiltersComponent)
