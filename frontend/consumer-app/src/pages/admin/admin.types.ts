export interface AdminKpi {
  id: string
  label: string
  value: number
  format: 'number' | 'currency' | 'percent' | 'years' | 'kw'
  accent: 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'amber'
  icon: string
  change?: number | null
}

export interface AdminCharts {
  revenueTrend: { month: string; revenue: number }[]
  customerGrowth: { period: string; value: number }[]
  pipelineFunnel: { stage: string; value: number }[]
  forecasting: Record<string, unknown>
}

export interface AdminHealthService {
  status: 'green' | 'amber' | 'red'
  label: string
  detail: string
}

export interface AdminHealth {
  overall: string
  services: AdminHealthService[]
  lastCheck: string
}

export interface AdminPipeline {
  totalLeads: number
  pipelineValue: number
  expectedRevenue: number
  avgDealSize: number
  avgLeadScore: number
  avgHealthScore: number
  winRate: number
  lossRate: number
  stageCounts: Record<string, number>
}

export interface AdminActivity {
  type: string
  eventType: string
  module: string
  user: string
  notes: string
  customerId?: number
  timestamp: string
}

export interface AdminDashboardData {
  kpis: AdminKpi[]
  charts: AdminCharts
  health: AdminHealth
  pipeline: AdminPipeline
  surveyStats: Record<string, number>
  vendorSummary: Record<string, number>
  projectSummary: Record<string, number>
  assistantMetrics: Record<string, number>
  revenueAnalytics: Record<string, unknown>
  geography: Record<string, unknown>[]
  leaderboards: Record<string, unknown>
  alerts: { type: string; title: string; description: string }[]
  insights: Record<string, unknown>
  overview: Record<string, number>
  commandCenter: {
    executiveSummary: string
    totalLeads30d: number
    proposalsSent30d: number
    installationsPending: number
    surveysPending: number
  }
  fetchTime: string
}

export const ACCENT_MAP: Record<string, string> = {
  blue: 'var(--color-blue)',
  green: 'var(--color-green)',
  orange: 'var(--color-orange)',
  amber: 'var(--color-yellow)',
  cyan: 'var(--color-blue)',
  purple: 'var(--color-blue)',
}