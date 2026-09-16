import api from '../../../services/api/client'
import type {
  CanonicalCertification,
  CertificationsDashboardData,
  RecommendedCertification,
  SkillLevel,
  CertificationCategory,
} from '../types/certifications.types'

export const certificationsService = {
  async getCertifications(): Promise<CanonicalCertification[]> {
    const res = await api.get('/technician/training/certifications')
    if (res.data && res.data.success && Array.isArray(res.data.certifications)) {
      return res.data.certifications.map((c: Record<string, unknown>, idx: number) => {
        const certNum = String(c.certificate_number || `GSE-${idx + 1000}`)
        const issuedAt = String(c.issued_at || new Date().toISOString())
        const validTillDate = new Date(new Date(issuedAt).getTime() + 365 * 24 * 60 * 60 * 1000)

        return {
          id: String(c.id || `cert-backend-${idx + 1}`),
          title: String(c.badge_name || c.title || 'GET Solar Certified Technician'),
          badgeName: String(c.badge_name || 'GET Solar Certified Technician'),
          certificateNumber: certNum,
          level: (c.level as SkillLevel) || 'Level 1',
          category: (c.category as CertificationCategory) || 'Solar Installation',
          status: 'Active' as const,
          issuedAt: issuedAt,
          validTill: String(c.valid_till || validTillDate.toISOString()),
          score: typeof c.score === 'number' ? c.score : 100,
          verificationUrl: `/verify/${certNum}`,
          qrCodeUrl: '',
          skillsUnlocked: Array.isArray(c.skills_unlocked)
            ? (c.skills_unlocked as string[])
            : ['Rooftop Installation', 'DC Safety Isolation', 'Quality Audit'],
          description: String(c.description || 'Verified technical certification issued by GET Solar Energy Academy.'),
          issuer: 'GET Solar Energy Academy',
        }
      })
    }
    return []
  },

  async getDashboard(): Promise<CertificationsDashboardData> {
    const certs = await this.getCertifications()
    return {
      summary: {
        totalActive: certs.filter(c => c.status === 'Active' || c.status === 'Expiring').length,
        totalCompleted: certs.length,
        totalExpiring: certs.filter(c => c.status === 'Expiring').length,
        skillLevel: certs.some(c => c.level === 'Master')
          ? 'Master'
          : certs.some(c => c.level === 'Level 2')
          ? 'Level 2'
          : 'Level 1',
        overallScorePercent: certs.length > 0
          ? Math.round(certs.reduce((acc, curr) => acc + curr.score, 0) / certs.length)
          : 0,
      },
      certifications: certs,
      badges: [],
      skills: [],
      recommendations: [],
    }
  },

  async getCertification(id: string): Promise<CanonicalCertification | null> {
    const certs = await this.getCertifications()
    return certs.find(c => c.id === id) || null
  },

  async downloadCertificate(id: string): Promise<{ success: boolean; downloadUrl?: string }> {
    const cert = await this.getCertification(id)
    if (!cert) return { success: false }
    return {
      success: true,
      downloadUrl: `/technician/training/certifications/${id}/pdf`,
    }
  },

  async shareCertificate(id: string): Promise<{ success: boolean; shareUrl: string }> {
    const cert = await this.getCertification(id)
    const code = cert ? cert.certificateNumber : 'GSE-VERIFIED'
    return {
      success: true,
      shareUrl: `${window.location.origin}/verify/${code}`,
    }
  },

  async verifyCertificate(code: string): Promise<{ verified: boolean; record?: CanonicalCertification }> {
    const certs = await this.getCertifications()
    const match = certs.find(c => c.certificateNumber.toUpperCase() === code.toUpperCase())
    if (match) {
      return { verified: true, record: match }
    }
    return { verified: false }
  },

  async getRecommendations(): Promise<RecommendedCertification[]> {
    return Promise.resolve([])
  },
}
