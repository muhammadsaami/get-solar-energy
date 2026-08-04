import React from 'react'
import type { PerformanceMetrics } from '../types/profile.types'
import { MdCheckCircle, MdShield, MdStar, MdAccessTime } from 'react-icons/md'

interface PerformanceMetricsTabProps {
  metrics: PerformanceMetrics
}

export default function PerformanceMetricsTab({ metrics }: PerformanceMetricsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="profile-panel">
        <h3 className="profile-panel-title">
          Quality & Service Scorecard
        </h3>

        <div className="scorecard-grid">
          {/* Quality Score */}
          <div className="scorecard-card">
            <div className="scorecard-header">
              <span style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdStar style={{ color: '#f7931e' }} /> Customer Rating
              </span>
              <strong style={{ fontSize: '18px', color: '#ffffff' }}>{metrics.qualityScoreRating} / 5.0</strong>
            </div>
            <div className="scorecard-track">
              <div className="scorecard-fill" style={{ width: `${(metrics.qualityScoreRating / 5) * 100}%`, background: '#f7931e' }} />
            </div>
          </div>

          {/* On Time Arrival */}
          <div className="scorecard-card">
            <div className="scorecard-header">
              <span style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdAccessTime style={{ color: '#00aeef' }} /> On-Time Arrival
              </span>
              <strong style={{ fontSize: '18px', color: '#ffffff' }}>{metrics.onTimeArrivalRatePercent}%</strong>
            </div>
            <div className="scorecard-track">
              <div className="scorecard-fill" style={{ width: `${metrics.onTimeArrivalRatePercent}%`, background: '#00aeef' }} />
            </div>
          </div>

          {/* Safety Compliance */}
          <div className="scorecard-card">
            <div className="scorecard-header">
              <span style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdShield style={{ color: '#a855f7' }} /> LOTO Safety Audit
              </span>
              <strong style={{ fontSize: '18px', color: '#ffffff' }}>{metrics.safetyCompliancePercent}%</strong>
            </div>
            <div className="scorecard-track">
              <div className="scorecard-fill" style={{ width: `${metrics.safetyCompliancePercent}%`, background: '#a855f7' }} />
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="scorecard-card">
            <div className="scorecard-header">
              <span style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdCheckCircle style={{ color: '#10b981' }} /> Customer Satisfaction
              </span>
              <strong style={{ fontSize: '18px', color: '#ffffff' }}>{metrics.customerSatisfactionPercent}%</strong>
            </div>
            <div className="scorecard-track">
              <div className="scorecard-fill" style={{ width: `${metrics.customerSatisfactionPercent}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
