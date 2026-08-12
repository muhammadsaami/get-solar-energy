import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Config
import { ROUTES } from './config/routes';
import { FEATURE_METADATA } from './config/featureMetadata';

// Providers
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { JourneyProvider } from './contexts/JourneyContext';
import { UIProvider } from './contexts/UIContext';
import { PlanningProvider } from './contexts/PlanningContext';
import { SiteSurveyProvider } from './contexts/SiteSurveyContext';

// Layouts & Primitives (keep eager — always needed)
import AppShell from './components/layout/AppShell';
import LayoutSkeleton from './components/layout/LayoutSkeleton';
import LockedWorkspace from './components/feedback/LockedWorkspace';

// Auth & Permissions (keep eager — always needed)
import PermissionGuard from './routes/PermissionGuard';
import AdminGuard from './routes/AdminGuard';
import technicianRouteElements from './routes/technician.routes';
import vendorRouteElements from './routes/vendor.routes';

// Lazy-loaded pages — improves initial bundle size
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Home = lazy(() => import('./pages/Home'));
const Journey = lazy(() => import('./pages/Journey'));
const SiteSurveyPage = lazy(() => import('./pages/SiteSurveyPage'));
const BillAnalyzer = lazy(() => import('./pages/BillAnalyzer'));
const RoofAnalyzer = lazy(() => import('./pages/RoofAnalyzer'));
const Proposal = lazy(() => import('./pages/Proposal'));
const ROICalculatorPage = lazy(() => import('./pages/ROICalculatorPage'));
const AIAdvisor = lazy(() => import('./pages/AIAdvisor'));
const EnterpriseAI = lazy(() => import('./pages/EnterpriseAI'));
const KnowledgeBase = lazy(() => import('./features/knowledgeBase/KnowledgeBase'));
const RewardsReferrals = lazy(() => import('./pages/RewardsReferrals'));
const ActivityCenter = lazy(() => import('./activities/pages/ActivityCenter'));
const ReportsCenter = lazy(() => import('./reports/pages/ReportsCenter'));
const SystemPerformance = lazy(() => import('./performance/pages/SystemPerformance'));
const AMC = lazy(() => import('./amc/pages/AMC'));
const SettingsPage = lazy(() => import('./settings/pages/SettingsPage'));
const SupportHelp = lazy(() => import('./pages/SupportHelp'));
const CustomerProfilePage = lazy(() => import('./features/customerProfile/pages/CustomerProfilePage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboard'));
const CrmDashboardPage = lazy(() => import('./pages/crm/CrmDashboard'));
const BusinessIntelligencePage = lazy(() => import('./pages/business-intelligence/BusinessIntelligencePage'));
const AuditMonitoringPage = lazy(() => import('./pages/audit/AuditMonitoringPage'));
const MlOpsPage = lazy(() => import('./pages/mlops/MlOpsPage'));

