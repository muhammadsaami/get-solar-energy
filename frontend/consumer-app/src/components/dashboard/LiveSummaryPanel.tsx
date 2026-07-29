import React from 'react';

export default function LiveSummaryPanel() {
  return (
    <div className="live-summary-panel">
      <div className="summary-header">
        <span className="summary-title">Live Summary</span>
        <span className="summary-badge">Dynamic Sync</span>
      </div>
      
      {/* Top: Animated Solar Readiness Indicator */}
      <div className="readiness-panel-top">
        <div className="readiness-header-row">
          <span className="readiness-lbl">Solar Readiness</span>
          <span className="readiness-badge pending" id="summaryReadinessBadge">Pending Assessment</span>
        </div>
        <div className="readiness-bar-row">
          <span className="readiness-percentage" id="summaryReadinessVal">Pending</span>
          <div className="readiness-progress-track">
            <div className="readiness-progress-fill" id="summaryReadinessProgress" style={{ width: '0%' }}></div>
          </div>
        </div>
      </div>

      {/* Middle: Responsive KPI Grid */}
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Monthly Bill</span>
          <span className="summary-value" id="summaryMonthlyBill">Upload your first bill</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Estimated Savings</span>
          <span className="summary-value" id="summarySolarSavings">Available after analysis</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Recommended Size</span>
          <span className="summary-value" id="summarySystemSize">Analyze your roof</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Payback Period</span>
          <span className="summary-value" id="summaryPayback">Calculate ROI</span>
        </div>
      </div>

      {/* Bottom: Customer Journey Compact Checklist */}
      <div className="journey-checklist-panel">
        <span className="journey-title">Your Solar Journey</span>
        <div className="journey-checklist">
          <div className="checklist-item" id="check-bill">
            <div className="check-box"></div>
            <span className="check-label">Bill Analysis</span>
          </div>
          <div className="checklist-item" id="check-roof">
            <div className="check-box"></div>
            <span className="check-label">Roof Analysis</span>
          </div>
          <div className="checklist-item" id="check-roi">
            <div className="check-box"></div>
            <span className="check-label">ROI Calculation</span>
          </div>
          <div className="checklist-item" id="check-proposal">
            <div className="check-box"></div>
            <span className="check-label">Proposal Generated</span>
          </div>
          <div className="checklist-item" id="check-installation">
            <div className="check-box"></div>
            <span className="check-label">System Installation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
