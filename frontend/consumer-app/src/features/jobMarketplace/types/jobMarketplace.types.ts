export type JobType = 'Installation' | 'AMC' | 'Repair' | 'Inspection' | 'All'

export type SkillLevel = 'Level 1' | 'Level 2' | 'Master'

export interface RawBackendJob {
  id: number
  title: string
  description?: string
  job_type: string
  city: string
  budget?: number
  required_skill_level: string
  already_applied: boolean
  posted_at: string
}

export interface CanonicalJob {
  id: number
  title: string
  description: string
  jobType: JobType
  city: string
  budget: number
  requiredSkillLevel: SkillLevel
  alreadyApplied: boolean
  postedAt: string
  postedTimeAgo: string
  companyName: string
  companyLogo: string
  companyVerified: boolean
  experienceRequired: string
  employmentType: string
  matchPercent: number
  skillsRequired: string[]
  isSaved?: boolean
  responsibilities?: string[]
  requirements?: string[]
  benefits?: string[]
  deadline?: string
  recruiterName?: string
  recruiterTitle?: string
}

export interface HiringCompany {
  id: string
  name: string
  logo: string
  openJobsCount: number
  rating: number
  city: string
  verified: boolean
  responseTime: string
  companySize: string
}

export interface JobMarketplaceSummary {
  totalOpenJobs: number
  totalApplied: number
  totalSaved: number
  totalInterviews: number
  profileMatchPercent: number
  averageSalary: number
}

export interface AdaptedJobMarketplaceData {
  raw: CanonicalJob[]
  openJobs: CanonicalJob[]
  appliedJobs: CanonicalJob[]
  savedJobs: CanonicalJob[]
  recommendedJobs: CanonicalJob[]
  hiringCompanies: HiringCompany[]
  summary: JobMarketplaceSummary
}

export interface JobMarketplaceFilters {
  city: string
  jobType: JobType | 'All'
  experience: string
  salaryMin: number
  company: string
  employmentType: string
}

export type JobSortOption = 'recent' | 'salary' | 'match' | 'deadline'
