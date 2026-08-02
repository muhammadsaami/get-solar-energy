import React from 'react'
import { useJobMarketplace } from '../hooks/useJobMarketplace'
import JobMarketplaceHero from '../components/JobMarketplaceHero'
import JobMarketplaceKPIs from '../components/JobMarketplaceKPIs'
import JobSearchBar from '../components/JobSearchBar'
import QuickFilters from '../components/QuickFilters'
import JobGrid from '../components/JobGrid'
import RecommendedJobs from '../components/RecommendedJobs'
import AppliedJobs from '../components/AppliedJobs'
import SavedJobs from '../components/SavedJobs'
import HiringCompanies from '../components/HiringCompanies'
import JobDrawer from '../components/JobDrawer'
import JobDrawerContent from '../components/JobDrawerContent'
import JobMarketplaceSkeleton from '../components/JobMarketplaceSkeleton'
import JobMarketplaceEmptyState from '../components/JobMarketplaceEmptyState'
import '../styles/job-marketplace.css'

export default function JobMarketplacePage() {
  const {
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
    reload,
  } = useJobMarketplace()

  if (loading) {
    return <JobMarketplaceSkeleton />
  }

  if (error) {
    return <JobMarketplaceEmptyState error={error} onRetry={reload} />
  }

  if (!data) {
    return <JobMarketplaceEmptyState onRetry={reload} />
  }

  return (
    <div className="job-marketplace-container">
      <JobMarketplaceHero onQuickApplyClick={() => setActiveTab('recommended')} />

      <JobMarketplaceKPIs summary={data.summary} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <QuickFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          openCount={data.openJobs.length}
          appliedCount={data.appliedJobs.length}
          savedCount={data.savedJobs.length}
          recommendedCount={data.recommendedJobs.length}
        />

        {activeTab !== 'companies' && (
          <JobSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultCount={filteredJobs.length}
          />
        )}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'companies' ? (
        <HiringCompanies companies={data.hiringCompanies} />
      ) : activeTab === 'recommended' ? (
        <RecommendedJobs
          jobs={filteredJobs}
          onSelect={openDrawer}
          onApply={handleApply}
          onToggleSave={toggleSaveJob}
          applyingJobId={applyingJobId}
        />
      ) : activeTab === 'applied' ? (
        <AppliedJobs
          jobs={filteredJobs}
          onSelect={openDrawer}
          onToggleSave={toggleSaveJob}
        />
      ) : activeTab === 'saved' ? (
        <SavedJobs
          jobs={filteredJobs}
          onSelect={openDrawer}
          onApply={handleApply}
          onToggleSave={toggleSaveJob}
          applyingJobId={applyingJobId}
        />
      ) : (
        <JobGrid
          jobs={filteredJobs}
          onSelect={openDrawer}
          onApply={handleApply}
          onToggleSave={toggleSaveJob}
          applyingJobId={applyingJobId}
        />
      )}

      {/* Reusable Persistent Right Drawer */}
      <JobDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={selectedJob ? selectedJob.title : 'Job Details'}
      >
        {selectedJob && (
          <JobDrawerContent
            job={selectedJob}
            onApply={handleApply}
            onToggleSave={toggleSaveJob}
            isApplying={applyingJobId === selectedJob.id}
          />
        )}
      </JobDrawer>
    </div>
  )
}
