import React from 'react'
import type { PerformanceMetrics } from '../types/profile.types'
import { MdWork, MdStar, MdCheckCircle, MdShield, MdAttachMoney } from 'react-icons/md'

interface ProfileKPIsProps {
  metrics: PerformanceMetrics
}

export default function ProfileKPIs({ metrics }: ProfileKPIsProps) {
  return (
    <div className="profile-kpi-grid">
      <div className="profile-kpi-card">
        <div className="profile-kpi-icon">
          <MdWork />
        </div>
        <div>
          <div className="profile-kpi-val">{metrics.jobsCompleted}</div>
          <div className="profile-kpi-lbl">Jobs Completed</div>
        </div>
      </div>

      <div className="profile-kpi-card">
        <div className="profile-kpi-icon" style={{ background: 'rgba(247, 147, 30, 0.1)', color: '#f7931e' }}>
          <MdStar />
        </div>
        <div>
          <div className="profile-kpi-val">{metrics.qualityScoreRating} / 5.0</div>
          <div className="profile-kpi-lbl">Quality Rating</div>
        </div>
      </div>

      <div className="profile-kpi-card">
        <div className="profile-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdCheckCircle />
        </div>
        <div>
          <div className="profile-kpi-val">{metrics.onTimeArrivalRatePercent}%</div>
          <div className="profile-kpi-lbl">On-Time Arrival</div>
        </div>
      </div>

      <div className="profile-kpi-card">
        <div className="profile-kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
          <MdShield />
        </div>
        <div>
          <div className="profile-kpi-val">{metrics.safetyCompliancePercent}%</div>
          <div className="profile-kpi-lbl">Safety Audit</div>
        </div>
      </div>

      <div className="profile-kpi-card">
        <div className="profile-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdAttachMoney />
        </div>
        <div>
          <div className="profile-kpi-val">₹{metrics.totalEarnedBudget.toLocaleString('en-IN')}</div>
          <div className="profile-kpi-lbl">Total Earnings</div>
        </div>
      </div>
    </div>
  )
}
