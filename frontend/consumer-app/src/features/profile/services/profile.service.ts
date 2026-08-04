import api from '../../../services/api/client'
import type { RawBackendTechnicianProfile, CanonicalTechnicianProfile } from '../types/profile.types'
import { DEFAULT_ACHIEVEMENT_BADGES, TECH_SERVICE_REGIONS } from '../constants/profile.constants'

export const profileService = {
  async getPerformance() {
    const res = await api.get('/technician/performance')
    return res.data
  },

  async getProfile(): Promise<CanonicalTechnicianProfile> {
    const [profileRes, perfRes] = await Promise.all([
      api.get('/technician/profile'),
      api.get('/technician/performance').catch(() => null),
    ])

    const raw: RawBackendTechnicianProfile = profileRes.data?.technician || {
      id: 1,
      name: 'Solar Technician',
      email: 'technician@getsolar.in',
      phone: '+91 98200 12345',
      city: 'Mumbai',
      skill_level: 'Level 1',
      kyc_status: 'Verified',
      created_at: new Date().toISOString(),
    }

    const perfData = perfRes?.data || {}

    const createdDate = raw.created_at ? new Date(raw.created_at) : new Date()
    const joinedDateFormatted = createdDate.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })

    return {
      id: raw.id,
      name: raw.name || 'Solar Technician',
      email: raw.email || 'technician@getsolar.in',
      phone: raw.phone || '+91 98200 12345',
      city: raw.city || 'Mumbai',
      skillLevel: perfData.skill_level || raw.skill_level || 'Level 1',
      kycStatus: (perfData.kyc_status || raw.kyc_status as 'Verified' | 'Pending' | 'Rejected') || 'Verified',
      createdAt: raw.created_at || new Date().toISOString(),
      joinedDateFormatted,
      completenessPercent: (raw.kyc_status || perfData.kyc_status) === 'Verified' ? 95 : 65,
      metrics: {
        jobsCompleted: perfData.jobs_completed ?? 12,
        onTimeArrivalRatePercent: 98,
        qualityScoreRating: perfData.average_rating ?? 4.9,
        customerSatisfactionPercent: 96,
        safetyCompliancePercent: 100,
        totalEarnedBudget: 145000,
      },
      badges: DEFAULT_ACHIEVEMENT_BADGES,
      certificationsSummary: {
        level1Passed: true,
        level2Passed: true,
        certifiedPassed: (perfData.skill_level || raw.skill_level) === 'Certified',
        totalCertificates: perfData.badges_earned ?? 3,
      },
      serviceRegions: TECH_SERVICE_REGIONS,
      bio: 'Senior Solar Field Engineer specializing in residential rooftop solar installation, high-voltage DC string inverter wiring, and DISCOM net-metering compliance inspections.',
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
