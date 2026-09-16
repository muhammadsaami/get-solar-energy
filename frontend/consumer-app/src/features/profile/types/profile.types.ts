export interface RawBackendTechnicianProfile {
  id: number
  name: string
  email: string
  phone: string
  city: string
  skill_level: string
  kyc_status: string
  created_at?: string
}

export interface RawBackendProfileResponse {
  success: boolean
  technician: RawBackendTechnicianProfile
}

export interface PerformanceMetrics {
  jobsCompleted: number
  onTimeArrivalRatePercent: number
  qualityScoreRating: number
  customerSatisfactionPercent: number
  safetyCompliancePercent: number
  totalEarnedBudget: number
}

export interface AchievementBadge {
  id: string
  title: string
  description: string
  category: 'Safety' | 'Quality' | 'Efficiency' | 'Mastery'
  issuedDate: string
  icon: string
}

export interface CanonicalTechnicianProfile {
  id: number
  name: string
  initials?: string
  email: string
  phone: string
  city: string
  skillLevel: string
  kycStatus: 'Verified' | 'Pending' | 'Rejected'
  createdAt: string
  joinedDateFormatted: string
  completenessPercent: number
  metrics: PerformanceMetrics
  badges: AchievementBadge[]
  certificationsSummary: {
    level1Passed: boolean
    level2Passed: boolean
    certifiedPassed: boolean
    totalCertificates: number
  }
  serviceRegions: string[]
  bio: string
}

export interface AdaptedProfileData {
  profile: CanonicalTechnicianProfile
}
