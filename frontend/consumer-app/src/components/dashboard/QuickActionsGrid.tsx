import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

export default function QuickActionsGrid() {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="quickActionsTitle">
              <div className="quick-actions-title-row">
                <h3 className="quick-actions-title" id="quickActionsTitle">Quick Actions</h3>
              </div>
              
              <div className="quick-actions-grid">
                {/* Card 1 */}
                <div className="action-card" tabIndex={0} role="button" data-tab="bill-analyzer" id="actBill" onClick={() => navigate(ROUTES.BILL_ANALYZER)}>
                  <div className="action-header-row">
                    <div className="action-icon-box">
                      <svg><use href="#icon-bill"></use></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="action-title">Bill Analyzer</h4>
                    <p className="action-desc">Upload your electricity bill and discover your savings potential.</p>
                  </div>
                  <button className="action-btn">
                    <span>Analyze Bill</span>
                    <svg><use href="#icon-arrow-right"></use></svg>
                  </button>
                </div>
    
                {/* Card 2 */}
                <div className="action-card" tabIndex={0} role="button" data-tab="roof-analysis" id="actRoof" onClick={() => navigate(ROUTES.ROOF_ANALYSIS)}>
                  <div className="action-header-row">
                    <div className="action-icon-box">
                      <svg><use href="#icon-roof"></use></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="action-title">Roof Analysis</h4>
                    <p className="action-desc">AI + Satellite analysis of your roof for accurate solar estimate.</p>
                  </div>
                  <button className="action-btn">
                    <span>Analyze Roof</span>
                    <svg><use href="#icon-arrow-right"></use></svg>
                  </button>
                </div>
    
                {/* Card 3 */}
                <div className="action-card" tabIndex={0} role="button" data-tab="roi-calc" id="actCalc" onClick={() => navigate(ROUTES.ROI_CALCULATOR)}>
                  <div className="action-header-row">
                    <div className="action-icon-box">
                      <svg><use href="#icon-calculator"></use></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="action-title">ROI Calculator</h4>
                    <p className="action-desc">Calculate returns, savings and payback period instantly.</p>
                  </div>
                  <button className="action-btn">
                    <span>Calculate ROI</span>
                    <svg><use href="#icon-arrow-right"></use></svg>
                  </button>
                </div>
    
                {/* Card 4 */}
                <div className="action-card" tabIndex={0} role="button" data-tab="ai-assistant" id="actAI" onClick={() => navigate(ROUTES.AI_ADVISOR)}>
                  <div className="action-header-row">
                    <div className="action-icon-box">
                      <svg><use href="#icon-chat"></use></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="action-title">AI Solar Assistant</h4>
                    <p className="action-desc">Ask anything about solar energy. Your AI energy expert.</p>
                  </div>
                  <button className="action-btn">
                    <span>Ask AI</span>
                    <svg><use href="#icon-arrow-right"></use></svg>
                  </button>
                </div>
    
                {/* Card 5 */}
                <div className="action-card" tabIndex={0} role="button" data-tab="referrals" id="actReferral" onClick={() => navigate(ROUTES.REWARDS)}>
                  <div className="action-header-row">
                    <div className="action-icon-box">
                      <svg><use href="#icon-gift"></use></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="action-title">Rewards & Referrals</h4>
                    <p className="action-desc">Earn rewards and help your friends switch to solar.</p>
                  </div>
                  <button className="action-btn">
                    <span>Invite & Earn</span>
                    <svg><use href="#icon-arrow-right"></use></svg>
                  </button>
                </div>
              </div>
            </section>
  );
}
