import React from 'react'
import { MdSearch, MdFilterList } from 'react-icons/md'
import type { WorkOrdersFilters, WorkOrderStatus } from '../types/workOrders.types'
import { WORK_ORDER_CITIES, WORK_ORDER_TYPES, WORK_ORDER_STATUSES } from '../constants/workOrders.constants'

interface WorkOrderSearchBarProps {
  filters: WorkOrdersFilters
  onFilterChange: (f: WorkOrdersFilters) => void
}

export default function WorkOrderSearchBar({ filters, onFilterChange }: WorkOrderSearchBarProps) {
  return (
    <div className="wo-toolbar">
      <div className="wo-filter-row">
        <div className="wo-search-box">
          <MdSearch style={{ color: '#94a3b8', fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Search work order title, customer, city, or field notes..."
            value={filters.searchQuery}
            onChange={e => onFilterChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>

        <div className="wo-filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFilterList style={{ color: '#94a3b8' }} />
            <select
              className="wo-select-input"
              value={filters.city}
              onChange={e => onFilterChange({ ...filters, city: e.target.value })}
            >
              <option value="All">All Cities</option>
              {WORK_ORDER_CITIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              className="wo-select-input"
              value={filters.jobType}
              onChange={e => onFilterChange({ ...filters, jobType: e.target.value })}
            >
              <option value="All">All Job Types</option>
              {WORK_ORDER_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              className="wo-select-input"
              value={filters.status}
              onChange={e => onFilterChange({ ...filters, status: e.target.value as WorkOrderStatus })}
            >
              <option value="All">All Statuses</option>
              {WORK_ORDER_STATUSES.map(s => (
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
