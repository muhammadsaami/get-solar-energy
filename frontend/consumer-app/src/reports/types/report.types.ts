export type ReportCategory = 'assessment' | 'financial' | 'technical' | 'comprehensive'

export type ReportGenerationSource = 'bill' | 'roof' | 'roi' | 'comprehensive' | 'stats' | 'project' | 'referral'

export type ReportItemStatus = 'completed' | 'pending' | 'failed'

export type ReportHistorySortField = 'reportName' | 'version' | 'createdDate' | 'downloads' | 'status'

export type ExportFormat = 'csv' | 'pdf' | 'png'

export interface ReportTemplate {
  id: string
  title: string
  description: string
  icon: string
  category: ReportCategory
  theme: string
  displayOrder: number
  includes: string[]
  supportsCSV: boolean
  supportsPDF: boolean
  supportsPreview: boolean
  estimatedGenerationTime: string
  emptyStateMessage: string
  requiredPermissions: string[]
  generateConfig: {
    endpoint: string | null
    method: 'GET' | 'POST'
    params?: Record<string, string>
  }
  previewConfig: {
    endpoint: string | null
  }
  downloadConfig: {
    endpoint: string | null
  }
}

export interface ReportItem {
  id: string
  source: ReportGenerationSource
  templateId: string
  title: string
  description: string
  timestamp: string
  relativeTime: string
  status: ReportItemStatus
  metadata: Record<string, unknown>
}

export interface ReportHistoryItem {
  id: string
  reportName: string
  version: number
  createdDate: string
  downloadCount: number
  status: ReportItemStatus
  templateId: string
}

export interface ReportSummary {
  totalReportsGenerated: number
  totalReportsDownloaded: number
  assessmentsCompleted: number
  reportsGeneratedThisMonth: number
}

export interface ReportFilters {
  category: ReportCategory | 'all'
  search: string
}

export interface ReportExport {
  format: ExportFormat
  templateId: string
  data: unknown
  filename: string
}

export interface ReportSourceResult {
  stats: unknown
  bills: unknown[] | null
  roi: unknown
  referralSummary: Record<string, unknown> | null
  projectMetrics: Record<string, unknown> | null
  errors: Record<string, string | null>
}

export interface ReportsCenterState {
  summaryCards: ReportSummary
  reportItems: ReportItem[]
  history: ReportHistoryItem[]
  loading: boolean
  error: { hasError: boolean; sources: Record<string, string | null>; message: string } | null
  filters: ReportFilters
  generatingTemplateId: string | null
}

export const DEFAULT_REPORT_SUMMARY: ReportSummary = {
  totalReportsGenerated: 0,
  totalReportsDownloaded: 0,
  assessmentsCompleted: 0,
  reportsGeneratedThisMonth: 0,
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  category: 'all',
  search: '',
}
