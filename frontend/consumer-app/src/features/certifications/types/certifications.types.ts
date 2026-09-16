export type SkillLevel = 'Level 1' | 'Level 2' | 'Master'

export type CertificationCategory =
  | 'Solar Installation'
  | 'Safety & Compliance'
  | 'Grid Integration'
  | 'AMC & Repair'

export type CertificationStatus = 'Active' | 'Expiring' | 'Expired' | 'Pending'

export interface CanonicalCertification {
  id: string
  title: string
  badgeName: string
  certificateNumber: string
  level: SkillLevel
  category: CertificationCategory
  status: CertificationStatus
  issuedAt: string // ISO 8601 string
  validTill: string // ISO 8601 string
  score: number // Percentage e.g. 95
  verificationUrl: string // Reserved for backend verification link
  qrCodeUrl: string // Reserved for QR asset
  signedCertificateUrl?: string // Reserved for PDF/SVG download
  skillsUnlocked: string[]
  description: string
  issuer: string
}

export interface AchievementBadge {
  id: string
  title: string
  description: string
  iconName: string
  unlockedAt: string
  category: string
}

export interface SkillMatrixItem {
  id: string
  skillName: string
  category: CertificationCategory
  requiredLevel: SkillLevel
  isAcquired: boolean
  proficiencyPercent: number
}

export interface RecommendedCertification {
  id: string
  title: string
  level: SkillLevel
  category: CertificationCategory
  estimatedHours: number
  unlockedSalaryBoost: string
  prerequisites: string[]
}

export interface CertificationsDashboardData {
  summary: {
    totalActive: number
    totalCompleted: number
    totalExpiring: number
    skillLevel: SkillLevel
    overallScorePercent: number
  }
  certifications: CanonicalCertification[]
  badges: AchievementBadge[]
  skills: SkillMatrixItem[]
  recommendations: RecommendedCertification[]
}

export interface AdaptedCertificationsData {
  raw: CanonicalCertification[]
  all: CanonicalCertification[]
  active: CanonicalCertification[]
  completed: CanonicalCertification[]
  expiring: CanonicalCertification[]
  timeline: CanonicalCertification[]
  summary: CertificationsDashboardData['summary']
  badges: AchievementBadge[]
  skills: SkillMatrixItem[]
  recommendations: RecommendedCertification[]
}
