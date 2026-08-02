import React from 'react'
import type { CanonicalJob } from '../types/jobMarketplace.types'
import JobCard from './JobCard'

interface AppliedJobsProps {
  jobs: CanonicalJob[]
  onSelect: (job: CanonicalJob) => void
  onToggleSave: (jobId: number) => void
}

export default function AppliedJobs({ jobs, onSelect, onToggleSave }: AppliedJobsProps) {
  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: 'rgba(8, 24, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        You have not submitted applications to any open jobs yet.
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
          onApply={() => {}}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  )
}
