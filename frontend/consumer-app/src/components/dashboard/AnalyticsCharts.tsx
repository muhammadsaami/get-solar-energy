import React from 'react';

export default function AnalyticsCharts() {
  return (
    <div className="analytics-grid">
              
              {/* Energy Production (Column 1) */}
              <section className="analytics-card">
                <div className="analytics-header-row">
                  <h4 className="analytics-title">Energy Production</h4>
                  <select className="chart-select" aria-label="Energy Production Timeline Selector">
                    <option>This Month</option>
                    <option>Last Month</option>
                  </select>
                </div>
                <div>
                  <span className="analytics-chart-subtext">Total Generated</span>
                  <div className="analytics-chart-val-row">
                    <span className="analytics-chart-val">486 kWh</span>
                    <span className="analytics-chart-indicator positive">✓ +22.5% vs last month</span>
                  </div>
                </div>
                <div className="chart-canvas-box">
                  <canvas id="productionChart"></canvas>
                </div>
              </section>
    
              {/* Electricity Consumption (Column 2) */}
              <section className="analytics-card">
                <div className="analytics-header-row">
                  <h4 className="analytics-title">Electricity Consumption</h4>
                  <select className="chart-select" aria-label="Electricity Consumption Timeline Selector">
                    <option>This Month</option>
                    <option>Last Month</option>
                  </select>
                </div>
                <div>
                  <span className="analytics-chart-subtext">Total Consumed</span>
                  <div className="analytics-chart-val-row">
                    <span className="analytics-chart-val">362 kWh</span>
                    <span className="analytics-chart-indicator negative">✓ -12.4% vs last month</span>
                  </div>
                </div>
                <div className="chart-canvas-box">
                  <canvas id="consumptionChart"></canvas>
                </div>
              </section>
    
              {/* Government Subsidy (Column 3) */}
              <section className="analytics-card subsidy-card">
                <div className="analytics-header-row">
                  <h4 className="analytics-title" style={{ color: '#15803d' }}>Government Subsidy</h4>
                  <span className="subsidy-tag">Eligible for Central & State Subsidy</span>
                </div>
                <div className="subsidy-hero-row">
                  <div className="subsidy-val">₹78,000</div>
                  <span className="subsidy-hero-label">Eligible Amount</span>
                </div>
                <div className="subsidy-divider"></div>
                <div className="subsidy-breakdown">
                  <div className="subsidy-item">
                    <svg className="subsidy-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="subsidy-item-label">Central Subsidy (MNRE)</span>
                    <span className="subsidy-item-amount">₹30,000</span>
                  </div>
                  <div className="subsidy-item">
                    <svg className="subsidy-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="subsidy-item-label">State Subsidy</span>
                    <span className="subsidy-item-amount">₹30,000</span>
                  </div>
                  <div className="subsidy-item">
                    <svg className="subsidy-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="subsidy-item-label">Additional Incentives</span>
                    <span className="subsidy-item-amount">₹18,000</span>
                  </div>
                </div>
                <div className="subsidy-progress-row">
                  <div className="subsidy-progress-track">
                    <div className="subsidy-progress-fill" style={{ width: '75%' }}></div>
                  </div>
                  <span className="subsidy-progress-label">75% Eligible</span>
                </div>
                <button className="subsidy-btn" id="subsidyBtn" onClick={(e) => { e.preventDefault(); }}>
                  <span>Check Eligibility</span>
                  <svg><use href="#icon-arrow-right"></use></svg>
                </button>
              </section>
    
              {/* System Performance (Column 4) */}
              <section className="analytics-card">
                <div className="analytics-header-row">
                  <h4 className="analytics-title">System Performance</h4>
                </div>
                <div className="perf-donut-box">
                  <svg className="perf-donut-svg">
                    <circle className="perf-donut-track" cx="45" cy="45" r="40"/>
                    <circle className="perf-donut-fill" cx="45" cy="45" r="40" id="perfFillCircle"/>
                  </svg>
                  <div className="perf-donut-text-box">
                    <span className="perf-donut-val">88%</span>
                    <span className="perf-donut-lbl">Excellent</span>
                  </div>
                </div>
                <div className="perf-progress-list">
                  {/* Inverter */}
                  <div className="perf-progress-item">
                    <div className="perf-progress-labels">
                      <span>Inverter</span>
                      <span>98%</span>
                    </div>
                    <div className="perf-progress-track">
                      <div className="perf-progress-fill" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                  {/* Panels */}
                  <div className="perf-progress-item">
                    <div className="perf-progress-labels">
                      <span>Panels</span>
                      <span>91%</span>
                    </div>
                    <div className="perf-progress-track">
                      <div className="perf-progress-fill" style={{ width: '91%' }}></div>
                    </div>
                  </div>
                  {/* Battery */}
                  <div className="perf-progress-item">
                    <div className="perf-progress-labels">
                      <span>Battery</span>
                      <span>76%</span>
                    </div>
                    <div className="perf-progress-track">
                      <div className="perf-progress-fill" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  {/* Wiring */}
                  <div className="perf-progress-item">
                    <div className="perf-progress-labels">
                      <span>Wiring</span>
                      <span>87%</span>
                    </div>
                    <div className="perf-progress-track">
                      <div className="perf-progress-fill" style={{ width: '87%' }}></div>
                    </div>
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
