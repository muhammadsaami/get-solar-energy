import api from './api/client'
import type {
  CrmPipelineMetrics, CrmCustomer, CrmAlert,
  CrmCustomer360, CrmDocumentItem, CrmCommunicationItem, TimelineEvent,
  CrmTaskItem, CrmMeetingItem, CrmFollowUpItem,
} from '../pages/crm/crm.types'

function snakeToCamel(str: string): string {
  return str.replace(/_(\w)/g, (_, c) => c.toUpperCase())
}

function deepMapKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map((i: unknown) => deepMapKeys<T>(i)) as unknown as T
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeToCamel(key)] = deepMapKeys(value)
    }
    return result as T
  }
  return obj as T
}

export const crmService = {
  async getPipelineMetrics(): Promise<CrmPipelineMetrics | null> {
    const res = await api.get('/crm/pipeline-metrics')
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmPipelineMetrics>(raw) : null
  },

  async getCustomers(skip = 0, limit = 50): Promise<CrmCustomer[]> {
    const res = await api.get('/customers', { params: { skip, limit } })
    const raw = res.data
    return Array.isArray(raw) ? deepMapKeys<CrmCustomer[]>(raw) : []
  },

  async searchCustomers(q: string): Promise<CrmCustomer[]> {
    const res = await api.get('/customers/search', { params: { q } })
    const raw = res.data
    return Array.isArray(raw) ? deepMapKeys<CrmCustomer[]>(raw) : []
  },

  async getCustomerById(id: number): Promise<CrmCustomer | null> {
    const res = await api.get(`/customers/${id}`)
    return res.data ? deepMapKeys<CrmCustomer>(res.data) : null
  },

  async updateCustomerStage(id: number, status: string, pipelineValue?: number): Promise<boolean> {
    const body: Record<string, unknown> = { status }
    if (pipelineValue !== undefined) body.pipeline_value = pipelineValue
    const res = await api.put(`/crm/customers/${id}`, body)
    return res.data?.success === true
  },

  async getAlerts(): Promise<CrmAlert[]> {
    const res = await api.get('/crm/alerts')
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<CrmAlert[]>(raw) : []
  },

  async getCustomer360(id: number): Promise<CrmCustomer360 | null> {
    const res = await api.get(`/crm/customers/${id}/360`)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmCustomer360>(raw) : null
  },

  async getCustomerDocuments(id: number, skip = 0, limit = 50): Promise<CrmDocumentItem[]> {
    const res = await api.get(`/crm/customers/${id}/documents`, { params: { skip, limit } })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<CrmDocumentItem[]>(raw) : []
  },

  async getCustomerCommunications(id: number, skip = 0, limit = 50): Promise<CrmCommunicationItem[]> {
    const res = await api.get(`/crm/customers/${id}/communications`, { params: { skip, limit } })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<CrmCommunicationItem[]>(raw) : []
  },

  async getCustomerTimeline(id: number, page = 1, limit = 50): Promise<TimelineEvent[]> {
    const res = await api.get(`/crm/customers/${id}/timeline-paginated`, { params: { page, limit } })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<TimelineEvent[]>(raw) : []
  },

  // ── Tasks CRUD ──
  async getTasks(customerId?: number): Promise<CrmTaskItem[]> {
    const params: Record<string, unknown> = {}
    if (customerId !== undefined) params.customer_id = customerId
    const res = await api.get('/crm/tasks', { params })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<CrmTaskItem[]>(raw) : []
  },

  async createTask(data: Record<string, unknown>): Promise<CrmTaskItem | null> {
    const res = await api.post('/crm/tasks', data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmTaskItem>(raw) : null
  },

  async updateTask(id: number, data: Record<string, unknown>): Promise<CrmTaskItem | null> {
    const res = await api.put(`/crm/tasks/${id}`, data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmTaskItem>(raw) : null
  },

  async deleteTask(id: number): Promise<boolean> {
    const res = await api.delete(`/crm/tasks/${id}`)
    return res.data?.success === true
  },

  // ── Meetings CRUD ──
  async getMeetings(customerId?: number): Promise<CrmMeetingItem[]> {
    const params: Record<string, unknown> = {}
    if (customerId !== undefined) params.customer_id = customerId
    const res = await api.get('/crm/meetings', { params })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<CrmMeetingItem[]>(raw) : []
  },

  async createMeeting(data: Record<string, unknown>): Promise<CrmMeetingItem | null> {
    const res = await api.post('/crm/meetings', data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmMeetingItem>(raw) : null
  },

  async updateMeeting(id: number, data: Record<string, unknown>): Promise<CrmMeetingItem | null> {
    const res = await api.put(`/crm/meetings/${id}`, data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmMeetingItem>(raw) : null
  },

  async deleteMeeting(id: number): Promise<boolean> {
    const res = await api.delete(`/crm/meetings/${id}`)
    return res.data?.success === true
  },

  // ── Follow-ups CRUD ──
  async getFollowups(customerId?: number): Promise<CrmFollowUpItem[]> {
    const params: Record<string, unknown> = {}
    if (customerId !== undefined) params.customer_id = customerId
    const res = await api.get('/crm/followups', { params })
    const raw = res.data?.data
    return Array.isArray(raw) ? deepMapKeys<CrmFollowUpItem[]>(raw) : []
  },

  async createFollowup(data: Record<string, unknown>): Promise<CrmFollowUpItem | null> {
    const res = await api.post('/crm/followups', data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmFollowUpItem>(raw) : null
  },

  async updateFollowup(id: number, data: Record<string, unknown>): Promise<CrmFollowUpItem | null> {
    const res = await api.put(`/crm/followups/${id}`, data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmFollowUpItem>(raw) : null
  },

  async deleteFollowup(id: number): Promise<boolean> {
    const res = await api.delete(`/crm/followups/${id}`)
    return res.data?.success === true
  },

  // ── Communications ──
  async createCommunication(data: Record<string, unknown>): Promise<CrmCommunicationItem | null> {
    const res = await api.post('/crm/communications', data)
    const raw = res.data?.data
    return raw ? deepMapKeys<CrmCommunicationItem>(raw) : null
  },
}
