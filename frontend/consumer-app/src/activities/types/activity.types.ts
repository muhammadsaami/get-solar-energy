export type ActivityType =
  | 'bill' | 'roof' | 'roi' | 'referral' | 'redemption' | 'task'
  | 'meeting' | 'followup' | 'alert' | 'project' | 'timeline'
  | 'communication' | 'installation' | 'amc' | 'payment' | 'system'
  | 'registration'

export type ActivityModule =
  | 'CRM' | 'BillAnalyzer' | 'RoofAnalysis' | 'ROI'
  | 'Referral' | 'Project' | 'AI' | 'System' | 'AMC' | 'SiteSurvey'

export type ActivityStatus =
  | 'completed' | 'pending' | 'in_progress' | 'cancelled'
  | 'warning' | 'critical' | 'overdue'

export type ActivityPriority = 'high' | 'medium' | 'low' | 'none'

export type ActivityCategory =
  | 'assessment' | 'report' | 'reward' | 'ai' | 'system'
  | 'customer' | 'installation' | 'maintenance' | 'admin'

export interface ActivityItem {
  id: string
  type: ActivityType
  module: ActivityModule
  title: string
  description: string
  status: ActivityStatus
  priority: ActivityPriority
  category: ActivityCategory
  icon: string
  color: string
  timestamp: string
  relativeTime: string
  user: string | null
  customer: { id: number | null; name: string | null } | null
  link: string | null
  metadata: Record<string, unknown>
  source: string
}

export interface ActivitySummaryCards {
  assessmentsCompleted: number
  reportsGenerated: number
  rewardsRedeemed: number
  aiConversations: number
}

export interface ActivityFilters {
  categories: ActivityCategory[]
  modules: ActivityModule[]
  priorities: ActivityPriority[]
  search: string
  sortBy: 'timestamp' | 'priority' | 'module'
  sortOrder: 'asc' | 'desc'
}

export interface ActivityPagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
  isLoadingMore: boolean
}

export interface PerSourceErrors {
  [source: string]: string | null
}

export interface ActivityCenterState {
  activities: ActivityItem[]
  summaryCards: ActivitySummaryCards
  alerts: ActivityItem[]
  loading: boolean
  error: { hasError: boolean; sources: PerSourceErrors; message: string } | null
  filters: ActivityFilters
  pagination: ActivityPagination
}

export const DEFAULT_FILTERS: ActivityFilters = {
  categories: [],
  modules: [],
  priorities: [],
  search: '',
  sortBy: 'timestamp',
  sortOrder: 'desc',
}

export const DEFAULT_PAGINATION: ActivityPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
  isLoadingMore: false,
}

export const DEFAULT_SUMMARY: ActivitySummaryCards = {
  assessmentsCompleted: 0,
  reportsGenerated: 0,
  rewardsRedeemed: 0,
  aiConversations: 0,
}

export interface CrmTimelineEvent {
  id: number
  customer_id: number
  event_type: string
  user: string
  module: string
  status: string | null
  notes: string | null
  created_at: string
}

export interface CrmTask {
  id: number
  customer_id: number | null
  title: string
  department: string
  assigned_to: string | null
  priority: string
  due_date: string
  status: string
  progress: number
  notes: string | null
  created_at: string
}

export interface CrmMeeting {
  id: number
  customer_id: number
  title: string
  meeting_type: string
  scheduled_date: string
  scheduled_time: string
  assigned_to: string | null
  outcome: string | null
  notes: string | null
  next_action: string | null
  created_at: string
}

export interface CrmFollowUp {
  id: number
  customer_id: number
  title: string
  due_date: string
  priority: string
  status: string
  notes: string | null
  created_at: string
}

export interface CrmAlert {
  id: string
  severity: string
  title: string
  description: string
  customer_id: number | null
  customer_name: string | null
}

export interface DashboardStats {
  customers: number
  bills_analyzed: number
  avg_bill: number
  avg_units: number
  avg_payback: number
  avg_system_size: number
  total_system_value: number
  total_25yr_savings: number
  cities: number
  last_import: string | null
  last_bill_uploaded: string | null
}

export interface BillRecord {
  id: number
  customer_id: number
  file_name: string
  billing_period: string
  monthly_units: number
  bill_amount: number
  per_unit_rate: number
  recommended_kw: number
  monthly_savings: number
  annual_savings: number | null
  system_cost: number
  subsidy: number | null
  net_cost: number | null
  payback_years: number
  savings_25yr: number
  created_at: string
}

export interface ReferralHistoryItem {
  referred_email: string
  referred_name: string
  points_earned: number
  status: string
  date: string
}

export interface WalletTransactionItem {
  type: 'credit' | 'debit'
  description: string
  points: number
  date: string
}

export interface ProjectItem {
  id: string
  title: string
  projectType: string
  customerName: string | null
  status: string
  progress: number | null
  priority: string
  startDate: string | null
  targetDate: string | null
  completedDate: string | null
  healthScore: number | null
  createdAt: string | null
  updatedAt: string | null
  stageStartDates: Record<string, string> | null
  stageCompletionDates: Record<string, string> | null
}

export interface ApiSuccessResponse<T> {
  success: true
  message?: string
  data: T
  errors?: string[]
  timestamp?: string
}

export interface AggregatedSource<T> {
  source: string
  data: T | null
  error: string | null
}
