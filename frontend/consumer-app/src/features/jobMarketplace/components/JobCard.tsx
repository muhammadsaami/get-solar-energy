import React from 'react'
import type { CanonicalJob } from '../types/jobMarketplace.types'
import {
  MdLocationOn,
  MdWork,
  MdBookmark,
  MdBookmarkBorder,
  MdChevronRight,
  MdCheckCircle,
  MdVerified,
  MdAccessTime,
  MdSchool,
} from 'react-icons/md'

interface JobCardProps {
  job: CanonicalJob
  onSelect: (job: CanonicalJob) => void
  onApply: (jobId: number) => void
  onToggleSave: (jobId: number) => void
  isApplying?: boolean
}

export default function JobCard({
  job,
  onSelect,
  onApply,
  onToggleSave,
  isApplying,
}: JobCardProps) {
  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-company-avatar">{job.companyLogo}</div>

        <div className="job-card-title-container">
          <h3 className="job-card-title">{job.title}</h3>
          <p className="job-company-name">
            {job.companyName}
            {job.companyVerified && <MdVerified className="job-verified-icon" />}
          </p>
        </div>

        <div className="job-match-container">
          <span className="job-match-badge">{job.matchPercent}% Match</span>
        </div>
      </div>

      {/* Match Bar */}
      <div className="job-match-bar-track">
        <div
          className="job-match-bar-fill"
          style={{ width: `${job.matchPercent}%` }}
        />
      </div>

      <div className="job-meta-row">
        <div className="job-meta-item">
          <MdLocationOn className="job-meta-icon-blue" /> {job.city}
        </div>
        <div className="job-meta-item">
          <MdWork className="job-meta-icon-orange" /> {job.jobType}
        </div>
        <div className="job-meta-item">
          <MdSchool className="job-meta-icon-green" /> Level: {job.requiredSkillLevel}
        </div>
        <div className="job-meta-item">
          <MdAccessTime className="job-meta-icon-gray" /> {job.postedTimeAgo}
        </div>
      </div>

      <div className="job-badge-row">
        <span className="job-pill-badge">{job.employmentType}</span>
        <span className="job-pill-badge">{job.experienceRequired}</span>
      </div>

      <div className="job-skills-tags">
        {job.skillsRequired.map((skill, idx) => (
          <span key={idx} className="job-skill-tag">
            {skill}
          </span>
        ))}
      </div>

      <div className="job-card-footer">
        <div>
          <span className="job-budget-lbl">Pay Budget</span>
          <span className="job-budget-text">
            ₹{job.budget ? job.budget.toLocaleString('en-IN') : '12,500'}
          </span>
        </div>

        <div className="job-card-actions">
          <button
            className={`btn btn-icon btn-sm ${job.isSaved ? 'saved-active' : ''}`}
            title={job.isSaved ? 'Remove from Saved' : 'Save Job'}
            aria-label={job.isSaved ? 'Remove from Saved' : 'Save Job'}
            onClick={() => onToggleSave(job.id)}
          >
            {job.isSaved ? <MdBookmark className="job-bookmark-icon-active" /> : <MdBookmarkBorder />}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSelect(job)}
          >
            Details <MdChevronRight />
          </button>

          {job.alreadyApplied ? (
            <button className="btn btn-secondary btn-sm job-applied-btn" disabled>
              <MdCheckCircle /> Applied
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              disabled={isApplying}
              onClick={() => onApply(job.id)}
            >
              {isApplying ? 'Applying...' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
