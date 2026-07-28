import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Config
import { ROUTES } from './config/routes';
import { FEATURE_METADATA } from './config/featureMetadata';

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { JourneyProvider } from './contexts/JourneyContext';
import { UIProvider } from './contexts/UIContext';
import { PlanningProvider } from './contexts/PlanningContext';
import { SiteSurveyProvider } from './contexts/SiteSurveyContext';

// Layouts & Primitives
import AppShell from './components/layout/AppShell';
import LayoutSkeleton from './components/layout/LayoutSkeleton';
import LockedWorkspace from './components/feedback/LockedWorkspace';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Portal pages
import Home from './pages/Home';
import Journey from './pages/Journey';
import SiteSurveyPage from './pages/SiteSurveyPage';

// Planning pages
import BillAnalyzer from './pages/BillAnalyzer';
import RoofAnalyzer from './pages/RoofAnalyzer';
import Proposal from './pages/Proposal';
import ROICalculatorPage from './pages/ROICalculatorPage';

// AI pages
import AIAdvisor from './pages/AIAdvisor';
import EnterpriseAI from './pages/EnterpriseAI';

// Rewards page
import RewardsReferrals from './pages/RewardsReferrals';

// Activity Center
import ActivityCenter from './activities/pages/ActivityCenter';

// Reports Center
import ReportsCenter from './reports/pages/ReportsCenter';

// System Performance
import SystemPerformance from './performance/pages/SystemPerformance';

// AMC
import AMC from './amc/pages/AMC';

// Settings
import SettingsPage from './settings/pages/SettingsPage';

// Auth & Permissions
import PermissionGuard from './routes/PermissionGuard';

// Vendor pages
import ProjectTracking from './pages/ProjectTracking';
import VendorDashboard from './vendor/pages/VendorDashboard';
import MyWork from './vendor/pages/MyWork';
import VendorProjects from './vendor/pages/VendorProjects';
import VendorCustomers from './vendor/pages/VendorCustomers';
import VendorAMC from './vendor/pages/VendorAMC';
import VendorReports from './vendor/pages/VendorReports';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LayoutSkeleton />;
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

