import type {
  CanonicalJob,
  AdaptedJobMarketplaceData,
  HiringCompany,
} from '../types/jobMarketplace.types'

export function adaptJobMarketplaceData(
  jobs: CanonicalJob[],
  savedJobIds: Set<number>,
  companies: HiringCompany[]
): AdaptedJobMarketplaceData {
  const processed = jobs.map(j => ({
    ...j,
    isSaved: savedJobIds.has(j.id),
  }))

  const openJobs = processed.filter(j => !j.alreadyApplied)
  const appliedJobs = processed.filter(j => j.alreadyApplied)
  const savedJobs = processed.filter(j => j.isSaved)
  const recommendedJobs = processed.filter(j => j.matchPercent >= 85)

  const totalBudgets = openJobs.reduce((acc, curr) => acc + (curr.budget || 0), 0)
  const averageSalary = openJobs.length > 0 ? Math.round(totalBudgets / openJobs.length) : 14500

  return {
    raw: processed,
    openJobs,
    appliedJobs,
    savedJobs,
    recommendedJobs,
    summary: {
      totalOpenJobs: openJobs.length,
      totalApplied: appliedJobs.length,
      totalSaved: savedJobs.length,
      totalInterviews: 2,
      profileMatchPercent: 94,
      averageSalary,
    },
    hiringCompanies: companies,
  }
}
