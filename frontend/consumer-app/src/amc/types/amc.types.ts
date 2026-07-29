export type ContractStatus = 'active' | 'expiring' | 'expired' | 'none'
export type VisitStatus = 'scheduled' | 'completed' | 'cancelled'
export type AMCStatus = 'idle' | 'loading' | 'success' | 'error'
export type TabId = 'overview' | 'history' | 'recommendation'
export type SystemStatus = 'Healthy' | 'Needs Attention' | 'Critical'

export interface AMCContract {
  id: string
  contractNumber: string
  startDate: string
  endDate: string
  status: ContractStatus
  planName: string
  planType: string
  annualCost: number
  paymentFrequency: string
  nextBillingDate: string | null
  coverageDetails: string[]
  exclusions: string[]
  customerName: string
  customerId: string
  systemSizeKw: number
  address: string
  daysUntilExpiry: number
}

export interface AMCVisit {
  id: string
  visitDate: string
  status: VisitStatus
  technicianName: string | null
  visitType: string
  notes: string | null
  rating: number | null
}

export interface AMCServiceRecord {
  id: string
  serviceDate: string
  serviceType: string
  description: string
  technicianName: string
  cost: number
  warrantyClaim: boolean
  partsUsed: string[]
}

export interface AMCKpiSummary {
  totalContracts: number
  activeContracts: number
  expiringSoon: number
  expiredContracts: number
  nextServiceDate: string | null
  totalSpentThisYear: number
  totalVisitsCompleted: number
  avgRating: number
}

export interface AMCRecommendationRequest {
  customer_name: string
  city: string
  system_size_kw: number
  installation_date: string
  last_service_date: string
  current_generation_units: number
  expected_generation_units: number
  inverter_error_codes: string
  panel_cleaning_done: boolean
  physical_damage_observed: boolean
  damage_details: string
}

export interface AMCRecommendationResult {
  customerName: string
  systemSizeKw: number
  healthScore: number
  systemStatus: SystemStatus
  generationDropPct: number
  monthlyLossRs: number
  nextServiceDue: string
  urgentActionRequired: boolean
  diagnosisSummary: string
  faultAnalysis: string[]
  recommendedActions: string[]
  preventiveMeasures: string[]
  estimatedServiceCostRs: number
  fallback: boolean
}

export interface AMCHealthMetrics {
  overallHealth: number
  systemStatus: SystemStatus
  generationDropPct: number
  monthlyLossRs: number
  nextServiceDue: string
  urgentActionRequired: boolean
}

export interface AMCApiContract {
  id?: string
  contract_number?: string
  start_date?: string
  end_date?: string
  status?: string
  plan_name?: string
  plan_type?: string
  annual_cost?: number
  payment_frequency?: string
  next_billing_date?: string | null
  coverage_details?: string[]
  exclusions?: string[]
  customer_name?: string
  customer_id?: string
  system_size_kw?: number
  address?: string
  visits?: AMCVisit[]
  service_history?: AMCServiceRecord[]
}

export interface AMCBackendRecommendationData {
  customer_name: string
  system_size_kw: number
  health_score: number
  system_status: string
  generation_drop_pct: number
  monthly_loss_rs: number
  next_service_due: string
  urgent_action_required: boolean
  diagnosis_summary: string
  fault_analysis: string[]
  recommended_actions: string[]
  preventive_measures: string[]
  estimated_service_cost_rs: number
}

export interface AMCRecommendationApiResponse {
  success: boolean
  fallback?: boolean
  data?: AMCBackendRecommendationData
  error?: string
}

export interface AMCState {
  contract: AMCContract | null
  kpis: AMCKpiSummary | null
  recommendation: AMCRecommendationResult | null
  serviceHistory: AMCServiceRecord[]
  visits: AMCVisit[]
  loading: boolean
  recommending: boolean
  tab: TabId
  error: { hasError: boolean; message: string } | null
  lastUpdated: string | null
  stale: boolean
}

export const INITIAL_AMC_STATE: AMCState = {
  contract: null,
  kpis: null,
  recommendation: null,
  serviceHistory: [],
  visits: [],
  loading: true,
  recommending: false,
  tab: 'overview',
  error: null,
  lastUpdated: null,
  stale: false,
}
