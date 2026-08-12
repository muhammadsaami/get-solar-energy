import React from 'react';
import { calculateSubsidy } from '../../utils/solar';
import { fmtINR } from '../../utils/dashboard';
import type { DashboardDerived } from '../../utils/dashboard';
import type { CustomerDashboardData } from '../../hooks/useCustomerDashboard';

interface Props {
  data: CustomerDashboardData;
  derived: DashboardDerived;
  loading?: boolean;
}

export default function AnalyticsCharts({ data, derived }: Props) {
  const hasSolar = data.analysis.solar !== null;
  const hasBill = data.analysis.bill !== null;
  const production = derived.productionKwh;
  const consumption = derived.monthlyUnits;
  const subsidy = derived.recommendedKw ? calculateSubsidy(derived.recommendedKw) : 0;
  const subsidyPct = derived.recommendedKw ? Math.min(100, Math.round((subsidy / (derived.recommendedKw * 55000)) * 100)) : 0;

  return (
    <div className="analytics-grid">
      {/* Energy Production */}
      <section className="analytics-card">
        <div className="analytics-header-row">
          <h4 className="analytics-title">Energy Production</h4>
          <span className={`analytics-data-pill ${hasSolar ? 'ok' : 'idle'}`}>{hasSolar ? 'Assessed' : 'Awaiting data'}</span>
        </div>
        <div>
          <span className="analytics-chart-subtext">Total Generated (est.)</span>
          <div className="analytics-chart-val-row">
            <span className="analytics-chart-val">{hasSolar && production ? `${production} kWh` : '—'}</span>
            {hasSolar && production ? (
              <span className="analytics-chart-indicator positive">Assessed from your report</span>
            ) : (
              <span className="analytics-chart-indicator">Run a production analysis to see this</span>
            )}
          </div>
        </div>
        <div className="chart-canvas-box analytics-empty-chart">
          {hasSolar && production ? `${production} kWh estimated monthly generation` : 'No production data yet'}
        </div>
      </section>

      {/* Electricity Consumption */}
      <section className="analytics-card">
        <div className="analytics-header-row">
          <h4 className="analytics-title">Electricity Consumption</h4>
          <span className={`analytics-data-pill ${hasBill ? 'ok' : 'idle'}`}>{hasBill ? 'Synced' : 'Awaiting data'}</span>
        </div>
        <div>
          <span className="analytics-chart-subtext">Total Consumed / month</span>
          <div className="analytics-chart-val-row">
            <span className="analytics-chart-val">{hasBill && consumption ? `${consumption} kWh` : '—'}</span>
            {hasBill && consumption ? (
              <span className="analytics-chart-indicator positive">From your bill</span>
            ) : (
              <span className="analytics-chart-indicator neutral">Analyze your bill to see this</span>
            )}
          </div>
        </div>
        <div className="chart-canvas-box analytics-empty-chart">
          {hasBill && consumption ? `${consumption} kWh monthly consumption` : 'No bill data yet'}
        </div>
      </section>

      {/* Government Subsidy */}
      <section className="analytics-card subsidy-card">
        <div className="analytics-header-row">
          <h4 className="analytics-title" style={{ color: '#15803d' }}>Government Subsidy</h4>
          <span className="subsidy-tag">{derived.recommendedKw ? 'Eligible for Central & State Subsidy' : 'Based on assessed size'}</span>
        </div>
        <div className="subsidy-hero-row">
          <div className="subsidy-val">{subsidy ? fmtINR(subsidy) : '—'}</div>
          <span className="subsidy-hero-label">Estimated Eligible Amount</span>
        </div>
        <div className="subsidy-divider"></div>
        <div className="subsidy-breakdown" style={{ paddingTop: '0.5rem' }}>
          <span className="readiness-desc" style={{ margin: 0 }}>
            {derived.recommendedKw ? `Estimated for a ${derived.recommendedKw} kW system. Exact amount depends on your state & current MNRE scheme.` : 'Analyze your roof to estimate the subsidy you may be eligible for.'}
          </span>
        </div>
        <div className="subsidy-progress-row">
          <div className="subsidy-progress-track">
            <div className="subsidy-progress-fill" style={{ width: `${subsidyPct}%` }}></div>
          </div>
          <span className="subsidy-progress-label">{subsidy ? `${subsidyPct}% of system cost` : '—'}</span>
        </div>
        <button className="subsidy-btn" id="subsidyBtn" onClick={(e) => { e.preventDefault(); }}>
          <span>Check Eligibility</span>
          <svg><use href="#icon-arrow-right"></use></svg>
        </button>
      </section>

      {/* System Performance */}
      <section className="analytics-card">
        <div className="analytics-header-row">
          <h4 className="analytics-title">System Performance</h4>
          <span className="analytics-data-pill idle">Post-installation</span>
        </div>
        <div className="perf-donut-box">
          <span className="readiness-hint" style={{ textAlign: 'center', margin: 0, padding: '1rem' }}>
            Performance metrics appear after your system is installed.
          </span>
        </div>
        <div className="perf-progress-list" style={{ opacity: 0, pointerEvents: 'none', height: 0 }}>
          <div className="perf-progress-item">
            <div className="perf-progress-labels"><span>Inverter</span><span>—</span></div>
          </div>
        </div>
        <button className="perf-btn" id="viewInsightsBtn" onClick={(e) => { e.preventDefault(); }}>
          <span>View All Insights</span>
          <svg><use href="#icon-arrow-right"></use></svg>
        </button>
      </section>
    </div>
  );
}