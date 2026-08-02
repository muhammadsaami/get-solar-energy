import { certificationsService } from './certifications.service'

export const certificationsApi = {
  getDashboard() {
    return certificationsService.getDashboard()
  },

  getCertifications() {
    return certificationsService.getCertifications()
  },

  getCertification(id: string) {
    return certificationsService.getCertification(id)
  },

  downloadCertificate(id: string) {
    return certificationsService.downloadCertificate(id)
  },

  shareCertificate(id: string) {
    return certificationsService.shareCertificate(id)
  },

  verifyCertificate(code: string) {
    return certificationsService.verifyCertificate(code)
  },

  getRecommendations() {
    return certificationsService.getRecommendations()
  },
}
