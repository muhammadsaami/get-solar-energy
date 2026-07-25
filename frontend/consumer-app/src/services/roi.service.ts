import api from './api/client'

export interface ROIApiRequest {
  monthly_bill: number
  state: string
  roof_type: string
  system_size: number
}

export interface ROIApiResponse {
  success: boolean
  fallback?: boolean
  data: {
    recommended_kw: number
    system_cost: number
    government_subsidy: number
    net_cost: number
    monthly_savings: number
    annual_savings: number
    annual_generation: number
    payback_period: number
    lifetime_savings: number
    roi_percentage: number
    co2_reduction: number
  }
}

export async function calculateROI(request: ROIApiRequest): Promise<ROIApiResponse> {
  const { data } = await api.post<ROIApiResponse>('/api/calculate-roi', request)
  return data
}
