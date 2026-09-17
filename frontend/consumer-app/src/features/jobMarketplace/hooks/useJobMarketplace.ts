import { useState, useEffect, useCallback, useMemo } from 'react'
import { jobMarketplaceApi } from '../services/jobMarketplace.api'
import { adaptJobMarketplaceData } from '../adapters/jobMarketplaceAdapter'
import type {
  CanonicalJob,
  AdaptedJobMarketplaceData,
  JobMarketplaceFilters,
  JobSortOption,
} from '../types/jobMarketplace.types'
import { DEFAULT_FILTERS } from '../constants/jobMarketplace.constants'
import { useNotificationStore } from '../../../stores/notificationStore'

export function useJobMarketplace() {
  const [data, setData] = useState<AdaptedJobMarketplaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab & Filters State
  const [activeTab, setActiveTab] = useState<'open' | 'applied' | 'saved' | 'recommended' | 'companies'>('open')
  const [filters, setFilters] = useState<JobMarketplaceFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<JobSortOption>('recent')

  // Saved Jobs Set
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set())

  // Drawer State
  const [selectedJob, setSelectedJob] = useState<CanonicalJob | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null)

  const addToast = useNotificationStore(s => s.addToast)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rawJobs = await jobMarketplaceApi.getOpenJobs(filters.city, filters.jobType)
      const companies = jobMarketplaceApi.getHiringCompanies()
      const adapted = adaptJobMarketplaceData(rawJobs, savedJobIds, companies)
      setData(adapted)
    } catch {
      setError('Failed to load open jobs from marketplace.')
      addToast({ type: 'error', message: 'Failed to load job marketplace data' })
    } finally {
      setLoading(false)
    }
  }, [filters.city, filters.jobType, savedJobIds, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleSaveJob = useCallback((jobId: number) => {
    setSavedJobIds(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
        addToast({ type: 'info', message: 'Job removed from saved list' })
      } else {
        next.add(jobId)
        addToast({ type: 'success', message: 'Job saved to your portfolio!' })
      }
      return next
    })
  }, [addToast])

  const openDrawer = useCallback((job: CanonicalJob) => {
    setSelectedJob(job)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedJob(null)
  }, [])

  const handleApply = useCallback(async (jobId: number) => {
    setApplyingJobId(jobId)
    try {
      const res = await jobMarketplaceApi.applyToJob(jobId)
      if (res.success) {
        addToast({ type: 'success', message: res.message || 'Application submitted successfully!' })
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(prev => (prev ? { ...prev, alreadyApplied: true } : null))
        }
        await loadData()
      } else {
        addToast({ type: 'error', message: res.message || 'Application failed.' })
      }
    } catch {
      addToast({ type: 'error', message: 'Application error. Please try again.' })
    } finally {
      setApplyingJobId(null)
    }
  }, [loadData, selectedJob, addToast])

  const filteredJobs = useMemo(() => {
    if (!data) return []
    let list: CanonicalJob[] = []

    if (activeTab === 'open') list = data.openJobs
    else if (activeTab === 'applied') list = data.appliedJobs
    else if (activeTab === 'saved') list = data.savedJobs
    else if (activeTab === 'recommended') list = data.recommendedJobs

    if (filters.city !== 'All') {
      list = list.filter(j => j.city.toLowerCase() === filters.city.toLowerCase())
    }

    if (filters.jobType !== 'All') {
      list = list.filter(j => j.jobType === filters.jobType)
    }

    if (filters.salaryMin > 0) {
      list = list.filter(j => (j.budget || 0) >= filters.salaryMin)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        j =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.city.toLowerCase().includes(q) ||
          j.skillsRequired.some(s => s.toLowerCase().includes(q))
      )
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === 'salary') return (b.budget || 0) - (a.budget || 0)
      if (sortBy === 'match') return b.matchPercent - a.matchPercent
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    })
  }, [data, activeTab, filters, searchQuery, sortBy])

  return {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedJob,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleSaveJob,
    handleApply,
    applyingJobId,
    filteredJobs,
    reload: loadData,
  }
}
