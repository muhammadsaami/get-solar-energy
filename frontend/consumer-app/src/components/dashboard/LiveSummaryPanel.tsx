import React from 'react';
import { fmtINR } from '../../utils/dashboard';
import type { DashboardDerived } from '../../utils/dashboard';

interface Props {
  loading?: boolean;
  derived: DashboardDerived;
  journey: { bill: boolean; roof: boolean; roi: boolean; proposal: boolean; installation: boolean };
}

export default function LiveSummaryPanel({ loading, derived, journey }: Props) {
  const steps = [
    { key: 'bill', label: 'Bill Analysis', done: journey.bill },
    { key: 'roof', label: 'Roof Analysis', done: journey.roof },
    { key: 'roi', label: 'ROI Calculation', done: journey.roi },
    { key: 'proposal', label: 'Proposal Generated', done: journey.proposal },
    { key: 'installation', label: 'System Installation', done: journey.installation },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="live-summary-panel">
      <div className="summary-header">
        <span className="summary-title">Live Summary</span>
        <span className="summary-live-pill"><span className="live-pulse-dot"></span> Live</span>
      </div>

      <div className="readiness-lead-block">
        <div className="readiness-lead-meta">
          <span className="readiness-lbl">Solar Readiness Score</span>
          <span className="readiness-badge">{loading ? '…' : `${derived.readinessPercent}%`}</span>
        </div>
        <div className="readiness-primary-row">
          <div className="readiness-progress-track">
            <div className="readiness-progress-fill" style={{ width: loading ? '0%' : `${derived.readinessPercent}%` }}></div>
          </div>
          <span className="readiness-stage-label">
            {loading ? 'Assessing…' : derived.readinessPercent >= 60 ? 'High yield ready' : 'Optimization possible'}
          </span>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Monthly Bill</span>
          <span className="summary-value">{fmtINR(derived.monthlyBill)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Estimated Savings</span>
          <span className="summary-value">{loading ? '—' : `${fmtINR(derived.annualSavings)}/yr`}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Recommended Size</span>
          <span className="summary-value">{derived.recommendedKw ? `${derived.recommendedKw} kW` : 'Analyze your roof'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Payback Period</span>
          <span className="summary-value">{derived.paybackYears ? `${derived.paybackYears} yrs` : 'Calculate ROI'}</span>
        </div>
      </div>

      <div className="journey-card">
        <div className="journey-card-head">
          <span className="journey-title">Your Solar Journey</span>
          <span className="journey-progress-label">{doneCount}/{steps.length} completed</span>
        </div>
        <div className="journey-track-bar">
          <div className="journey-track-fill" style={{ width: `${(doneCount / steps.length) * 100}%` }}></div>
        </div>
        <div className="journey-checklist">
          {steps.map((step) => (
            <div className={`checklist-item ${step.done ? 'completed' : ''}`} key={step.key}>
              <div className="check-box">{step.done ? '✓' : ''}</div>
              <span className="check-label">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
