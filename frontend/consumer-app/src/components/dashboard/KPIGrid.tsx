import React from 'react';
import { fmtINR } from '../../utils/dashboard';
import type { DashboardDerived } from '../../utils/dashboard';

interface Props {
  loading?: boolean;
  derived: DashboardDerived;
}

export default function KPIGrid({ loading, derived }: Props) {
  const full = 2 * Math.PI * 35;
  const offset = full - (loading ? 0 : (derived.readinessPercent / 100) * full);
  const gaugeText = loading ? '…' : `${derived.readinessPercent}%`;
  const lifetimeBar = loading ? 0 : 100;

  return (
    <section className="kpi-container" aria-label="Key Performance Metrics">
      <div className="card-base readiness-card">
        <div className="readiness-details">
          <span className="readiness-title"><span className="readiness-title-dot"></span> Solar Readiness Score</span>
          <p className="readiness-desc">
            {loading
              ? 'Assessing your solar eligibility.'
              : derived.readinessPercent >= 60
                ? 'Your home is ready for high-yield solar generation.'
                : 'Complete the analysis steps below to unlock your solar assessment.'}
          </p>
          <button
            className="readiness-btn"
            id="readinessDetailsBtn"
            onClick={(e) => { e.preventDefault(); }}
          >
            View Details
          </button>
        </div>
        <div className="readiness-gauge-wrapper">
          <svg className="readiness-gauge-svg">
            <circle className="readiness-gauge-track" cx="38" cy="38" r="35" />
            <circle
              className="readiness-gauge-fill"
              cx="38" cy="38" r="35"
              id="readinessFillCircle"
              style={{ strokeDasharray: full, strokeDashoffset: offset }}
            />
          </svg>
          <span className="readiness-gauge-val" id="readinessTextVal">{gaugeText}</span>
        </div>
      </div>
      <div className="readiness-stage-pill">
        {loading ? '…' : derived.readinessPercent >= 60 ? 'High-yield ready' : 'Optimization possible'}
      </div>

      <div className="kpi-row-layout">
        <div className="card-base kpi-widget">
          <div className="kpi-widget-head">
            <span className="kpi-title">Estimated Annual Savings</span>
            <span className="kpi-widget-trend positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
            </span>
          </div>
          <div className="kpi-value-block">
            <span className="kpi-value-text" id="annualSavingsTextVal">{loading ? '—' : fmtINR(derived.annualSavings)}</span>
            <span className="kpi-value-unit">/year</span>
          </div>
          <div className="kpi-widget-progress">
            <div className="kpi-widget-track"><div className="kpi-widget-fill positive" style={{ width: '72%' }}></div></div>
            <span className="kpi-widget-progress-label">vs. current bill</span>
          </div>
          <div className="kpi-widget-foot">
            <span className="kpi-widget-foot-note positive">Annual savings from your assessed system</span>
            <span className="kpi-widget-foot-pill">Project Data</span>
          </div>
        </div>

        <div className="card-base kpi-widget">
          <div className="kpi-widget-head">
            <span className="kpi-title">Lifetime Savings <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(25 Years)</span></span>
            <span className="kpi-widget-trend positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            </span>
          </div>
          <div className="kpi-value-block">
            <span className="kpi-value-text" id="lifetimeSavingsTextVal">{loading ? '—' : fmtINR(derived.lifetimeSavings)}</span>
            <span className="kpi-value-unit">gross</span>
          </div>
          <div className="kpi-widget-progress">
            <div className="kpi-widget-track"><div className="kpi-widget-fill" style={{ width: `${lifetimeBar}%` }}></div></div>
            <span className="kpi-widget-progress-label">25-yr horizon</span>
          </div>
          <div className="savings-bar-box" id="savingsBarsContainer">
            {[20, 35, 48, 60, 78, 100].map((h, i) => (
              <div
                key={i}
                className={`savings-bar${i === 5 ? ' active' : ''}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="kpi-widget-foot">
            <span className="kpi-widget-foot-note positive">Projected returns over the system lifespan</span>
            <span className="kpi-widget-foot-pill">Projection</span>
          </div>
        </div>
      </div>
    </section>
  );
}