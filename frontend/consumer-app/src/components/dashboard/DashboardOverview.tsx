import React from 'react';
import DashboardHeroCard from './DashboardHeroCard';
import LiveSummaryPanel from './LiveSummaryPanel';
import KPIGrid from './KPIGrid';
import QuickActionsGrid from './QuickActionsGrid';
import AnalyticsCharts from './AnalyticsCharts';
import AIIntelligencePanel from './AIIntelligencePanel';
import FooterGrid from './FooterGrid';
import DashboardSprites from './DashboardSprites';
import { useCustomerDashboard } from '../../hooks/useCustomerDashboard';
import { deriveDashboard } from '../../utils/dashboard';

export default function DashboardOverview() {
  const data = useCustomerDashboard();
  const derived = deriveDashboard(data);

  return (
    <>
      <DashboardSprites />
      <div className="tab-content active" role="tabpanel" aria-label="dashboard" id="tab-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Top Hero & Solar Assessment Journey Overview */}
        <div className="dashboard-grid">
          <DashboardHeroCard>
            <LiveSummaryPanel
              loading={data.loading}
              derived={derived}
              journey={data.journey}
            />
          </DashboardHeroCard>

          <KPIGrid derived={derived} loading={data.loading} />
        </div>

        {/* Quick Actions / Tool Shortcuts */}
        <QuickActionsGrid />

        {/* Layer 1: Core Operational Cards & Layer 2: Post-Installation Performance Analytics */}
        <AnalyticsCharts data={data} derived={derived} loading={data.loading} />

        {/* Layer 3: AI Intelligence Engine (Pre-installation & Planning Intelligence) */}
        <AIIntelligencePanel derived={derived} loading={data.loading} />

        {/* Layer 4: Marketing / Community Engagement */}
        <FooterGrid data={data} />
      </div>
    </>
  );
}
