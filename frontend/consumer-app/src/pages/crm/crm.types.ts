export const PIPELINE_STAGES = [
  'New Lead',
  'Qualified',
  'Site Survey Scheduled',
  'Survey Completed',
  'Proposal Generated',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Closed',
  'Lost',
] as const

export type PipelineStage = typeof PIPELINE_STAGES[number]

export interface CrmKpi {
  id: string
  label: string
  value: number
  format: 'number' | 'currency' | 'percent' | 'score'
  accent: 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'amber' | 'red'
  icon: string
  change?: number | null
}

export interface CrmPipelineMetrics {
  totalLeads: number
  pipelineValue: number
  expectedRevenue: number
  avgDealSize: number
  avgLeadScore: number
  avgHealthScore: number
  winRate: number
  lossRate: number
  pipelineVelocity: number
  avgSalesCycle: number
  stageCounts: Record<string, number>
  stageValues: Record<string, number>
  stageExpected: Record<string, number>
  avgDaysInStage: Record<string, number>
  stageProbabilities: Record<string, number>
}

export interface CrmCustomer {
  id: number
  consumerNumber: string
  customerName: string
  discom: string
  city: string
  phone: string | null
  email: string | null
  state: string | null
  pincode: string | null
  status: PipelineStage | string
  salesperson: string | null
  leadScore: number
  healthScore: number
  pipelineValue: number
  expectedRevenue: number
  nextFollowup: string | null
  lastActivity: string | null
  createdAt: string
  updatedAt: string
}

export interface CrmAlert {
  id: string
  severity: 'Warning' | 'Critical'
  title: string
  description: string
  customerId: number
  customerName: string
}

export interface CrmCustomerProfile {
  id: number
  consumerNumber: string
  customerName: string
  discom: string
  city: string
  phone: string | null
  email: string | null
  address: string | null
  state: string | null
  pincode: string | null
  status: string
  salesperson: string | null
  leadScore: number
  healthScore: number
  pipelineValue: number
  expectedRevenue: number
  nextFollowup: string | null
  lastActivity: string | null
  createdAt: string
  updatedAt: string
}

export interface CrmBillSummary {
  id: number
  billingPeriod: string
  monthlyUnits: number
  billAmount: number
  perUnitRate: number
  recommendedKw: number
  monthlySavings: number
  annualSavings: number
  systemCost: number
  subsidy: number
  netCost: number
  paybackYears: number
  savings25yr: number
  createdAt: string
}

export interface CrmRoofAnalysis {
  usableAreaSqft: number
  suitabilityScore: number
  obstructionFactor: number | null
  azimuthDirection: string | null
}

export interface CrmSurveyInfo {
  id: number
  status: string
  scheduledDate: string | null
  completedDate: string | null
  surveyorName: string | null
  findings: string | null
}

export interface CrmProposalInfo {
  proposalRef: string | null
  recommendedKw: number | null
  netSystemCost: number | null
  paybackYears: number | null
  savings25yr: number | null
}

export interface CrmInstallationInfo {
  currentStage: string | null
  completionPercentage: number | null
  assignedEngineer: string | null
}

export interface CrmAmcInfo {
  contractNumber: string | null
  warrantyStatus: string | null
  serviceFrequency: string | null
  nextService: string | null
  expiryDate: string | null
  status: string | null
}

export interface CrmTaskItem {
  id: number
  title: string
  department: string | null
  assignedTo: string | null
  priority: string
  dueDate: string | null
  status: string
  progress: number | null
  notes: string | null
  createdAt: string
}

export interface CrmMeetingItem {
  id: number
  title: string
  meetingType: string
  scheduledDate: string | null
  scheduledTime: string | null
  assignedTo: string | null
  outcome: string | null
}

export interface CrmFollowUpItem {
  id: number
  title: string
  dueDate: string | null
  priority: string
  status: string
  notes: string | null
}

export interface CrmDocumentItem {
  id: number
  documentType: string
  originalFilename: string
  fileSize: number
  mimeType: string
  verificationStatus: string
  createdAt: string
}

export interface CrmCommunicationItem {
  id: number
  channel: string
  subject: string
  message: string
  sender: string
  receiver: string
  deliveryStatus: string
  createdAt: string
}

export interface CrmCustomer360 {
  customer: CrmCustomerProfile
  bills: CrmBillSummary[]
  roofAnalysis: CrmRoofAnalysis | null
  siteSurvey: CrmSurveyInfo | null
  proposal: CrmProposalInfo | null
  installation: CrmInstallationInfo | null
  amc: CrmAmcInfo | null
  tasks: CrmTaskItem[]
  meetings: CrmMeetingItem[]
  followUps: CrmFollowUpItem[]
  leadScore: number
  healthScore: number
  clv: number
  projectProgress: number
  installationProgress: number
  paymentProgress: number
  nextFollowup: string | null
  lastActivity: string | null
  lastCommunication: string | null
  pipelineStatus: string
}

export interface TimelineEvent {
  id: number
  eventType: string
  module: string
  user: string
  status: string
  notes: string
  customerId: number
  createdAt: string
}