// Shell-Wrapped Route Layout
function AppRoute({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer Portal - Authenticated */}
        <Route path={ROUTES.HOME} element={<AppRoute><PermissionGuard feature="dashboard"><Home /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.JOURNEY} element={<AppRoute><PermissionGuard feature="dashboard"><Journey /></PermissionGuard></AppRoute>} />

        {/* Canonical Workspace Routes */}
        <Route path={ROUTES.BILL_ANALYZER} element={<AppRoute><PermissionGuard feature="bill-analyzer"><BillAnalyzer /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.ROOF_ANALYSIS} element={<AppRoute><PermissionGuard feature="roof-analysis"><RoofAnalyzer /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.PLANNING_PROPOSAL} element={<AppRoute><PermissionGuard feature="proposal-generator"><Proposal /></PermissionGuard></AppRoute>} />
        <Route path="/app/proposal" element={<Navigate to={ROUTES.PLANNING_PROPOSAL} replace />} />
        <Route path={ROUTES.ROI_CALCULATOR} element={<AppRoute><PermissionGuard feature="roi-calculator"><ROICalculatorPage /></PermissionGuard></AppRoute>} />

        {/* AI Workspaces */}
        <Route path={ROUTES.AI_ADVISOR} element={<AppRoute><PermissionGuard feature="ai-assistant"><AIAdvisor /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.ENTERPRISE_AI} element={<AppRoute><PermissionGuard feature="enterprise-ai"><EnterpriseAI /></PermissionGuard></AppRoute>} />

        {/* Legacy route aliases — redirect to canonical */}
        <Route path="/app/dashboard" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/app/planning/bills" element={<Navigate to={ROUTES.BILL_ANALYZER} replace />} />
        <Route path="/app/roof" element={<Navigate to={ROUTES.ROOF_ANALYSIS} replace />} />
        <Route path="/app/planning/roof" element={<Navigate to={ROUTES.ROOF_ANALYSIS} replace />} />
        <Route path={ROUTES.SUPPORT_NOTIFICATIONS} element={<Navigate to={ROUTES.ACTIVITY_CENTER} replace />} />

        {/* Activity Center */}
        <Route path={ROUTES.ACTIVITY_CENTER} element={<AppRoute><PermissionGuard feature="activity-center"><ActivityCenter /></PermissionGuard></AppRoute>} />

        {/* Reports Center */}
        <Route path={ROUTES.OWNERSHIP_REPORTS} element={<AppRoute><PermissionGuard feature="reports-center"><ReportsCenter /></PermissionGuard></AppRoute>} />

        {/* System Performance */}
        <Route path={ROUTES.SYSTEM_PERFORMANCE} element={<AppRoute><PermissionGuard feature="system-performance"><SystemPerformance /></PermissionGuard></AppRoute>} />

        {/* AMC */}
        <Route path={ROUTES.AMC} element={<AppRoute><PermissionGuard feature="amc"><AMC /></PermissionGuard></AppRoute>} />

        {/* Settings */}
        <Route path={ROUTES.ACCOUNT_SETTINGS} element={<AppRoute><PermissionGuard feature="settings"><SettingsPage /></PermissionGuard></AppRoute>} />

        {/* Site Survey Operations */}
        <Route path={ROUTES.SITE_SURVEY} element={<AppRoute><PermissionGuard feature="site-survey"><SiteSurveyPage /></PermissionGuard></AppRoute>} />

        {/* Locked Workspaces — driven by config/featureMetadata.ts */}
        {Object.entries(FEATURE_METADATA).map(([path, meta]) => {
          if (path === ROUTES.SITE_SURVEY) return null;
          return (
            <Route key={path} path={path} element={<AppRoute><LockedWorkspace targetStageId={meta.stageId} featureTitle={meta.title} /></AppRoute>} />
          );
        })}

        {/* Support */}
        <Route path={ROUTES.REWARDS} element={<AppRoute><PermissionGuard feature="rewards"><RewardsReferrals /></PermissionGuard></AppRoute>} />

        {/* Vendor Portal */}
        <Route path={ROUTES.VENDOR_DASHBOARD} element={<AppRoute><PermissionGuard feature="vendor-dashboard"><VendorDashboard /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_MY_WORK} element={<AppRoute><PermissionGuard feature="vendor-portal"><MyWork /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_TASKS} element={<AppRoute><PermissionGuard feature="vendor-portal"><MyWork /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_VISITS} element={<AppRoute><PermissionGuard feature="vendor-portal"><MyWork /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_INSTALLATIONS} element={<AppRoute><PermissionGuard feature="vendor-portal"><MyWork /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_WORK_ORDERS} element={<AppRoute><PermissionGuard feature="vendor-portal"><MyWork /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_PROJECTS_ACTIVE} element={<AppRoute><PermissionGuard feature="vendor-projects"><VendorProjects /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_PROJECTS_COMPLETED} element={<AppRoute><PermissionGuard feature="vendor-projects"><VendorProjects /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_CUSTOMERS} element={<AppRoute><PermissionGuard feature="vendor-customers"><VendorCustomers /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_AMC} element={<AppRoute><PermissionGuard feature="amc"><VendorAMC /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_REPORTS} element={<AppRoute><PermissionGuard feature="vendor-reports"><VendorReports /></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.VENDOR_PROJECT_TRACKING} element={<AppRoute><PermissionGuard feature="vendor-portal"><ProjectTracking /></PermissionGuard></AppRoute>} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <JourneyProvider>
        <PlanningProvider>
          <SiteSurveyProvider>
            <UIProvider>
              <AppRoutes />
            </UIProvider>
          </SiteSurveyProvider>
        </PlanningProvider>
      </JourneyProvider>
    </AuthProvider>
  );
}