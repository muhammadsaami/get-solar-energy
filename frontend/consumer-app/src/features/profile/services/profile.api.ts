import { profileService } from './profile.service'

export const profileApi = {
  getProfile() {
    return profileService.getProfile()
  },

  updateProfile(data: { name?: string; phone?: string; city?: string }) {
    return profileService.updateProfile(data)
  },
}
