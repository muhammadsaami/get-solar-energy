import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardHeroCardProps {
  children?: React.ReactNode;
}

export default function DashboardHeroCard({ children }: DashboardHeroCardProps) {
  const { user } = useAuth() as unknown as { user: { name: string; role: string } | null };
  const greeting = user?.name ? `Good Morning, ${user.name.split(' ')[0]}` : 'Good Morning, User';
  const roleText = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Standard User';

  return (
    <section className="hero-card" id="heroCard">
      <div className="hero-bg-overlay"></div>
      
      {/* Left Side (60%) */}
      <div className="hero-left">
        <div className="hero-meta-badges">
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span id="heroLocationText">Location Not Set</span>
          </div>
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span id="heroCustomerTypeText">{roleText}</span>
          </div>
          <div className="hero-meta-badge">
            <span className="grid-status-dot"></span>
            <span>Grid Status: Online</span>
          </div>
        </div>
        
        <h2 className="hero-title" id="heroGreeting">{greeting}</h2>
        <p className="hero-desc">Welcome back to GET Solar Energy. Manage your electricity usage, monitor your solar journey, and discover opportunities to reduce your energy costs.</p>
        
        <div className="hero-actions">
          <button className="hero-btn-primary" id="heroBillBtn">
            <span>Analyze My Electricity Bill</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button className="hero-btn-secondary" id="heroSolutionsBtn">
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
