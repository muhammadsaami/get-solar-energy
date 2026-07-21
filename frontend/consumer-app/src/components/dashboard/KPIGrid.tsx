import React, { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  LineController
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  LineController
);

export default function KPIGrid() {
  useEffect(() => {
    // 1. Readiness gauge animation
    const readinessCircle = document.getElementById('readinessFillCircle');
    if (readinessCircle) {
      const totalCircumference = 220; // 2 * PI * 35 approx
      const readinessScore = 92;
      const offset = totalCircumference - (readinessScore / 100 * totalCircumference);
      readinessCircle.style.strokeDasharray = `${totalCircumference}`;
      readinessCircle.style.strokeDashoffset = `${offset}`;
    }

    // 2. Savings sparkline chart
    const savingsCtx = document.getElementById('savingsSparklineCanvas') as HTMLCanvasElement | null;
    let sparklineChart: ChartJS | null = null;
    if (savingsCtx) {
      sparklineChart = new ChartJS(savingsCtx, {
        type: 'line',
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [{
            data: [1200, 1400, 1800, 2100, 2500, 2300, 2400, 2600, 2200, 2100, 1900, 2486],
            borderColor: '#ff8a1d',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(255, 138, 29, 0.08)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    }

    return () => {
      if (sparklineChart) sparklineChart.destroy();
    };
  }, []);
  return (
    <section className="kpi-container" aria-label="Key Performance Metrics">
                {/* Solar Readiness card */}
                <div className="card-base readiness-card">
                  <div className="readiness-details">
                    <span className="readiness-title">Solar Readiness Score</span>
                    <p className="readiness-desc">Excellent! Your home is ready for solar.</p>
                    <button className="readiness-btn" id="readinessDetailsBtn" onClick={(e) => { e.preventDefault(); }}>View Details</button>
                  </div>
                  <div className="readiness-gauge-wrapper">
                    <svg className="readiness-gauge-svg">
                      <circle className="readiness-gauge-track" cx="38" cy="38" r="35"/>
                      <circle className="readiness-gauge-fill" cx="38" cy="38" r="35" id="readinessFillCircle"/>
                    </svg>
                    <span className="readiness-gauge-val" id="readinessTextVal">92%</span>
                  </div>
                </div>
    
                {/* Savings Cards Stack */}
                <div className="kpi-row-layout">
                  {/* Card 1: Estimated Annual Savings */}
                  <div className="card-base">
                    <span className="kpi-title">Estimated Annual Savings</span>
                    <div className="kpi-value-block">
                      <span className="kpi-value-text" id="annualSavingsTextVal">₹24,860</span>
                    </div>
                    <div className="kpi-subtext-block positive">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      <span>+18.2% vs last month</span>
                    </div>
                    <div className="savings-sparkline-box">
                      <canvas id="savingsSparklineCanvas"></canvas>
                    </div>
                  </div>
    
                  {/* Card 2: Lifetime Savings */}
                  <div className="card-base">
                    <span className="kpi-title">Lifetime Savings <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(25 Years)</span></span>
                    <div className="kpi-value-block">
                      <span className="kpi-value-text" id="lifetimeSavingsTextVal">₹12.4 Lakhs</span>
                    </div>
                    <div className="kpi-subtext-block positive">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      <span>Projected returns</span>
                    </div>
                    {/* Vertical Bar Sparkline elements */}
                    <div className="savings-bar-box" id="savingsBarsContainer">
                      <div className="savings-bar" style={{ height: '20%' }}></div>
                      <div className="savings-bar" style={{ height: '35%' }}></div>
                      <div className="savings-bar" style={{ height: '48%' }}></div>
                      <div className="savings-bar" style={{ height: '60%' }}></div>
                      <div className="savings-bar" style={{ height: '78%' }}></div>
                      <div className="savings-bar active" style={{ height: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </section>
  );
}
