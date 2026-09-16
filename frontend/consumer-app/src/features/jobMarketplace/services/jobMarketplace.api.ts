import { jobMarketplaceService } from './jobMarketplace.service'

export const jobMarketplaceApi = {
  getOpenJobs(city?: string, jobType?: string) {
    return jobMarketplaceService.getOpenJobs(city, jobType)
  },

  applyToJob(jobId: number) {
    return jobMarketplaceService.applyToJob(jobId)
  },

  getHiringCompanies() {
    return jobMarketplaceService.getHiringCompanies()
  },
}
