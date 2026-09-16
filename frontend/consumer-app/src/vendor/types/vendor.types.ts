export interface VendorKpis {
  todaysJobs: number
  activeInstallations: number
  pendingSiteVisits: number
  overdueWorkOrders: number
  slaCompliance: number
  escalatedIssues: number
  amcVisitsThisWeek: number
  completionRate: number
  totalProjects: number
  activeProjects: number
  delayedProjects: number
  avgHealthScore: number
  avgProgress: number
  surveysToday?: number
  surveysPending?: number
  surveysApproved?: number
  surveysOnSite?: number
  surveysReview?: number
  totalSurveys?: number
}

export interface VendorVisit {
  id: number
  title: string
  customerId: number
  scheduledDate: string
  scheduledTime: string
  meetingType: string
  outcome?: string
}

export interface VendorTask {
  id: number
  title: string
  priority: string
  dueDate: string
  status: string
  overdueDays?: number
  customerId?: number
  department?: string
  assignedTo?: string
  progress?: number
  notes?: string
}

export interface VendorAlert {
  type: string
  severity: 'critical' | 'warning'
  title: string
  description: string
  taskId?: number
  customerId?: number
  projectId?: string
}

export interface VendorDashboardData {
  kpis: VendorKpis
  projects: unknown[]
  todaysVisits: VendorVisit[]
  upcomingVisits: VendorVisit[]
  todaysTasks: VendorTask[]
  overdueTasks: VendorTask[]
  team: string
}

export interface VendorAlertsData {
  alerts: VendorAlert[]
  total: number
  critical: number
}

// ── Phase 5: Vendor Inventory Types ─────────────────────────────────────
export interface VendorInventoryItem {
  id: number
  vendor_email: string
  product_name: string
  category: string | null
  sku: string | null
  quantity: number
  unit: string | null
  unit_price: number | null
  warehouse_city: string | null
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string
  created_at?: string
  updated_at?: string
}

export interface VendorInventoryListResponse {
  success: boolean
  page: number
  page_size: number
  total_count: number
  total_pages: number
  count: number
  items: VendorInventoryItem[]
}

export interface VendorInventoryListParams {
  vendor_email: string
  search?: string
  category?: string
  status?: string
  page?: number
  page_size?: number
}

export interface VendorInventoryCreatePayload {
  vendor_email: string
  product_name: string
  category?: string
  sku?: string
  quantity?: number
  unit?: string
  unit_price?: number
  warehouse_city?: string
}

export interface VendorInventoryUpdatePayload {
  product_name?: string
  category?: string
  sku?: string
  quantity?: number
  unit?: string
  unit_price?: number
  warehouse_city?: string
  status?: string
}

// ── Phase 5: Vendor Payments, Payouts & Invoices Types ───────────────────
export interface VendorPayout {
  id: number
  vendor_email: string
  amount: number
  currency: string
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | string
  payment_method: string
  reference_id?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  paid_at?: string | null
}

export interface VendorPayoutListResponse {
  success: boolean
  count: number
  total_paid: number
  total_pending: number
  payouts: VendorPayout[]
}

export interface VendorPayoutCreatePayload {
  vendor_email: string
  amount: number
  currency?: string
  payment_method?: string
  notes?: string
}

export interface VendorPayoutUpdatePayload {
  amount?: number
  status?: 'Pending' | 'Processing' | 'Paid' | 'Failed' | string
  payment_method?: string
  reference_id?: string
  notes?: string
}

export interface VendorInvoice {
  id: number
  vendor_email: string
  payout_id: number
  invoice_number: string
  amount: number
  description?: string | null
  status: string
  created_at?: string
}

export interface VendorInvoiceListResponse {
  success: boolean
  count: number
  invoices: VendorInvoice[]
}

// ── Phase 5: Vendor Teams Types ─────────────────────────────────────────
export interface VendorTeamMember {
  id: number
  vendor_email: string
  name: string
  role: string | null
  phone: string | null
  email: string | null
  city: string | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface VendorTeamListResponse {
  success: boolean
  count: number
  members: VendorTeamMember[]
}

export interface VendorTeamMemberCreatePayload {
  vendor_email: string
  name: string
  role?: string
  phone?: string
  email?: string
  city?: string
}

export interface VendorTeamMemberUpdatePayload {
  name?: string
  role?: string
  phone?: string
  email?: string
  city?: string
  is_active?: boolean
}

// ── Phase 5: Vendor Documents Types ─────────────────────────────────────
export interface VendorDocument {
  id: number
  vendor_email: string
  document_name: string
  document_type: string | null
  file_url: string
  original_filename: string | null
  size_mb: number | null
  uploaded_at?: string | null
}

export interface VendorDocumentListResponse {
  success: boolean
  count: number
  documents: VendorDocument[]
}

export interface VendorDocumentUpdatePayload {
  document_name?: string
  document_type?: string
}
