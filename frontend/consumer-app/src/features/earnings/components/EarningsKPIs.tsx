import React from 'react'
import type { EarningsSummary } from '../types/earnings.types'
import { MdAttachMoney, MdCheckCircle, MdPending, MdWork, MdTrendingUp } from 'react-icons/md'

interface EarningsKPIsProps {
  summary: EarningsSummary
}

export default function EarningsKPIs({ summary }: EarningsKPIsProps) {
  return (
    <div className="earnings-kpi-grid">
      <div className="earnings-kpi-card">
        <div className="earnings-kpi-icon">
          <MdAttachMoney />
        </div>
        <div>
          <div className="earnings-kpi-val">₹{summary.totalEarned.toLocaleString('en-IN')}</div>
          <div className="earnings-kpi-lbl">Total Earned</div>
        </div>
      </div>

      <div className="earnings-kpi-card">
        <div className="earnings-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <MdCheckCircle />
        </div>
        <div>
          <div className="earnings-kpi-val">₹{summary.totalPaid.toLocaleString('en-IN')}</div>
          <div className="earnings-kpi-lbl">Paid Out</div>
        </div>
      </div>

      <div className="earnings-kpi-card">
        <div className="earnings-kpi-icon" style={{ background: 'rgba(247, 147, 30, 0.1)', color: '#f7931e' }}>
          <MdPending />
        </div>
        <div>
          <div className="earnings-kpi-val">₹{summary.totalPending.toLocaleString('en-IN')}</div>
          <div className="earnings-kpi-lbl">Pending Settlement</div>
        </div>
      </div>

      <div className="earnings-kpi-card">
        <div className="earnings-kpi-icon" style={{ background: 'rgba(0, 174, 239, 0.1)', color: '#00aeef' }}>
          <MdWork />
        </div>
        <div>
          <div className="earnings-kpi-val">{summary.totalJobsCompleted}</div>
          <div className="earnings-kpi-lbl">Jobs Completed</div>
        </div>
      </div>

      <div className="earnings-kpi-card">
        <div className="earnings-kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
          <MdTrendingUp />
        </div>
        <div>
          <div className="earnings-kpi-val">₹{summary.averageEarnedPerJob.toLocaleString('en-IN')}</div>
          <div className="earnings-kpi-lbl">Avg Earned / Job</div>
        </div>
      </div>
    </div>
  )
}
