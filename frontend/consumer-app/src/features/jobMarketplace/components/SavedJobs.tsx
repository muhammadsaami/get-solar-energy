import React from 'react'
import type { CanonicalJob } from '../types/jobMarketplace.types'
import JobCard from './JobCard'

interface SavedJobsProps {
  jobs: CanonicalJob[]
  onSelect: (job: CanonicalJob) => void
  onApply: (jobId: number) => void
  onToggleSave: (jobId: number) => void
  applyingJobId?: number | null
}

export default function SavedJobs({
  jobs,
  onSelect,
  onApply,
  onToggleSave,
  applyingJobId,
}: SavedJobsProps) {
  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: 'rgba(8, 24, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        No saved jobs. Click the bookmark icon on any job card to save it here for later.
      </div>
    )
  }

  return (
    <div className="job-card-grid">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onSelect={onSelect}
          onApply={onApply}
          onToggleSave={onToggleSave}
          isApplying={applyingJobId === job.id}
        />
      ))}
    </div>
  )
}
