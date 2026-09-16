import type {
  AMCContract,
  AMCKpiSummary,
  AMCVisit,
  AMCServiceRecord,
  AMCRecommendationResult,
  AMCRecommendationApiResponse,
  AMCApiContract,
  AMCHealthMetrics,
  AMCBackendRecommendationData,
  SystemStatus,
} from '../types/amc.types'

function safeStr(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  return fallback
}

function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && !Number.isNaN(val)) return val
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return !Number.isNaN(parsed) ? parsed : fallback
  }
  return fallback
}

function safeDate(val: unknown): string {
  if (!val) return ''
  const s = safeStr(val)
  if (!s) return ''
  try {
    return new Date(s).toISOString()
  } catch {
    return s
  }
}

function safeBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toLowerCase() === 'true'
  return false
}

function safeArray<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : []
}

function computeDaysUntilExpiry(endDate: string): number {
  if (!endDate) return 0
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function computeContractStatus(status: string | undefined, daysUntilExpiry: number): 'active' | 'expiring' | 'expired' | 'none' {
  if (!status || status === 'none') return 'none'
  if (status === 'expired' || status === 'Cancelled') return 'expired'
  if (daysUntilExpiry <= 0) return 'expired'
  if (daysUntilExpiry <= 60) return 'expiring'
  return 'active'
}

function mapVisit(raw: unknown): AMCVisit {
  const r = (raw || {}) as Record<string, unknown>
  return {
    id: safeStr(r.id),
    visitDate: safeDate(r.visit_date || r.visitDate),
    status: (safeStr(r.status) as AMCVisit['status']) || 'scheduled',
    technicianName: safeStr(r.technician_name || r.technicianName || r.engineer) || null,
    visitType: safeStr(r.visit_type || r.visitType || 'Service Visit'),
    notes: safeStr(r.notes || r.remarks) || null,
    rating: safeNum(r.rating) || null,
  }
}

function mapServiceRecord(raw: unknown): AMCServiceRecord {
  const r = (raw || {}) as Record<string, unknown>
  return {
    id: safeStr(r.id),
    serviceDate: safeDate(r.service_date || r.serviceDate),
    serviceType: safeStr(r.service_type || r.serviceType),
    description: safeStr(r.description),
    technicianName: safeStr(r.technician_name || r.technicianName || r.engineer),
    cost: safeNum(r.cost),
    warrantyClaim: safeBool(r.warranty_claim || r.warrantyClaim),
    partsUsed: safeArray<string>(r.parts_used || r.partsUsed),
  }
}

export function mapAMCContract(raw: AMCApiContract | null): AMCContract | null {
  if (!raw) return null

  const endDate = safeDate(raw.end_date)
  const daysUntilExpiry = computeDaysUntilExpiry(endDate)
  const status = computeContractStatus(raw.status, daysUntilExpiry)

  return {
    id: safeStr(raw.id),
    contractNumber: safeStr(raw.contract_number),
    startDate: safeDate(raw.start_date),
    endDate,
    status,
    planName: safeStr(raw.plan_name, 'AMC Plan'),
    planType: safeStr(raw.plan_type, 'Standard'),
    annualCost: safeNum(raw.annual_cost),
    paymentFrequency: safeStr(raw.payment_frequency, 'Annual'),
    nextBillingDate: safeDate(raw.next_billing_date) || null,
    coverageDetails: safeArray<string>(raw.coverage_details),
    exclusions: safeArray<string>(raw.exclusions),
    customerName: safeStr(raw.customer_name),
    customerId: safeStr(raw.customer_id),
    systemSizeKw: safeNum(raw.system_size_kw),
    address: safeStr(raw.address),
    daysUntilExpiry,
  }
}

export function mapAMCKpis(
  contract: AMCContract | null,
  visits: AMCVisit[],
  serviceHistory: AMCServiceRecord[],
): AMCKpiSummary {
  if (!contract) {
    return {
      totalContracts: 0,
      activeContracts: 0,
      expiringSoon: 0,
      expiredContracts: 0,
      nextServiceDate: null,
      totalSpentThisYear: 0,
      totalVisitsCompleted: 0,
      avgRating: 0,
    }
  }

  const completedVisits = visits.filter((v) => v.status === 'completed')
  const avgRating = completedVisits.length > 0
    ? completedVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / completedVisits.length
    : 0

  const upcoming = visits
    .filter((v) => v.status === 'scheduled')
    .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())

  return {
    totalContracts: 1,
    activeContracts: contract.status === 'active' ? 1 : 0,
    expiringSoon: contract.status === 'expiring' ? 1 : 0,
    expiredContracts: contract.status === 'expired' ? 1 : 0,
    nextServiceDate: upcoming.length > 0 ? upcoming[0].visitDate : null,
    totalSpentThisYear: serviceHistory.reduce((sum, r) => sum + r.cost, 0),
    totalVisitsCompleted: completedVisits.length,
    avgRating: Math.round(avgRating * 10) / 10,
  }
}

export function mapAMCVisits(raw: unknown[] | undefined): AMCVisit[] {
  if (!raw) return []
  return raw.map(mapVisit)
}

export function mapAMCServiceHistory(raw: unknown[] | undefined): AMCServiceRecord[] {
  if (!raw) return []
  return raw.map(mapServiceRecord)
}

function mapSystemStatus(raw: string): SystemStatus {
  if (raw === 'Healthy' || raw === 'Needs Attention' || raw === 'Critical') return raw
  return 'Needs Attention'
}

export function mapAMCRecommendation(
  raw: AMCRecommendationApiResponse | null,
): AMCRecommendationResult | null {
  if (!raw?.success || !raw.data) return null
  const d: AMCBackendRecommendationData = raw.data

  return {
    customerName: safeStr(d.customer_name),
    systemSizeKw: safeNum(d.system_size_kw),
    healthScore: safeNum(d.health_score),
    systemStatus: mapSystemStatus(safeStr(d.system_status)),
    generationDropPct: safeNum(d.generation_drop_pct),
    monthlyLossRs: safeNum(d.monthly_loss_rs),
    nextServiceDue: safeDate(d.next_service_due),
    urgentActionRequired: safeBool(d.urgent_action_required),
    diagnosisSummary: safeStr(d.diagnosis_summary),
    faultAnalysis: safeArray<string>(d.fault_analysis),
    recommendedActions: safeArray<string>(d.recommended_actions),
    preventiveMeasures: safeArray<string>(d.preventive_measures),
    estimatedServiceCostRs: safeNum(d.estimated_service_cost_rs),
    fallback: !!raw.fallback,
  }
}

export function mapAMCHealth(
  recommendation: AMCRecommendationResult | null,
): AMCHealthMetrics | null {
  if (!recommendation || !recommendation.healthScore) return null

  return {
    overallHealth: recommendation.healthScore,
    systemStatus: recommendation.systemStatus,
    generationDropPct: recommendation.generationDropPct,
    monthlyLossRs: recommendation.monthlyLossRs,
    nextServiceDue: recommendation.nextServiceDue,
    urgentActionRequired: recommendation.urgentActionRequired,
  }
}
