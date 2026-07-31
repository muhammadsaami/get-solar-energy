import React from 'react'
import { MdFilterAlt, MdClose } from 'react-icons/md'
import { FILTER_CONFIG } from '../config/filterConfig'

export default function FilterBar({ activeFilters, onFilterChange, onClear }) {
  const activeCount = Object.values(activeFilters || {}).reduce((sum, values) => sum + (values?.length || 0), 0)

  return (
    <div className="kb-filter-bar">
      {FILTER_CONFIG.map((filter) => {
        const selected = activeFilters?.[filter.id] || []
        return (
          <label key={filter.id} className="form-group kb-filter-group">
            <span className="form-label">{filter.label}</span>
            <select
              className="form-select"
              value={selected.length === 1 ? selected[0] : ''}
              onChange={(e) => {
                const next = e.target.value ? [e.target.value] : []
                onFilterChange(filter.id, next)
              }}
              aria-label={`Filter by ${filter.label.toLowerCase()}`}
            >
              <option value="">All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        )
      })}

      <label className="form-group kb-filter-group">
        <span className="form-label">Bookmarked</span>
        <select
          className="form-select"
          value={activeFilters?.bookmarked?.includes('true') ? 'true' : ''}
          onChange={(e) => onFilterChange('bookmarked', e.target.value ? ['true'] : [])}
          aria-label="Filter by bookmarked status"
        >
          <option value="">All</option>
          <option value="true">Bookmarked</option>
        </select>
      </label>

      <div className="kb-filter-actions">
        {activeCount > 0 ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            <MdClose size={14} />
            Clear ({activeCount})
          </button>
        ) : (
          <span className="kb-filter-idle">
            <MdFilterAlt size={14} />
            Filters
          </span>
        )}
      </div>
    </div>
  )
}
