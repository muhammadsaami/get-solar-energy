import type { JobType } from '../types/jobMarketplace.types'

export const JOB_TYPES: JobType[] = ['Installation', 'AMC', 'Repair', 'Inspection']

export const POPULAR_CITIES = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Jaipur']

export const EXPERIENCE_LEVELS = ['Entry Level (0-1 yrs)', 'Mid Level (2-4 yrs)', 'Senior / Lead (5+ yrs)']

export const EMPLOYMENT_TYPES = ['Full-time', 'Contract / Project', 'Part-time', 'Emergency Callout']

export const DEFAULT_FILTERS = {
  city: 'All',
  jobType: 'All' as const,
  experience: 'All',
  salaryMin: 0,
  company: 'All',
  employmentType: 'All',
}
