import type { ReportItem, ReportFilters } from '../types/report.types'

export function deduplicate(items: ReportItem[]): ReportItem[] {
  const seen = new Set<string>()
  const result: ReportItem[] = []
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      result.push(item)
    }
  }
  return result
}

export function sortByTimestamp(items: ReportItem[], order: 'asc' | 'desc' = 'desc'): ReportItem[] {
  return [...items].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return order === 'desc' ? tb - ta : ta - tb
  })
}

export function aggregateReportItems(
  items: ReportItem[],
  filters: ReportFilters,
): { visible: ReportItem[]; total: number } {
  const deduped = deduplicate(items)
  const filtered = deduped.filter((item) => {
    if (filters.category !== 'all' && item.metadata?.category !== filters.category) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q)
      ) return false
    }
    return true
  })
  const sorted = sortByTimestamp(filtered, 'desc')
  return { visible: sorted, total: sorted.length }
}
