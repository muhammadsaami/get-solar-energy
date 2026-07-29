export interface RewardSummary {
  total_referrals: number
  completed_referrals: number
  pending_referrals: number
  total_points: number
  wallet_balance_rs: number
}

export interface ReferralHistoryEntry {
  referred_email: string
  referred_name: string
  points_earned: number
  status: string
  date: string
}

export interface WalletTransaction {
  type: 'credit' | 'debit'
  description: string
  points: number
  date: string
}

export interface RewardCatalogItem {
  id: string
  name: string
  points_required: number
  category: 'voucher' | 'service' | 'cashback'
  description: string
}

export interface LeaderboardEntry {
  name: string
  email: string
  points: number
  rank: number
}

export interface RedemptionEntry {
  email: string
  reward_id: string
  reward_name: string
  points_spent: number
  status: string
  redeemed_at: string
}

export interface AnalyticsResponse {
  success: boolean
  error?: string
  email?: string
  referral_code?: string
  summary?: RewardSummary
  referral_history?: ReferralHistoryEntry[]
  leaderboard?: LeaderboardEntry[]
  user_rank?: number | null
  rewards_catalog?: RewardCatalogItem[]
  redemption_history?: RedemptionEntry[]
}

export interface ApplyCodeRequest {
  referral_code: string
  email: string
}

export interface ApplyCodeResponse {
  success: boolean
  message?: string
  error?: string
  referrer_points_earned?: number
  new_user_points_earned?: number
}

export interface RedeemRequest {
  email: string
  reward_id: string
}

export interface RedeemResponse {
  success: boolean
  message?: string
  error?: string
  points_spent?: number
  remaining_points?: number
  wallet_balance_rs?: number
}
