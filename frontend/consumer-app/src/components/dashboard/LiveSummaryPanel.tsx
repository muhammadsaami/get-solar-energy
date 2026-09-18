import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { fmtINR } from '../../utils/dashboard';
import type { DashboardDerived } from '../../utils/dashboard';

interface Props {
  loading?: boolean;
  derived: DashboardDerived;
  journey: { bill: boolean; roof: boolean; roi: boolean; proposal: boolean; installation: boolean };
  onToggleDemo?: () => void;
  onExitDemo?: () => void;
}

export default function LiveSummaryPanel({ loading, derived, journey, onToggleDemo, onExitDemo }: Props) {
  const steps = [
    { key: 'bill', label: 'Bill Analysis', done: derived.isSamplePreview ? true : journey.bill },
    { key: 'roof', label: 'Roof Analysis', done: derived.isSamplePreview ? true : journey.roof },
    { key: 'roi', label: 'ROI Calculation', done: derived.isSamplePreview ? true : journey.roi },
    { key: 'proposal', label: 'Proposal Generated', done: journey.proposal },
    { key: 'installation', label: 'System Installation', done: journey.installation },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="live-summary-panel">
      <div className="summary-header">
        <span className="summary-title">
          {derived.isSamplePreview ? 'Demo Preview' : 'Live Summary'}
        </span>
        {derived.isSamplePreview ? (
          <span
            className="summary-sample-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
            SAMPLE PREVIEW
          </span>
        ) : derived.isFreshUser ? (
          <span
            className="summary-fresh-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Awaiting Analysis
          </span>
        ) : (
          <span className="summary-live-pill"><span className="live-pulse-dot"></span> Live</span>
        )}
      </div>

      {/* ── EXPLICIT DEMO BANNER ─────────────────────────────────────────── */}
      {derived.isSamplePreview && (
        <div
          className="demo-mode-banner"
          style={{
            margin: 'var(--space-3, 12px) 0',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1.5px solid rgba(245, 158, 11, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              DEMO — SAMPLE DATA — NOT YOUR DATA
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onExitDemo}
                className="btn btn-secondary"
                style={{
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#f1f5f9',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Exit Demo
              </button>
              <Link
                to={ROUTES.BILL_ANALYZER}
                className="btn btn-primary"
                style={{
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                Analyze My Electricity Bill &rarr;
              </Link>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.45 }}>
            These are sample values for demonstration. They do not represent your home, roof, or electricity consumption.
          </p>
        </div>
      )}

      {/* ── FRESH CUSTOMER EMPTY STATE NOTIFICATION & CTA ───────────────── */}
      {derived.isFreshUser && (
        <div
          className="fresh-user-empty-banner"
          style={{
            margin: 'var(--space-3, 12px) 0',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
            Your personalized solar insights will appear here after you analyze your electricity usage.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to={ROUTES.BILL_ANALYZER}
              className="btn btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
            >
              Analyze your electricity bill &rarr;
            </Link>
            {onToggleDemo && (
              <button
                type="button"
                onClick={onToggleDemo}
                style={{
                  fontSize: '11.5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                See Example Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      <div className="readiness-lead-block">
        <div className="readiness-lead-meta">
          <span className="readiness-lbl">Solar Readiness Score</span>
          <span className="readiness-badge">
            {loading ? '…' : derived.readinessPercent !== null ? `${derived.readinessPercent}%` : '—'}
          </span>
        </div>
        <div className="readiness-primary-row">
          <div className="readiness-progress-track">
            <div
              className="readiness-progress-fill"
              style={{ width: loading || derived.readinessPercent === null ? '0%' : `${derived.readinessPercent}%` }}
            ></div>
          </div>
          <span className="readiness-stage-label">
            {loading
              ? 'Assessing…'
              : derived.readinessPercent === null
                ? 'Pending bill analysis'
                : derived.readinessPercent >= 60
                  ? 'High yield ready'
                  : 'Optimization possible'}
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
          <span className="summary-value">
            {loading ? '—' : derived.annualSavings ? `${fmtINR(derived.annualSavings)}/yr` : '—'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Recommended Size</span>
          <span className="summary-value">
            {derived.recommendedKw ? `${derived.recommendedKw} kW` : '—'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Payback Period</span>
          <span className="summary-value">
            {derived.paybackYears ? `${derived.paybackYears} yrs` : '—'}
          </span>
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