function PageSuspense({ children }) {
  return <Suspense fallback={<LayoutSkeleton />}>{children}</Suspense>;
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LayoutSkeleton />;
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
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
        <Route path="/" element={<PageSuspense><Landing /></PageSuspense>} />
        <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />
        <Route path="/signup" element={<PageSuspense><Signup /></PageSuspense>} />
        <Route path="/reset-password" element={<PageSuspense><ResetPassword /></PageSuspense>} />

        {/* Customer Portal - Authenticated */}
        <Route path={ROUTES.HOME} element={<AppRoute><PermissionGuard feature="dashboard"><PageSuspense><Home /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.JOURNEY} element={<AppRoute><PermissionGuard feature="dashboard"><PageSuspense><Journey /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Canonical Workspace Routes */}
        <Route path={ROUTES.BILL_ANALYZER} element={<AppRoute><PermissionGuard feature="bill-analyzer"><PageSuspense><BillAnalyzer /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.ROOF_ANALYSIS} element={<AppRoute><PermissionGuard feature="roof-analysis"><PageSuspense><RoofAnalyzer /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.PLANNING_PROPOSAL} element={<AppRoute><PermissionGuard feature="proposal-generator"><PageSuspense><Proposal /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path="/app/proposal" element={<Navigate to={ROUTES.PLANNING_PROPOSAL} replace />} />
        <Route path={ROUTES.ROI_CALCULATOR} element={<AppRoute><PermissionGuard feature="roi-calculator"><PageSuspense><ROICalculatorPage /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* AI Workspaces */}
        <Route path={ROUTES.AI_ADVISOR} element={<AppRoute><PermissionGuard feature="ai-assistant"><PageSuspense><AIAdvisor /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.ENTERPRISE_AI} element={<AppRoute><PermissionGuard feature="enterprise-ai"><PageSuspense><EnterpriseAI /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Knowledge Base */}
        <Route path={ROUTES.KNOWLEDGE_BASE} element={<AppRoute><PermissionGuard feature="knowledge-base"><PageSuspense><KnowledgeBase /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Legacy route aliases — redirect to canonical */}
        <Route path="/app/dashboard" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/app/planning/bills" element={<Navigate to={ROUTES.BILL_ANALYZER} replace />} />
        <Route path="/app/roof" element={<Navigate to={ROUTES.ROOF_ANALYSIS} replace />} />
        <Route path="/app/planning/roof" element={<Navigate to={ROUTES.ROOF_ANALYSIS} replace />} />
        <Route path={ROUTES.SUPPORT_NOTIFICATIONS} element={<Navigate to={ROUTES.ACTIVITY_CENTER} replace />} />

        {/* Activity Center */}
        <Route path={ROUTES.ACTIVITY_CENTER} element={<AppRoute><PermissionGuard feature="activity-center"><PageSuspense><ActivityCenter /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Reports Center & Ownership Docs */}
        <Route path={ROUTES.OWNERSHIP_REPORTS} element={<AppRoute><PermissionGuard feature="reports-center"><PageSuspense><ReportsCenter /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.OWNERSHIP_DOCS} element={<AppRoute><PermissionGuard feature="reports-center"><PageSuspense><ReportsCenter /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Support Help & Referrals */}
        <Route path={ROUTES.SUPPORT_HELP} element={<AppRoute><PermissionGuard feature="activity-center"><PageSuspense><SupportHelp /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Account Profile & Settings */}
        <Route path={ROUTES.ACCOUNT_PROFILE} element={<AppRoute><PermissionGuard feature="account-profile"><PageSuspense><CustomerProfilePage /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.ACCOUNT_SETTINGS} element={<AppRoute><PermissionGuard feature="settings"><PageSuspense><SettingsPage /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Site Survey Operations */}
        <Route path={ROUTES.SITE_SURVEY} element={<AppRoute><PermissionGuard feature="site-survey"><PageSuspense><SiteSurveyPage /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* System Performance & AMC — restored routes for existing modules */}
        <Route path={ROUTES.SYSTEM_PERFORMANCE} element={<AppRoute><PermissionGuard feature="system-performance"><PageSuspense><SystemPerformance /></PageSuspense></PermissionGuard></AppRoute>} />
        <Route path={ROUTES.AMC} element={<AppRoute><PermissionGuard feature="amc"><PageSuspense><AMC /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Admin Dashboard */}
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AppRoute><AdminGuard><PageSuspense><AdminDashboardPage /></PageSuspense></AdminGuard></AppRoute>} />

        {/* CRM & Leads */}
        <Route path={ROUTES.CRM_LEADS} element={<AppRoute><AdminGuard><PageSuspense><CrmDashboardPage /></PageSuspense></AdminGuard></AppRoute>} />

        {/* Business Intelligence */}
        <Route path={ROUTES.BUSINESS_INTELLIGENCE} element={<AppRoute><AdminGuard><PageSuspense><BusinessIntelligencePage /></PageSuspense></AdminGuard></AppRoute>} />

        {/* Audit & Monitoring */}
        <Route path={ROUTES.AUDIT_MONITORING} element={<AppRoute><AdminGuard><PageSuspense><AuditMonitoringPage /></PageSuspense></AdminGuard></AppRoute>} />

        {/* Enterprise MLOps */}
        <Route path={ROUTES.MLOPS} element={<AppRoute><PermissionGuard feature="mlops-dashboard"><PageSuspense><MlOpsPage /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Admin quick-action aliases → real existing modules (restored navigation) */}
        <Route path="/app/admin/customers" element={<Navigate to={ROUTES.CRM_LEADS} replace />} />
        <Route path="/app/admin/reports" element={<Navigate to={ROUTES.BUSINESS_INTELLIGENCE} replace />} />
        <Route path="/app/admin/analytics" element={<Navigate to={ROUTES.BUSINESS_INTELLIGENCE} replace />} />
        <Route path="/app/admin/platform" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
        <Route path="/app/admin/settings" element={<Navigate to={ROUTES.ACCOUNT_SETTINGS} replace />} />

        {/* Locked Workspaces — driven by config/featureMetadata.ts */}
        {Object.entries(FEATURE_METADATA).map(([path, meta]) => {
          if (path === ROUTES.SITE_SURVEY) return null;
          if (path === ROUTES.ADMIN_DASHBOARD) return null;
          if (path === ROUTES.CRM_LEADS) return null;
          if (path === ROUTES.BUSINESS_INTELLIGENCE) return null;
          if (path === ROUTES.AUDIT_MONITORING) return null;
          if (path === ROUTES.MLOPS) return null;
          if (path.startsWith('/app/technician/')) return null;
          if (path.startsWith('/app/vendor/')) return null;
          return (
            <Route key={path} path={path} element={<AppRoute><LockedWorkspace targetStageId={meta.stageId} featureTitle={meta.title} /></AppRoute>} />
          );
        })}

        {/* Support */}
        <Route path={ROUTES.REWARDS} element={<AppRoute><PermissionGuard feature="rewards"><PageSuspense><RewardsReferrals /></PageSuspense></PermissionGuard></AppRoute>} />

        {/* Independent Vendor Portal Routes */}
        {vendorRouteElements}

        {/* Technician Network Routes */}
        {technicianRouteElements}

        {/* Fallback 404 */}
        <Route path="*" element={<PageSuspense><NotFound /></PageSuspense>} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}