import React from 'react'
import { useActivityCenter } from '../hooks/useActivityCenter'
import { ActivitySummaryCards } from '../components/ActivitySummaryCards'
import { ActivityAlertsPanel } from '../components/ActivityAlertsPanel'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityFeed } from '../components/ActivityFeed'
import { ActivityEmptyState } from '../components/ActivityEmptyState'

export default function ActivityCenter() {
  const {
    activities,
    summaryCards,
    alerts,
    loading,
    error,
    filters,
    pagination,
    refresh,
    setFilter,
    setSearch,
    loadMore,
  } = useActivityCenter()

  return (
    <div className="ew-page" role="tabpanel" aria-label="activity center">
      <header className="ew-mission-bar" role="banner" aria-label="Activity Center Header">
        <div className="ew-mission-scope">
          <span className="ew-live-dot" />
          <span className="ew-scope-badge">LOGS / AUDIT-FEED</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Chronological Solar Journey &amp; Milestones</span>
        </div>

        <div className="ew-mission-stats">
          <div className="ew-mission-stat-item">
            <span>Events Tracked:</span>
            <strong style={{ color: 'var(--color-cyan)' }}>{activities.length}</strong>
          </div>
        </div>

        <div className="ew-mission-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={refresh}
            disabled={loading}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {loading ? 'Refreshing...' : 'Refresh Activity'}
          </button>
        </div>
      </header>

      {error?.hasError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontSize: '12px',
            color: 'var(--color-red)',
            fontWeight: 600,
          }}
        >
          {error.message}
        </div>
      )}

      <ActivitySummaryCards summary={summaryCards} />
      <ActivityAlertsPanel alerts={alerts} loading={loading} />
      <ActivityFilterBar filters={filters} onFilterChange={setFilter} onSearchChange={setSearch} />
      <ActivityFeed
        activities={activities}
        loading={loading}
        hasMore={pagination.hasMore}
        isLoadingMore={pagination.isLoadingMore}
        onLoadMore={loadMore}
      />
      {!loading && activities.length === 0 && <ActivityEmptyState />}
    </div>
  )
}
