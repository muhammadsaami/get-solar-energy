import React from 'react';
import type { DashboardDerived } from '../../utils/dashboard';

interface Props {
  loading?: boolean;
  derived: DashboardDerived;
}

export default function AIIntelligencePanel({ loading, derived }: Props) {
  const rr = derived.readinessPercent;
  const ringDash = 100 - (rr / 100) * 100;
  const summary =
    loading
      ? 'Analyzing your solar profile…'
      : rr >= 60
        ? 'Your home shows strong solar potential. Proceed to install to start saving on your electricity bills.'
        : rr > 0
          ? 'You have started your solar assessment. Complete bill, roof, and ROI analysis to unlock full recommendations.'
          : 'Run an AI analysis to get personalized solar intelligence insights.';

  const nextAction =
    !derived.monthlyUnits
      ? 'Upload bill data to begin'
      : !derived.roofSystemKw
        ? 'Analyze your roof to size the system'
        : !derived.paybackYears
          ? 'Calculate ROI to see savings'
          : 'Complete your proposal to move forward';

  return (
    <section className="ai-intelligence-section" id="aiIntelligenceSection">
      <div className="ai-section-header">
        <div className="ai-section-title-row">
          <svg className="ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/><circle cx="9" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1" fill="currentColor" stroke="none"/></svg>
          <h3 className="ai-section-title">AI Intelligence Engine</h3>
        </div>
        <button className="ai-analyze-btn" id="aiAnalyzeBtn" onClick={(e) => { e.preventDefault(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M2.5 11.5a10 10 0 0 1 18.8-4.3M21.5 12.5a10 10 0 0 1-18.8 4.2"/></svg>
          <span>Run AI Analysis</span>
        </button>
      </div>

      <div className="ai-insights-grid" id="aiInsightsGrid">
        <div className="ai-insight-card ai-insights-main" id="aiInsightsCard">
          <div className="ai-card-header">
            <span className="ai-card-badge">AI Summary</span>
            <span className="ai-confidence-ring" id="aiConfidenceRing">
              <svg viewBox="0 0 36 36" className="ai-ring-svg">
                <path className="ai-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="2.5"/>
                <path className="ai-ring-fill" id="aiRingFill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" strokeDasharray={`${ringDash}, 100`}/>
              </svg>
              <span className="ai-ring-text" id="aiConfidenceText">{loading ? '…' : `${rr}%`}</span>
            </span>
          </div>
          <div className="ai-card-body">
            <div className="ai-readiness-display" id="aiReadinessDisplay">
              <span className="ai-readiness-label">Solar Readiness</span>
              <span className="ai-readiness-value" id="aiReadinessValue">{loading ? '…' : `${rr}%`}</span>
            </div>
            <p className="ai-summary-text" id="aiSummaryText">{summary}</p>
            <div className="ai-next-action" id="aiNextAction">
              <span className="ai-action-label">Next Best Action</span>
              <span className="ai-action-text" id="aiNextActionText">{loading ? '…' : nextAction}</span>
            </div>
          </div>
        </div>

        <div className="ai-insight-card" id="aiCustomerScoreCard">
          <div className="ai-card-header">
            <span className="ai-card-badge orange">Customer Score</span>
          </div>
          <div className="ai-card-body">
            <div className="ai-score-display">
              <span className="ai-score-value" id="aiCustomerScoreVal">--</span>
              <span className="ai-score-label">Overall Score</span>
            </div>
            <div className="ai-score-breakdown">
              <div className="ai-score-item">
                <span className="ai-score-item-label">Purchase Intent</span>
                <div className="ai-score-bar"><div className="ai-score-bar-fill" id="aiPurchaseIntentBar" style={{ width: '0%' }}></div></div>
                <span className="ai-score-item-val" id="aiPurchaseIntentVal">--</span>
              </div>
              <div className="ai-score-item">
                <span className="ai-score-item-label">Financial Readiness</span>
                <div className="ai-score-bar"><div className="ai-score-bar-fill" id="aiFinancialBar" style={{ width: '0%' }}></div></div>
                <span className="ai-score-item-val" id="aiFinancialVal">--</span>
              </div>
              <div className="ai-score-item">
                <span className="ai-score-item-label">Installation Ready</span>
                <div className="ai-score-bar"><div className="ai-score-bar-fill" id="aiInstallBar" style={{ width: '0%' }}></div></div>
                <span className="ai-score-item-val" id="aiInstallVal">--</span>
              </div>
            </div>
            <p className="ai-empty-state" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>Score unlocks after full AI analysis.</p>
          </div>
        </div>

        <div className="ai-insight-card" id="aiSolarReadinessCard">
          <div className="ai-card-header">
            <span className="ai-card-badge green">Solar Readiness</span>
          </div>
          <div className="ai-card-body">
            <div className="ai-score-display">
              <span className="ai-score-value green" id="aiSolarReadinessVal">{loading ? '…' : `${rr}%`}</span>
              <span className="ai-score-label">Readiness Score</span>
            </div>
            <div className="ai-readiness-metrics">
              <div className="ai-metric-item">
                <span className="ai-metric-label">Roof Suitability</span>
                <span className="ai-metric-val" id="aiRoofSuitVal">{derived.roofSystemKw ? 'Completed' : '--'}</span>
              </div>
              <div className="ai-metric-item">
                <span className="ai-metric-label">Consumption Fit</span>
                <span className="ai-metric-val" id="aiConsumptionVal">{derived.monthlyUnits ? `${derived.monthlyUnits} kWh` : '--'}</span>
              </div>
              <div className="ai-metric-item">
                <span className="ai-metric-label">ROI Payback</span>
                <span className="ai-metric-val" id="aiPaybackVal">{derived.paybackYears ? `${derived.paybackYears.toFixed(1)} yrs` : '--'}</span>
              </div>
              <div className="ai-metric-item">
                <span className="ai-metric-label">CO₂ Reduced</span>
                <span className="ai-metric-val" id="aiCO2Val">{derived.roofSystemKw ? `${((derived.roofSystemKw * 4.5 * 30 * 12 * 0.82) / 1000).toFixed(1)} Tons` : '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ai-recommendations-container" id="aiRecommendationsContainer">
        <h4 className="ai-rec-title">AI Recommendations</h4>
        <div className="ai-rec-grid" id="aiRecGrid">
          <p className="ai-empty-state">No recommendations yet. Run analysis to generate insights.</p>
        </div>
      </div>

      <div className="ai-timeline-container" id="aiTimelineContainer">
        <h4 className="ai-rec-title">Prediction Timeline</h4>
        <div className="ai-timeline" id="aiTimeline">
          <div className="ai-timeline-empty">Timeline will appear after analysis.</div>
        </div>
      </div>
    </section>
  );
}