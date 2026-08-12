import api from '../../../services/api/client'
import type { RawBackendTechnicianProfile, CanonicalTechnicianProfile } from '../types/profile.types'
import { DEFAULT_ACHIEVEMENT_BADGES, TECH_SERVICE_REGIONS } from '../constants/profile.constants'

export const profileService = {
  async getPerformance() {
    const res = await api.get('/technician/performance')
    return res.data
  },

  async getProfile(): Promise<CanonicalTechnicianProfile> {
    const profileRes = await api.get('/technician/profile')
    const raw: RawBackendTechnicianProfile | undefined = profileRes.data?.technician
    if (!raw) {
      throw new Error('Profile data unavailable.')
    }

    let perfData: Record<string, any> = {}
    try {
      const perfRes = await api.get('/technician/performance')
      perfData = (perfRes?.data || {}) as Record<string, any>
    } catch {
      perfData = {}
    }

    const createdDate = raw.created_at ? new Date(raw.created_at) : new Date()
    const joinedDateFormatted = createdDate.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })

    const kycStatus =
      (perfData.kyc_status || raw.kyc_status || 'Pending') as 'Verified' | 'Pending' | 'Rejected'

    return {
      id: raw.id,
      name: raw.name || '',
      email: raw.email || '',
      phone: raw.phone || '',
      city: raw.city || '',
      skillLevel: perfData.skill_level || raw.skill_level || 'Level 1',
      kycStatus,
      createdAt: raw.created_at || new Date().toISOString(),
      joinedDateFormatted,
      completenessPercent: kycStatus === 'Verified' ? 95 : 65,
      metrics: {
        jobsCompleted: perfData.jobs_completed ?? 0,
        onTimeArrivalRatePercent: 0,
        qualityScoreRating: perfData.average_rating ?? 0,
        customerSatisfactionPercent: 0,
        safetyCompliancePercent: 0,
        totalEarnedBudget: 0,
      },
      badges: DEFAULT_ACHIEVEMENT_BADGES,
      certificationsSummary: {
        level1Passed: false,
        level2Passed: false,
        certifiedPassed: (perfData.skill_level || raw.skill_level) === 'Certified',
        totalCertificates: perfData.badges_earned ?? 0,
      },
      serviceRegions: TECH_SERVICE_REGIONS,
      bio: '',
    }
  },

  async updateProfile(data: { name?: string; phone?: string; city?: string }): Promise<{ success: boolean; message?: string }> {
    const res = await api.put('/technician/profile', data)
    return {
      success: Boolean(res.data?.success),
      message: res.data?.message || 'Profile updated successfully.',
    }
  },
}
