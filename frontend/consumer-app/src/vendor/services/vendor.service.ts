import api from '../../services/api/client'
import type {
  VendorDashboardData,
  VendorAlertsData,
  VendorTask,
  VendorInventoryItem,
  VendorInventoryListResponse,
  VendorInventoryListParams,
  VendorInventoryCreatePayload,
  VendorInventoryUpdatePayload,
  VendorPayout,
  VendorPayoutListResponse,
  VendorPayoutCreatePayload,
  VendorPayoutUpdatePayload,
  VendorInvoice,
  VendorInvoiceListResponse,
  VendorTeamMember,
  VendorTeamListResponse,
  VendorTeamMemberCreatePayload,
  VendorTeamMemberUpdatePayload,
  VendorDocument,
  VendorDocumentListResponse,
  VendorDocumentUpdatePayload,
} from '../types/vendor.types'

export async function getVendorDashboard(): Promise<VendorDashboardData> {
  const res = await api.get('/vendor/dashboard')
  return res.data?.data || { kpis: {} as VendorDashboardData['kpis'], projects: [], todaysVisits: [], upcomingVisits: [], todaysTasks: [], overdueTasks: [], team: '' }
}

export async function getVendorProjects(params?: Record<string, string>) {
  const res = await api.get('/vendor/projects', { params })
  return res.data?.data || []
}

export async function getVendorProject(projectId: string) {
  const res = await api.get(`/projects/${encodeURIComponent(projectId)}`)
  return res.data?.data || null
}

export async function updateVendorProjectStage(projectId: string, stage: string) {
  const res = await api.patch(`/projects/${encodeURIComponent(projectId)}/stage`, { stage })
  return res.data?.data || null
}

export async function getVendorTasks(params?: Record<string, string>): Promise<VendorTask[]> {
  const res = await api.get('/vendor/tasks', { params })
  return res.data?.data || []
}

export async function getCustomerDirectory() {
  const res = await api.get('/customers')
  return Array.isArray(res.data) ? res.data : []
}

export async function getVendorAlerts(): Promise<VendorAlertsData> {
  const res = await api.get('/vendor/alerts')
  return res.data?.data || { alerts: [], total: 0, critical: 0 }
}

// ── Phase 5: Vendor Inventory API Methods ───────────────────────────────
export async function getInventory(
  params: VendorInventoryListParams
): Promise<VendorInventoryListResponse> {
  const res = await api.get('/vendor/inventory', { params })
  return res.data
}

export async function createInventoryItem(
  payload: VendorInventoryCreatePayload
): Promise<{ success: boolean; item: VendorInventoryItem }> {
  const res = await api.post('/vendor/inventory', payload)
  return res.data
}

export async function getInventoryItem(
  itemId: number,
  vendorEmail: string
): Promise<{ success: boolean; item: VendorInventoryItem }> {
  const res = await api.get(`/vendor/inventory/${itemId}`, {
    params: { vendor_email: vendorEmail },
  })
  return res.data
}

export async function updateInventoryItem(
  itemId: number,
  payload: VendorInventoryUpdatePayload,
  vendorEmail?: string
): Promise<{ success: boolean; item: VendorInventoryItem }> {
  const params = vendorEmail ? { vendor_email: vendorEmail } : undefined
  const res = await api.put(`/vendor/inventory/${itemId}`, payload, { params })
  return res.data
}

