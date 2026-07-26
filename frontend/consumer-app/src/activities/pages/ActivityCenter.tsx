import React from 'react'
import { useActivityCenter } from '../hooks/useActivityCenter'
import { ActivitySummaryCards } from '../components/ActivitySummaryCards'
import { ActivityAlertsPanel } from '../components/ActivityAlertsPanel'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityFeed } from '../components/ActivityFeed'
import { ActivityEmptyState } from '../components/ActivityEmptyState'
import DashboardSprites from '../../components/dashboard/DashboardSprites'

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
    <>
      <DashboardSprites />
      <div className="tab-content" role="tabpanel" aria-label="activity center" style={{ display: 'block' }}>
        <div className="tab-header-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="tab-heading">Activity Center</h2>
              <p className="tab-subheading">Track chronological events and assessments throughout your solar journey.</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={refresh}
              disabled={loading}
              style={{ padding: '8px 16px', fontSize: '11px', width: 'auto', height: 'auto', flexShrink: 0 }}
            >
              {loading ? '\u23F3' : '\uD83D\uDD04'} {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error?.hasError && (
          <div
            style={{
              marginBottom: '16px',
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(231, 76, 60, 0.06)',
              border: '1px dashed rgba(231, 76, 60, 0.3)',
              textAlign: 'center',
              fontSize: '12px',
              color: '#ef4444',
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
    </>
  )
}
