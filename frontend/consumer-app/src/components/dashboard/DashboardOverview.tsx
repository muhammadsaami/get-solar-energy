import React from 'react';
import DashboardHeroCard from './DashboardHeroCard';
import LiveSummaryPanel from './LiveSummaryPanel';
import KPIGrid from './KPIGrid';
import SubKPIGrid from './SubKPIGrid';
import QuickActionsGrid from './QuickActionsGrid';
import AnalyticsCharts from './AnalyticsCharts';
import AIIntelligencePanel from './AIIntelligencePanel';
import FooterGrid from './FooterGrid';
import DashboardSprites from './DashboardSprites';

export default function DashboardOverview() {
  return (
    <>
      <DashboardSprites />
      <div className="tab-content active" role="tabpanel" aria-label="dashboard" id="tab-dashboard">
        <div className="dashboard-grid">
          <DashboardHeroCard>
            <LiveSummaryPanel />
          </DashboardHeroCard>
          
          <KPIGrid />
        </div>
        
        <SubKPIGrid />
        <QuickActionsGrid />
        <AnalyticsCharts />
        <AIIntelligencePanel />
        <FooterGrid />
      </div>
    </>
  );
}
