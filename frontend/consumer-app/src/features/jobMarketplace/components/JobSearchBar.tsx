import React from 'react'
import { MdSearch, MdFilterList, MdSort, MdClose } from 'react-icons/md'
import type { JobMarketplaceFilters, JobSortOption, JobType } from '../types/jobMarketplace.types'
import { POPULAR_CITIES, JOB_TYPES } from '../constants/jobMarketplace.constants'
import { DEFAULT_FILTERS } from '../constants/jobMarketplace.constants'

interface JobSearchBarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  filters: JobMarketplaceFilters
  onFilterChange: (f: JobMarketplaceFilters) => void
  sortBy: JobSortOption
  onSortChange: (s: JobSortOption) => void
  resultCount: number
}

export default function JobSearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  resultCount,
}: JobSearchBarProps) {
  const hasActiveFilters =
    filters.city !== 'All' ||
    filters.jobType !== 'All' ||
    searchQuery.trim().length > 0 ||
    filters.salaryMin > 0

  const handleClearAll = () => {
    onSearchChange('')
    onFilterChange(DEFAULT_FILTERS)
  }

  return (
    <div className="job-toolbar">
      <div className="job-filter-row">
        <div className="job-search-box">
          <MdSearch className="job-search-icon" />
          <input
            type="text"
            placeholder="Search job title, skills, location, or vendor company..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="job-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <MdClose />
            </button>
          )}
        </div>

        <div className="job-filter-controls">
          <div className="job-select-wrapper">
            <MdFilterList className="job-filter-icon" />
            <select
              className="job-select-input"
              value={filters.city}
              onChange={e => onFilterChange({ ...filters, city: e.target.value })}
            >
              <option value="All">All Locations</option>
              {POPULAR_CITIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="job-select-wrapper">
            <select
              className="job-select-input"
              value={filters.jobType}
              onChange={e => onFilterChange({ ...filters, jobType: e.target.value as JobType | 'All' })}
            >
              <option value="All">All Job Types</option>
              {JOB_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="job-select-wrapper">
            <MdSort className="job-filter-icon" />
            <select
              className="job-select-input"
              value={sortBy}
              onChange={e => onSortChange(e.target.value as JobSortOption)}
            >
              <option value="recent">Sort by Most Recent</option>
              <option value="salary">Sort by Highest Budget</option>
              <option value="match">Sort by Profile Match</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Result Counter */}
      <div className="job-filter-status-bar">
        <span className="job-result-count">
          Showing <strong>{resultCount}</strong> matching work order{resultCount === 1 ? '' : 's'}
        </span>

        {hasActiveFilters && (
          <div className="job-chips-group">
            {filters.city !== 'All' && (
              <span className="job-filter-chip">
                City: {filters.city}
                <button
                  className="job-chip-remove"
                  onClick={() => onFilterChange({ ...filters, city: 'All' })}
                  title="Remove city filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.jobType !== 'All' && (
              <span className="job-filter-chip">
                Type: {filters.jobType}
                <button
                  className="job-chip-remove"
                  onClick={() => onFilterChange({ ...filters, jobType: 'All' })}
                  title="Remove job type filter"
                >
                  ×
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="job-filter-chip">
                Search: "{searchQuery}"
                <button
                  className="job-chip-remove"
                  onClick={() => onSearchChange('')}
                  title="Remove search query"
                >
                  ×
                </button>
              </span>
            )}

            <button className="job-clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
