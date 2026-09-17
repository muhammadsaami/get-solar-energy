import React from 'react'
import type { JobMarketplaceSummary } from '../types/jobMarketplace.types'
import { MdWork, MdCheckCircle, MdBookmark, MdEventAvailable, MdPsychology, MdAttachMoney } from 'react-icons/md'

interface JobMarketplaceKPIsProps {
  summary: JobMarketplaceSummary
}

export default function JobMarketplaceKPIs({ summary }: JobMarketplaceKPIsProps) {
  return (
    <div className="job-kpi-grid">
      <div className="job-kpi-card">
        <div className="job-kpi-icon">
          <MdWork />
        </div>
        <div>
          <div className="job-kpi-val">{summary.totalOpenJobs}</div>
          <div className="job-kpi-lbl">Open Jobs</div>
        </div>
      </div>

      <div className="job-kpi-card">
        <div className="job-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdCheckCircle />
        </div>
        <div>
          <div className="job-kpi-val">{summary.totalApplied}</div>
          <div className="job-kpi-lbl">Applied</div>
        </div>
      </div>

      <div className="job-kpi-card">
        <div className="job-kpi-icon" style={{ background: 'rgba(247, 147, 30, 0.1)', color: '#f7931e' }}>
          <MdBookmark />
        </div>
        <div>
          <div className="job-kpi-val">{summary.totalSaved}</div>
          <div className="job-kpi-lbl">Saved Jobs</div>
        </div>
      </div>

      <div className="job-kpi-card">
        <div className="job-kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
          <MdEventAvailable />
        </div>
        <div>
          <div className="job-kpi-val">{summary.totalInterviews}</div>
          <div className="job-kpi-lbl">Interviews</div>
        </div>
      </div>

      <div className="job-kpi-card">
        <div className="job-kpi-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
          <MdPsychology />
        </div>
        <div>
          <div className="job-kpi-val">{summary.profileMatchPercent}%</div>
          <div className="job-kpi-lbl">Profile Match</div>
        </div>
      </div>

      <div className="job-kpi-card">
        <div className="job-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdAttachMoney />
        </div>
        <div>
          <div className="job-kpi-val">₹{summary.averageSalary.toLocaleString('en-IN')}</div>
          <div className="job-kpi-lbl">Avg Salary / Job</div>
        </div>
      </div>
    </div>
  )
}
