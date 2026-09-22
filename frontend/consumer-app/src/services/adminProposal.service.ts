import api from './api/client'

export interface AdminCustomerBundle {
  customer_id: number
  consumer_number: string
  customer_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  latest_bill: {
    monthly_units: number | null
    bill_amount: number | null
    per_unit_rate: number | null
    recommended_kw: number | null
    billing_period: string | null
  } | null
}

export interface AdminProposalInputs {
  customer_id: number
  customer_name: string
  customer_address: string
  city: string
  monthly_units: number
  monthly_bill_rs: number
  per_unit_rate: number
  recommended_kw: number
  roof_area_sqft: number
  vendor_name: string
}

export interface AdminGeneratedProposal {
  customer_id: number
  consumer_number: string
  customer_email: string | null
  proposal_reference: string
  generated_at: string
  generated_by: string
  [key: string]: unknown
}

export const adminProposalService = {
  async getCustomerBundle(customerId: number): Promise<AdminCustomerBundle | null> {
    const res = await api.get('/admin/proposal/customer', { params: { customer_id: customerId } })
    const raw = res.data?.data
    return raw ?? null
  },

  async generate(inputs: AdminProposalInputs): Promise<{ success: boolean; data?: AdminGeneratedProposal; error?: string }> {
    const res = await api.post('/admin/proposal/generate', inputs)
    return res.data
  },

  async send(customerId: number, proposal: AdminGeneratedProposal, subject?: string): Promise<{ success: boolean; proposal_reference?: string; recipient?: string; error?: string }> {
    const res = await api.post('/admin/proposal/send', {
      customer_id: customerId,
      proposal,
      subject: subject || undefined,
    })
    return res.data
  },
}
