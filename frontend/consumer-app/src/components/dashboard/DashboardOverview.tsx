import React from 'react';
import DashboardHeroCard from './DashboardHeroCard';
import LiveSummaryPanel from './LiveSummaryPanel';
import KPIGrid from './KPIGrid';
import SubKPIGrid from './SubKPIGrid';
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
        {/* Placeholder for AnalyticsCharts */}
        {/* Placeholder for QuickActionsGrid */}
        {/* Placeholder for Footer */}
      </div>
    </>
  );
}
