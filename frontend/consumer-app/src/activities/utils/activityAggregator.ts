import type { ActivityItem, ActivityFilters, ActivityPagination } from '../types/activity.types'
import { applyFilters } from './activityFilters'

export function deduplicate(items: ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>()
  const result: ActivityItem[] = []
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      result.push(item)
    }
  }
  return result
}

export function sortByTimestamp(items: ActivityItem[], order: 'asc' | 'desc' = 'desc'): ActivityItem[] {
  return [...items].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return order === 'desc' ? tb - ta : ta - tb
  })
}

export function sortByPriority(items: ActivityItem[], order: 'asc' | 'desc' = 'desc'): ActivityItem[] {
  const rank = { high: 3, medium: 2, low: 1, none: 0 }
  return [...items].sort((a, b) => {
    const diff = (rank[a.priority] ?? 0) - (rank[b.priority] ?? 0)
    return order === 'desc' ? -diff : diff
  })
}

export function sortByModule(items: ActivityItem[], order: 'asc' | 'desc' = 'asc'): ActivityItem[] {
  return [...items].sort((a, b) => {
    const cmp = a.module.localeCompare(b.module)
    return order === 'asc' ? cmp : -cmp
  })
}

const SORTERS: Record<string, (items: ActivityItem[], order: 'asc' | 'desc') => ActivityItem[]> = {
  timestamp: sortByTimestamp,
  priority: sortByPriority,
  module: sortByModule,
}

export function aggregateActivities(
  items: ActivityItem[],
  filters: ActivityFilters,
  pagination: ActivityPagination,
): { visible: ActivityItem[]; total: number; hasMore: boolean } {
  const deduped = deduplicate(items)
  const filtered = applyFilters(deduped, filters)
  const sorter = SORTERS[filters.sortBy] ?? sortByTimestamp
  const sorted = sorter(filtered, filters.sortOrder)
  const total = sorted.length
  const start = 0
  const end = pagination.page * pagination.limit
  const visible = sorted.slice(start, end)
  const hasMore = end < total
  return { visible, total, hasMore }
}
