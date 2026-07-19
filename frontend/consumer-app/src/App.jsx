import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import Bills from './pages/Bills';
import Roof from './pages/Roof';
import Proposal from './pages/Proposal';

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
        <Route path="/app/home" element={<AppRoute><Home /></AppRoute>} />
        <Route path="/app/journey" element={<AppRoute><Journey /></AppRoute>} />

        {/* Planning Workspaces (Functional in Slice 2) */}
        <Route path="/app/planning/bills" element={<AppRoute><Bills /></AppRoute>} />
        <Route path="/app/planning/roof" element={<AppRoute><Roof /></AppRoute>} />
        <Route path="/app/planning/proposal" element={<AppRoute><Proposal /></AppRoute>} />

        {/* Installation Workspaces (Locked placeholders) */}
        <Route path="/app/installation/progress" element={<AppRoute><LockedWorkspace targetStageId="ST-08" /></AppRoute>} />
        <Route path="/app/installation/qa" element={<AppRoute><LockedWorkspace targetStageId="ST-10" /></AppRoute>} />
        <Route path="/app/installation/grid" element={<AppRoute><LockedWorkspace targetStageId="ST-11" /></AppRoute>} />

        {/* Ownership Workspaces (Locked placeholders) */}
        <Route path="/app/ownership/system" element={<AppRoute><LockedWorkspace targetStageId="ST-12" /></AppRoute>} />
        <Route path="/app/ownership/savings" element={<AppRoute><LockedWorkspace targetStageId="ST-12" /></AppRoute>} />
        <Route path="/app/ownership/reports" element={<AppRoute><LockedWorkspace targetStageId="ST-12" /></AppRoute>} />
        <Route path="/app/ownership/docs" element={<AppRoute><LockedWorkspace targetStageId="ST-12" /></AppRoute>} />

        {/* Support Workspaces (Locked placeholders) */}
        <Route path="/app/support/notifications" element={<AppRoute><LockedWorkspace targetStageId="ST-02" /></AppRoute>} />
        <Route path="/app/support/help" element={<AppRoute><LockedWorkspace targetStageId="ST-02" /></AppRoute>} />
        <Route path="/app/support/referrals" element={<AppRoute><LockedWorkspace targetStageId="ST-02" /></AppRoute>} />

        {/* Account Workspaces (Locked placeholders) */}
        <Route path="/app/account/profile" element={<AppRoute><LockedWorkspace targetStageId="ST-02" /></AppRoute>} />
        <Route path="/app/account/settings" element={<AppRoute><LockedWorkspace targetStageId="ST-02" /></AppRoute>} />

        {/* Vendor Portal */}
        <Route path="/app/vendor/project-tracking" element={<AppRoute><ProjectTracking /></AppRoute>} />

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