import React from 'react';
import type { DashboardDerived } from '../../utils/dashboard';

interface Props {
  loading?: boolean;
  derived: DashboardDerived;
}

export default function SubKPIGrid({ loading, derived }: Props) {
  const roiPeriod = derived.paybackYears
    ? `${derived.paybackYears.toFixed(1)} Years`
    : 'Calculate ROI';
  const carbonOffset = derived.roofSystemKw
    ? `${((derived.roofSystemKw * 4.5 * 30 * 12 * 0.82) / 1000).toFixed(1)} Tons`
    : '—';
  const systemSize = derived.recommendedKw || derived.roofSystemKw
    ? `${(derived.recommendedKw || derived.roofSystemKw).toFixed(1)} kW`
    : '—';
  const independence = derived.monthlyUnits && derived.roofSystemKw
    ? `${Math.min(100, Math.round((derived.roofSystemKw * 4.5 * 30 / derived.monthlyUnits) * 100))}%`
    : '—';

  return (
    <section className="sub-kpis-grid" aria-label="Solar System Design Metrics">
      <div className="sub-kpi-widget">
        <div className="sub-kpi-top">
          <div className="sub-kpi-icon-box orange">
            <svg viewBox="0 0 24 24" stroke="currentColor"><use href="#icon-calculator"></use></svg>
          </div>
          <div className="sub-kpi-text-box">
            <span className="sub-kpi-label">ROI Period</span>
            <span className="sub-kpi-val" aria-live="polite" id="roiPeriodVal">{loading ? '…' : roiPeriod}</span>
          </div>
        </div>
        <div className="sub-kpi-meter">
          <div className="sub-kpi-meter-track"><div className="sub-kpi-meter-fill orange" style={{ width: derived.paybackYears ? '100%' : '12%' }}></div></div>
        </div>
        <span className="sub-kpi-desc" style={{ color: '#ea580c', fontWeight: '600' }}>
          {derived.paybackYears ? 'Excellent Return' : 'Run ROI analysis'}
        </span>
      </div>

      <div className="sub-kpi-widget">
        <div className="sub-kpi-top">
          <div className="sub-kpi-icon-box green">
            <svg viewBox="0 0 24 24" stroke="currentColor"><use href="#icon-leaf"></use></svg>
          </div>
          <div className="sub-kpi-text-box">
            <span className="sub-kpi-label">Carbon Offset</span>
            <span className="sub-kpi-val" aria-live="polite" id="carbonOffsetVal">{carbonOffset}</span>
          </div>
        </div>
        <div className="sub-kpi-meter">
          <div className="sub-kpi-meter-track"><div className="sub-kpi-meter-fill green" style={{ width: derived.roofSystemKw ? '78%' : '8%' }}></div></div>
        </div>
        <span className="sub-kpi-desc" style={{ color: '#16a34a', fontWeight: '600' }}>CO₂ Reduced (est.)</span>
      </div>

      <div className="sub-kpi-widget">
        <div className="sub-kpi-top">
          <div className="sub-kpi-icon-box blue">
            <svg viewBox="0 0 24 24" stroke="currentColor"><use href="#icon-roof"></use></svg>
          </div>
          <div className="sub-kpi-text-box">
            <span className="sub-kpi-label">System Size</span>
            <span className="sub-kpi-val" aria-live="polite" id="systemSizeVal">{systemSize}</span>
          </div>
        </div>
        <div className="sub-kpi-meter">
          <div className="sub-kpi-meter-track"><div className="sub-kpi-meter-fill blue" style={{ width: derived.recommendedKw ? '64%' : '10%' }}></div></div>
        </div>
        <span className="sub-kpi-desc" style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>From your assessment</span>
      </div>

      <div className="sub-kpi-widget">
        <div className="sub-kpi-top">
          <div className="sub-kpi-icon-box orange">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><use href="#icon-star"></use></svg>
          </div>
          <div className="sub-kpi-text-box">
            <span className="sub-kpi-label">Energy Independence</span>
            <span className="sub-kpi-val" aria-live="polite" id="energyIndependenceVal">{independence}</span>
          </div>
        </div>
        <div className="sub-kpi-meter">
          <div className="sub-kpi-meter-track"><div className="sub-kpi-meter-fill orange" style={{ width: independence !== '—' ? independence : '5%' }}></div></div>
        </div>
        <span className="sub-kpi-desc" style={{ color: '#ea580c', fontWeight: '600' }}>Coverage estimate</span>
      </div>
    </section>
  );
}
