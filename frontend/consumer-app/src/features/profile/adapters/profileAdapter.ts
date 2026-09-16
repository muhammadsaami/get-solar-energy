import type { CanonicalTechnicianProfile, AdaptedProfileData } from '../types/profile.types'

export function adaptProfileData(profile: CanonicalTechnicianProfile): AdaptedProfileData {
  const parts = profile.name.trim().split(' ')
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : profile.name.slice(0, 2).toUpperCase()

  const completenessPercent = profile.kycStatus === 'Verified' ? 95 : 65

  return {
    profile: {
      ...profile,
      completenessPercent,
      initials,
    },
  }
}
