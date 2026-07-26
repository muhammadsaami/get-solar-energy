import type { ActivityItem, ActivityFilters, ActivityCategory, ActivityModule, ActivityPriority } from '../types/activity.types'

export function applyFilters(items: ActivityItem[], filters: ActivityFilters): ActivityItem[] {
  return items.filter((item) => {
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false
    if (filters.modules.length > 0 && !filters.modules.includes(item.module)) return false
    if (filters.priorities.length > 0 && !filters.priorities.includes(item.priority)) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q)
      ) return false
    }
    return true
  })
}

export function parseCategoryFilter(value: string): ActivityCategory | null {
  const valid: ActivityCategory[] = ['assessment', 'report', 'reward', 'ai', 'system', 'customer', 'installation', 'maintenance', 'admin']
  return valid.includes(value as ActivityCategory) ? (value as ActivityCategory) : null
}

export function parseModuleFilter(value: string): ActivityModule | null {
  const valid: ActivityModule[] = ['CRM', 'BillAnalyzer', 'RoofAnalysis', 'ROI', 'Referral', 'Project', 'AI', 'System', 'AMC', 'SiteSurvey']
  return valid.includes(value as ActivityModule) ? (value as ActivityModule) : null
}

export function parsePriorityFilter(value: string): ActivityPriority | null {
  const valid: ActivityPriority[] = ['high', 'medium', 'low', 'none']
  return valid.includes(value as ActivityPriority) ? (value as ActivityPriority) : null
}
