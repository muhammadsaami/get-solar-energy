import api from '../../../services/api/client'
import type {
  RawBackendJob,
  CanonicalJob,
  HiringCompany,
  JobType,
  SkillLevel,
} from '../types/jobMarketplace.types'

function getRelativeTimeAgo(isoDateString?: string): string {
  if (!isoDateString) return 'Posted recently'
  const diffMs = Date.now() - new Date(isoDateString).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Posted just now'
  if (diffHours < 24) return `Posted ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Posted yesterday'
  return `Posted ${diffDays} days ago`
}

export const jobMarketplaceService = {
  async getOpenJobs(city?: string, jobType?: string): Promise<CanonicalJob[]> {
    const params: Record<string, string> = {}
    if (city && city !== 'All') params.city = city
    if (jobType && jobType !== 'All') params.job_type = jobType

    const res = await api.get('/jobs/open', { params })

    if (res.data && res.data.success && Array.isArray(res.data.jobs)) {
      return res.data.jobs.map((j: RawBackendJob, idx: number) => {
        const postedAtStr = j.posted_at || new Date().toISOString()
        const deadlineDate = new Date(new Date(postedAtStr).getTime() + 14 * 24 * 60 * 60 * 1000)

        return {
          id: j.id,
          title: j.title || 'Solar Field Installation Specialist',
          description: j.description || 'Professional solar array installation, DC string wiring, and structural clamping work order for residential rooftop.',
          jobType: (j.job_type as JobType) || 'Installation',
          city: j.city || 'Mumbai',
          budget: typeof j.budget === 'number' ? j.budget : 12500,
          requiredSkillLevel: (j.required_skill_level as SkillLevel) || 'Level 1',
          alreadyApplied: Boolean(j.already_applied),
          postedAt: postedAtStr,
          postedTimeAgo: getRelativeTimeAgo(j.posted_at),
          companyName: 'GET Solar Verified Vendor',
          companyLogo: '⚡',
          companyVerified: true,
          experienceRequired: '1-3 Years',
          employmentType: 'Contract / Project',
          matchPercent: Math.max(75, 96 - ((idx * 5) % 20)),
          skillsRequired: ['Rooftop Mounting', 'DC Isolation', 'Inverter Wiring'],
          isSaved: false,
          deadline: deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          recruiterName: 'Rajesh Sharma',
          recruiterTitle: 'Lead EPC Operations Manager',
          responsibilities: [
            'Inspect roof structure and structural anchoring points.',
            'Mount racking rails and clamp PV modules safely according to IS 875 standards.',
            'Route DC cables into junction box and main isolator.',
            'Assist field lead with final commissioning and DISCOM grid isolation checklist.',
          ],
          requirements: [
            'Valid GET Solar Level 1 or Level 2 Certification.',
            'High-voltage safety LOTO knowledge.',
            'Physical fitness for rooftop mounting activities.',
          ],
          benefits: [
            'Instant payout upon completion verification.',
            'Insurance coverage on site.',
            'Performance bonus for 5-star customer ratings.',
          ],
        }
      })
    }
    return []
  },

  async applyToJob(jobId: number): Promise<{ success: boolean; message?: string }> {
    const res = await api.post(`/jobs/${jobId}/apply`)
    return {
      success: Boolean(res.data?.success),
      message: res.data?.message || 'Application submitted successfully!',
    }
  },

  getHiringCompanies(): HiringCompany[] {
    return [
      { id: 'comp-1', name: 'SunGrid Power India', logo: '☀️', openJobsCount: 12, rating: 4.8, city: 'Mumbai', verified: true, responseTime: '< 2 hrs', companySize: '50+ Engineers' },
      { id: 'comp-2', name: 'Apex Solar Energy', logo: '⚡', openJobsCount: 8, rating: 4.9, city: 'Delhi NCR', verified: true, responseTime: '< 1 hr', companySize: '100+ Engineers' },
      { id: 'comp-3', name: 'GreenRooftop Solutions', logo: '🌱', openJobsCount: 15, rating: 4.7, city: 'Bengaluru', verified: true, responseTime: '< 4 hrs', companySize: '30+ Engineers' },
      { id: 'comp-4', name: 'Bharat Solar EPC', logo: '🔋', openJobsCount: 6, rating: 4.6, city: 'Pune', verified: true, responseTime: '< 3 hrs', companySize: '25+ Engineers' },
    ]
  },
}
