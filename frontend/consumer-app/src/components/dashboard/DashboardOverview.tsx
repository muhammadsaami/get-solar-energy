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
import { useCustomerDashboard } from '../../hooks/useCustomerDashboard';
import { deriveDashboard } from '../../utils/dashboard';

export default function DashboardOverview() {
  const data = useCustomerDashboard();
  const derived = deriveDashboard(data);

  return (
    <>
      <DashboardSprites />
      <div className="tab-content active" role="tabpanel" aria-label="dashboard" id="tab-dashboard">
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

        <SubKPIGrid derived={derived} loading={data.loading} />
        <QuickActionsGrid />
        <AnalyticsCharts data={data} derived={derived} />
        <AIIntelligencePanel derived={derived} loading={data.loading} />
        <FooterGrid data={data} />
      </div>
    </>
  );
}
