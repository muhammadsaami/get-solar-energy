import React from 'react'
import { MdSearch, MdFilterList } from 'react-icons/md'
import type { EarningsFilters, PayoutStatus } from '../types/earnings.types'
import { EARNING_JOB_TYPES, PAYOUT_STATUSES } from '../constants/earnings.constants'

interface EarningsSearchBarProps {
  filters: EarningsFilters
  onFilterChange: (f: EarningsFilters) => void
}

export default function EarningsSearchBar({ filters, onFilterChange }: EarningsSearchBarProps) {
  return (
    <div className="earnings-toolbar">
      <div className="earnings-filter-row">
        <div className="earnings-search-box">
          <MdSearch style={{ color: '#94a3b8', fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Search work order ID, title, or transaction reference..."
            value={filters.searchQuery}
            onChange={e => onFilterChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFilterList style={{ color: '#94a3b8' }} />
            <select
              className="earnings-select-input"
              value={filters.jobType}
              onChange={e => onFilterChange({ ...filters, jobType: e.target.value })}
            >
              <option value="All">All Job Types</option>
              {EARNING_JOB_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              className="earnings-select-input"
              value={filters.payoutStatus}
              onChange={e => onFilterChange({ ...filters, payoutStatus: e.target.value as PayoutStatus })}
            >
              <option value="All">All Payout Statuses</option>
              {PAYOUT_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
