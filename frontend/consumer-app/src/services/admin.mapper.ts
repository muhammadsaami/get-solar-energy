import type { AdminDashboardData, AdminActivity, AdminHealth } from '../pages/admin/admin.types'

function snakeToCamel(str: string): string {
  return str.replace(/_(\w)/g, (_, c) => c.toUpperCase())
}

function deepMapKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(deepMapKeys)
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeToCamel(key)] = deepMapKeys(value)
    }
    return result
  }
  return obj
}

export function mapDashboardData(raw: Record<string, unknown>): AdminDashboardData {
  return {
    kpis: raw.kpis as AdminDashboardData['kpis'],
    charts: deepMapKeys(raw.charts) as AdminDashboardData['charts'],
    health: deepMapKeys(raw.health) as AdminDashboardData['health'],
    pipeline: deepMapKeys(raw.pipeline) as AdminDashboardData['pipeline'],
    surveyStats: deepMapKeys(raw.survey_stats) as AdminDashboardData['surveyStats'],
    vendorSummary: deepMapKeys(raw.vendor_summary) as AdminDashboardData['vendorSummary'],
    projectSummary: deepMapKeys(raw.project_summary) as AdminDashboardData['projectSummary'],
    assistantMetrics: deepMapKeys(raw.assistant_metrics) as AdminDashboardData['assistantMetrics'],
    revenueAnalytics: raw.revenue_analytics as AdminDashboardData['revenueAnalytics'],
    geography: raw.geography as AdminDashboardData['geography'],
    leaderboards: raw.leaderboards as AdminDashboardData['leaderboards'],
    alerts: raw.alerts as AdminDashboardData['alerts'],
    insights: raw.insights as AdminDashboardData['insights'],
    overview: raw.overview as AdminDashboardData['overview'],
    commandCenter: deepMapKeys(raw.command_center) as AdminDashboardData['commandCenter'],
    fetchTime: raw.fetch_time as string,
  }
}

export function mapActivityItems(raw: Record<string, unknown>[]): AdminActivity[] {
  return (raw || []).map(item => deepMapKeys(item) as AdminActivity)
}

export function mapHealthData(raw: Record<string, unknown>): AdminHealth {
  return deepMapKeys(raw) as AdminHealth
}
