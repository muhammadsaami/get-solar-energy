import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

const ACTION_DEFS = [
  {
    id: 'bill-analyzer',
    title: 'Bill Analyzer',
    desc: 'Upload your electricity bill and discover your savings potential.',
    cta: 'Analyze Bill',
    status: 'Ready',
    meta: 'Upload → Analysis',
    route: ROUTES.BILL_ANALYZER,
    symbol: 'bill',
  },
  {
    id: 'roof-analysis',
    title: 'Roof Analysis',
    desc: 'AI + Satellite analysis of your roof for accurate solar estimate.',
    cta: 'Analyze Roof',
    status: 'AI Ready',
    meta: 'Satellite + AI',
    route: ROUTES.ROOF_ANALYSIS,
    symbol: 'roof',
  },
  {
    id: 'roi-calc',
    title: 'ROI Calculator',
    desc: 'Calculate returns, savings and payback period instantly.',
    cta: 'Calculate ROI',
    status: 'Live',
    meta: 'Estimates in seconds',
    route: ROUTES.ROI_CALCULATOR,
    symbol: 'calculator',
  },
  {
    id: 'ai-assistant',
    title: 'AI Solar Assistant',
    desc: 'Ask anything about solar energy. Your AI energy expert.',
    cta: 'Ask AI',
    status: 'Online',
    meta: '24×7 support',
    route: ROUTES.AI_ADVISOR,
    symbol: 'chat',
  },
  {
    id: 'referrals',
    title: 'Rewards & Referrals',
    desc: 'Earn rewards and help your friends switch to solar.',
    cta: 'Invite & Earn',
    status: 'Active',
    meta: 'Earn up to ₹4,000',
    route: ROUTES.REWARDS,
    symbol: 'gift',
  },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="quickActionsTitle">
      <div className="quick-actions-title-row">
        <h3 className="quick-actions-title" id="quickActionsTitle">Quick Actions</h3>
      </div>

      <div className="quick-actions-grid">
        {ACTION_DEFS.map((def) => (
          <div
            className="action-card"
            key={def.id}
            tabIndex={0}
            role="button"
            data-tab={def.id}
            id={`act${def.title.replace(/[^A-Za-z]/g, '')}`}
            onClick={() => navigate(def.route)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(def.route); }}
          >
            <div className="action-card-head">
              <div className="action-icon-box">
                <svg><use href={`#icon-${def.symbol}`}></use></svg>
              </div>
              <span className="action-status-pill"><span className="action-status-dot"></span>{def.status}</span>
            </div>
            <div className="action-card-body">
              <h4 className="action-title">{def.title}</h4>
              <p className="action-desc">{def.desc}</p>
            </div>
            <div className="action-card-foot">
              <button className="action-btn">
                <span>{def.cta}</span>
                <svg><use href="#icon-arrow-right"></use></svg>
              </button>
              <span className="action-meta-chip">{def.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}