export async function deleteInventoryItem(
  itemId: number,
  vendorEmail: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/vendor/inventory/${itemId}`, {
    params: { vendor_email: vendorEmail },
  })
  return res.data
}

// ── Phase 5: Vendor Payments, Payouts & Invoices API Methods ────────────
export async function getPayouts(
  vendorEmail: string,
  status?: string
): Promise<VendorPayoutListResponse> {
  const params: Record<string, string> = { vendor_email: vendorEmail }
  if (status && status !== 'All') params.status = status
  const res = await api.get('/vendor/payouts', { params })
  return res.data
}

export async function createPayout(
  payload: VendorPayoutCreatePayload
): Promise<{ success: boolean; payout: VendorPayout }> {
  const res = await api.post('/vendor/payouts', payload)
  return res.data
}

export async function getPayout(
  payoutId: number,
  vendorEmail?: string
): Promise<{ success: boolean; payout: VendorPayout }> {
  const params = vendorEmail ? { vendor_email: vendorEmail } : undefined
  const res = await api.get(`/vendor/payouts/${payoutId}`, { params })
  return res.data
}

export async function updatePayout(
  payoutId: number,
  payload: VendorPayoutUpdatePayload,
  vendorEmail?: string
): Promise<{ success: boolean; payout: VendorPayout }> {
  const params = vendorEmail ? { vendor_email: vendorEmail } : undefined
  const res = await api.put(`/vendor/payouts/${payoutId}`, payload, { params })
  return res.data
}

export async function deletePayout(
  payoutId: number,
  vendorEmail?: string
): Promise<{ success: boolean; message: string }> {
  const params = vendorEmail ? { vendor_email: vendorEmail } : undefined
  const res = await api.delete(`/vendor/payouts/${payoutId}`, { params })
  return res.data
}

export async function createPayoutInvoice(
  payoutId: number,
  description?: string,
  vendorEmail?: string
): Promise<{ success: boolean; message: string; invoice: VendorInvoice }> {
  const params: Record<string, string> = {}
  if (description) params.description = description
  if (vendorEmail) params.vendor_email = vendorEmail
  const res = await api.post(`/vendor/payouts/${payoutId}/invoice`, null, { params })
  return res.data
}

export async function getInvoices(
  vendorEmail: string
): Promise<VendorInvoiceListResponse> {
  const res = await api.get('/vendor/payouts/invoices', {
    params: { vendor_email: vendorEmail },
  })
  return res.data
}

export async function getInvoice(
  invoiceId: number,
  vendorEmail?: string
): Promise<{ success: boolean; invoice: VendorInvoice }> {
  const params = vendorEmail ? { vendor_email: vendorEmail } : undefined
  const res = await api.get(`/vendor/payouts/invoices/${invoiceId}`, { params })
  return res.data
}

export async function downloadPayoutReceipt(
  payoutId: number,
  vendorEmail?: string
): Promise<Blob> {
  const params = vendorEmail ? { vendor_email: vendorEmail } : undefined
  const res = await api.get(`/vendor/payouts/${payoutId}/receipt`, {
    params,
    responseType: 'blob',
  })
  return res.data
}

// ── Phase 5: Vendor Teams API Methods ───────────────────────────────────
export async function getTeam(
  vendorEmail: string,
  activeOnly?: boolean
): Promise<VendorTeamListResponse> {
  const params: Record<string, string | boolean> = { vendor_email: vendorEmail }
  if (activeOnly) params.active_only = true
  const res = await api.get('/vendor/team', { params })
  return res.data
}

export async function createTeamMember(
  payload: VendorTeamMemberCreatePayload
): Promise<{ success: boolean; message: string; member: VendorTeamMember }> {
  const res = await api.post('/vendor/team', payload)
  return res.data
}

export async function getTeamMember(
  memberId: number
): Promise<{ success: boolean; member: VendorTeamMember }> {
  const res = await api.get(`/vendor/team/${memberId}`)
  return res.data
}

export async function updateTeamMember(
  memberId: number,
  payload: VendorTeamMemberUpdatePayload
): Promise<{ success: boolean; message: string; member: VendorTeamMember }> {
  const res = await api.put(`/vendor/team/${memberId}`, payload)
  return res.data
}

export async function deleteTeamMember(
  memberId: number
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/vendor/team/${memberId}`)
  return res.data
}

// ── Phase 5: Vendor Documents API Methods ───────────────────────────────
export async function getDocuments(
  vendorEmail: string,
  documentType?: string
): Promise<VendorDocumentListResponse> {
  const params: Record<string, string> = { vendor_email: vendorEmail }
  if (documentType && documentType !== 'All') params.document_type = documentType
  const res = await api.get('/vendor/documents', { params })
  return res.data
}

export async function uploadDocument(
  formData: FormData
): Promise<{ success: boolean; message: string; document: VendorDocument }> {
  const res = await api.post('/vendor/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function getDocument(
  documentId: number
): Promise<{ success: boolean; document: VendorDocument }> {
  const res = await api.get(`/vendor/documents/${documentId}`)
  return res.data
}

export async function updateDocument(
  documentId: number,
  payload: VendorDocumentUpdatePayload
): Promise<{ success: boolean; message: string; document: VendorDocument }> {
  const res = await api.put(`/vendor/documents/${documentId}`, payload)
  return res.data
}

export async function downloadDocument(
  documentId: number
): Promise<Blob> {
  const res = await api.get(`/vendor/documents/${documentId}/download`, {
    responseType: 'blob',
  })
  return res.data
}

export async function deleteDocument(
  documentId: number
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/vendor/documents/${documentId}`)
  return res.data
}
