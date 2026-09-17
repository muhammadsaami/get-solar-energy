import React from 'react'
import { ActivityItem } from './ActivityItem'
import type { ActivityItem as ActivityItemType } from '../types/activity.types'

interface ActivityFeedProps {
  activities: ActivityItemType[]
  loading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

export function ActivityFeed({ activities, loading, hasMore, isLoadingMore, onLoadMore }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="card-base">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="skeleton skeleton-circle" style={{ width: '28px', height: '28px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text wide" style={{ height: '12px' }} />
                <div className="skeleton skeleton-text medium" style={{ height: '10px', marginTop: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <div className="card-base">
      <div className="timeline-container" style={{ position: 'relative', paddingLeft: '24px', minHeight: '100px' }}>
        <div className="timeline-line" style={{ position: 'absolute', left: '8px', top: '5px', bottom: '5px', width: '2px', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activities.map((act) => (
            <ActivityItem key={act.id} activity={act} />
          ))}
        </div>
      </div>
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
          <button
            className="table-action-btn"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
