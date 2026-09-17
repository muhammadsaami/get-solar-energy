import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

interface DashboardHeroCardProps {
  children?: React.ReactNode;
}

export default function DashboardHeroCard({ children }: DashboardHeroCardProps) {
  const navigate = useNavigate();

  return (
    <section className="hero-card" id="heroCard">
      <div className="hero-bg-overlay"></div>
      
      {/* Left Side (60%) */}
      <div className="hero-left">
        <div className="hero-meta-badges">
          <div className="hero-meta-badge">
            <span className="grid-status-dot"></span>
            <span>Grid Status: Online</span>
          </div>
        </div>

        <h2 className="hero-title" id="heroGreeting">Your Solar Dashboard</h2>
        <p className="hero-desc">Manage your electricity usage, monitor your solar journey, and discover opportunities to reduce your energy costs.</p>

        <div className="hero-insight-strip">
          <svg className="hero-insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon><line x1="12" y1="6" x2="12" y2="11"></line><line x1="12" y1="14" x2="12.01" y2="14"></line></svg>
          <span className="hero-insight-text" id="heroAiInsight">AI Insight: Analyze your bill to reveal up to 60% potential savings on your energy costs.</span>
        </div>

        <div className="hero-health-strip">
          <span className="hero-health-item">
            <span className="hero-health-dot ok"></span> System Online
          </span>
          <span className="hero-health-item">
            <span className="hero-health-dot ok"></span> Live Data Sync
          </span>
          <span className="hero-health-sep"></span>
          <span className="hero-health-item muted">Last synced just now</span>
        </div>

        <div className="hero-actions">
          <button className="hero-btn-primary" id="heroBillBtn" onClick={() => navigate(ROUTES.BILL_ANALYZER)}>
            <span>Analyze My Electricity Bill</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button className="hero-btn-secondary" id="heroSolutionsBtn" onClick={() => navigate(ROUTES.ROOF_ANALYSIS)}>
            <span>Check Roof Suitability</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        
        <div className="hero-trust-indicators-row">
          <div className="trust-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M12 2L2 7l10 5 10-5-10-5zM12 17V12"></path></svg>
            <span>Government Subsidy Assistance</span>
          </div>
          <div className="trust-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Certified Installation Partners</span>
          </div>
          <div className="trust-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            <span>End-to-End Solar Lifecycle</span>
          </div>
          <div className="trust-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>25-Year Performance Support</span>
          </div>
        </div>
      </div>

      {/* Right Side (40%) */}
      <div className="hero-right">
        {children}
      </div>
    </section>
  );
}
