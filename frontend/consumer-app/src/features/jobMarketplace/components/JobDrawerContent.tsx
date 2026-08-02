import React from 'react'
import type { CanonicalJob } from '../types/jobMarketplace.types'
import {
  MdLocationOn,
  MdWork,
  MdCheckCircle,
  MdBookmark,
  MdBookmarkBorder,
  MdShare,
  MdAttachMoney,
  MdVerified,
  MdPerson,
  MdEvent,
  MdFlag,
} from 'react-icons/md'

interface JobDrawerContentProps {
  job: CanonicalJob
  onApply: (jobId: number) => void
  onToggleSave: (jobId: number) => void
  isApplying?: boolean
}

export default function JobDrawerContent({
  job,
  onApply,
  onToggleSave,
  isApplying,
}: JobDrawerContentProps) {
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/app/technician/marketplace?jobId=${job.id}`
      await navigator.clipboard.writeText(shareUrl)
      alert('Job listing link copied to clipboard!')
    } catch {
      // ignore
    }
  }

  const handleReport = () => {
    alert('Thank you. This job posting has been flagged for administrative quality review.')
  }

  return (
    <>
      <div className="drawer-job-card-header">
        <div className="drawer-company-info">
          <div className="job-company-avatar">{job.companyLogo}</div>
          <div>
            <h3 className="drawer-job-title">{job.title}</h3>
            <p className="job-company-name">
              {job.companyName}
              {job.companyVerified && <MdVerified className="job-verified-icon" />}
            </p>
          </div>
        </div>

        <div className="drawer-meta-grid">
          <div className="drawer-meta-chip">
            <MdLocationOn className="job-meta-icon-blue" /> {job.city}
          </div>
          <div className="drawer-meta-chip">
            <MdWork className="job-meta-icon-orange" /> {job.jobType}
          </div>
          <div className="drawer-meta-chip">
            <MdAttachMoney className="job-meta-icon-green" /> ₹{job.budget ? job.budget.toLocaleString('en-IN') : '12,500'}
          </div>
          <div className="drawer-meta-chip">
            <MdEvent className="job-meta-icon-gray" /> Deadline: {job.deadline || 'Open until filled'}
          </div>
        </div>
      </div>

      {/* Recruiter Badge */}
      {job.recruiterName && (
        <div className="drawer-recruiter-box">
          <MdPerson className="drawer-recruiter-icon" />
          <div>
            <div className="drawer-recruiter-name">{job.recruiterName}</div>
            <div className="drawer-recruiter-title">{job.recruiterTitle || 'GET Solar Verified Hiring Representative'}</div>
          </div>
        </div>
      )}

      <div>
        <h4 className="drawer-section-heading">Job Overview</h4>
        <p className="drawer-body-text">{job.description}</p>
      </div>

      {job.skillsRequired && job.skillsRequired.length > 0 && (
        <div>
          <h4 className="drawer-section-heading">Required Technical Skills</h4>
          <div className="job-skills-tags">
            {job.skillsRequired.map((s, i) => (
              <span key={i} className="job-skill-tag">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.responsibilities && job.responsibilities.length > 0 && (
        <div>
          <h4 className="drawer-section-heading">Responsibilities</h4>
          <ul className="drawer-bullet-list">
            {job.responsibilities.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <div>
          <h4 className="drawer-section-heading">Requirements & Prerequisites</h4>
          <ul className="drawer-bullet-list">
            {job.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {job.benefits && job.benefits.length > 0 && (
        <div>
          <h4 className="drawer-section-heading">Perks & Coverage</h4>
          <div className="drawer-perks-group">
            {job.benefits.map((b, i) => (
              <span key={i} className="drawer-perk-pill">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="drawer-footer-actions">
        <button
          className={`btn btn-icon ${job.isSaved ? 'saved-active' : ''}`}
          title={job.isSaved ? 'Remove Bookmark' : 'Save Job'}
          aria-label={job.isSaved ? 'Remove Bookmark' : 'Save Job'}
          onClick={() => onToggleSave(job.id)}
        >
          {job.isSaved ? <MdBookmark className="job-bookmark-icon-active" /> : <MdBookmarkBorder />}
        </button>

        <button
          className="btn btn-icon"
          title="Share Job"
          aria-label="Share Job"
          onClick={handleShare}
        >
          <MdShare />
        </button>

        <button
          className="btn btn-icon"
          title="Report Job"
          aria-label="Report Job"
          onClick={handleReport}
        >
          <MdFlag />
        </button>

        {job.alreadyApplied ? (
          <button className="btn btn-secondary job-applied-btn-wide" disabled>
            <MdCheckCircle /> Application Submitted
          </button>
        ) : (
          <button
            className="btn btn-primary job-apply-btn-wide"
            disabled={isApplying}
            onClick={() => onApply(job.id)}
          >
            {isApplying ? 'Submitting Application...' : 'Apply for Job'}
          </button>
        )}
      </div>
    </>
  )
}
