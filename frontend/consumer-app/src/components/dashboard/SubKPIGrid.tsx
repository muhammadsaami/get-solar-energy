export default function SubKPIGrid() {
  return (
    <section className="sub-kpis-grid" aria-label="Solar System Design Metrics">
              {/* Card 1 */}
              <div className="sub-kpi-card">
                <div className="sub-kpi-icon-box orange">
                  <svg viewBox="0 0 24 24" stroke="currentColor"><use href="#icon-calculator"></use></svg>
                </div>
                <div className="sub-kpi-text-box">
                  <span className="sub-kpi-label">ROI Period</span>
                  <span className="sub-kpi-val" aria-live="polite" id="roiPeriodVal">3.8 Years</span>
                  <span className="sub-kpi-desc" style={{ color: '#ea580c', fontWeight: '600' }}>Excellent Return</span>
                </div>
              </div>
              {/* Card 2 */}
              <div className="sub-kpi-card">
                <div className="sub-kpi-icon-box green">
                  <svg viewBox="0 0 24 24" stroke="currentColor"><use href="#icon-leaf"></use></svg>
                </div>
                <div className="sub-kpi-text-box">
                  <span className="sub-kpi-label">Carbon Offset</span>
                  <span className="sub-kpi-val" aria-live="polite" id="carbonOffsetVal">12.4 Tons</span>
                  <span className="sub-kpi-desc" style={{ color: '#16a34a', fontWeight: '600' }}>CO₂ Reduced</span>
                </div>
              </div>
              {/* Card 3 */}
              <div className="sub-kpi-card">
                <div className="sub-kpi-icon-box blue">
                  <svg viewBox="0 0 24 24" stroke="currentColor"><use href="#icon-roof"></use></svg>
                </div>
                <div className="sub-kpi-text-box">
                  <span className="sub-kpi-label">System Size</span>
                  <span className="sub-kpi-val" aria-live="polite" id="systemSizeVal">5.2 kW</span>
                  <span className="sub-kpi-desc" style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>Optimal Size</span>
                </div>
              </div>
              {/* Card 4 */}
              <div className="sub-kpi-card">
                <div className="sub-kpi-icon-box orange">
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><use href="#icon-star"></use></svg>
                </div>
                <div className="sub-kpi-text-box">
                  <span className="sub-kpi-label">Energy Independence</span>
                  <span className="sub-kpi-val" aria-live="polite" id="energyIndependenceVal">78%</span>
                  <span className="sub-kpi-desc" style={{ color: '#ea580c', fontWeight: '600' }}>Projected</span>
                </div>
              </div>
            </section>
  );
}
