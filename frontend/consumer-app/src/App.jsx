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

// Vendor pages
import ProjectTracking from './pages/ProjectTracking';

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
        <Route path={ROUTES.HOME} element={<AppRoute><Home /></AppRoute>} />
        <Route path={ROUTES.JOURNEY} element={<AppRoute><Journey /></AppRoute>} />

        {/* Canonical Workspace Routes */}
        <Route path={ROUTES.BILL_ANALYZER} element={<AppRoute><BillAnalyzer /></AppRoute>} />
        <Route path={ROUTES.ROOF_ANALYSIS} element={<AppRoute><RoofAnalyzer /></AppRoute>} />
        <Route path={ROUTES.PLANNING_PROPOSAL} element={<AppRoute><Proposal /></AppRoute>} />
        <Route path={ROUTES.ROI_CALCULATOR} element={<AppRoute><ROICalculatorPage /></AppRoute>} />

        {/* AI Workspaces */}
        <Route path={ROUTES.AI_ADVISOR} element={<AppRoute><AIAdvisor /></AppRoute>} />
        <Route path={ROUTES.ENTERPRISE_AI} element={<AppRoute><EnterpriseAI /></AppRoute>} />

        {/* Legacy route aliases — redirect to canonical */}
        <Route path="/app/dashboard" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/app/planning/bills" element={<Navigate to={ROUTES.BILL_ANALYZER} replace />} />
        <Route path="/app/roof" element={<Navigate to={ROUTES.ROOF_ANALYSIS} replace />} />
        <Route path="/app/planning/roof" element={<Navigate to={ROUTES.ROOF_ANALYSIS} replace />} />
        <Route path={ROUTES.SUPPORT_NOTIFICATIONS} element={<Navigate to={ROUTES.ACTIVITY_CENTER} replace />} />

        {/* Activity Center — unlocked workspace */}
        <Route path={ROUTES.ACTIVITY_CENTER} element={<AppRoute><ActivityCenter /></AppRoute>} />

        {/* Reports Center — unlocked workspace */}
        <Route path={ROUTES.OWNERSHIP_REPORTS} element={<AppRoute><ReportsCenter /></AppRoute>} />

        {/* System Performance — unlocked workspace */}
        <Route path={ROUTES.SYSTEM_PERFORMANCE} element={<AppRoute><SystemPerformance /></AppRoute>} />

        {/* AMC — unlocked workspace */}
        <Route path={ROUTES.AMC} element={<AppRoute><AMC /></AppRoute>} />

        {/* Locked Workspaces — driven by config/featureMetadata.ts */}
        {Object.entries(FEATURE_METADATA).map(([path, meta]) => (
          <Route key={path} path={path} element={<AppRoute><LockedWorkspace targetStageId={meta.stageId} featureTitle={meta.title} /></AppRoute>} />
        ))}

        {/* Support */}
        <Route path={ROUTES.REWARDS} element={<AppRoute><RewardsReferrals /></AppRoute>} />

        {/* Vendor Portal */}
        <Route path={ROUTES.VENDOR_PROJECT_TRACKING} element={<AppRoute><ProjectTracking /></AppRoute>} />

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
          <UIProvider>
            <AppRoutes />
          </UIProvider>
        </PlanningProvider>
      </JourneyProvider>
    </AuthProvider>
  );
}