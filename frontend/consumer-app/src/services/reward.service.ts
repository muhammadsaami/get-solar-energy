import api from './api/client'
import type {
  AnalyticsResponse,
  ApplyCodeRequest,
  ApplyCodeResponse,
  RedeemRequest,
  RedeemResponse,
} from '../types/rewards.types'

export async function fetchAnalytics(email: string): Promise<AnalyticsResponse> {
  const { data } = await api.get<AnalyticsResponse>(
    `/referral/analytics/${encodeURIComponent(email)}`
  )
  return data
}

export async function applyReferralCode(payload: ApplyCodeRequest): Promise<ApplyCodeResponse> {
  const { data } = await api.post<ApplyCodeResponse>('/referral/apply', {
    referral_code: payload.referral_code,
    new_user_email: payload.email,
  })
  return data
}

export async function redeemReward(payload: RedeemRequest): Promise<RedeemResponse> {
  const { data } = await api.post<RedeemResponse>('/referral/redeem', payload)
  return data
}
