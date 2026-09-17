import React, { Suspense, lazy } from 'react'
import { Route, Navigate } from 'react-router-dom'

import { ROUTES } from '../config/routes'
import PermissionGuard from './PermissionGuard'
import AppShell from '../components/layout/AppShell'
import LayoutSkeleton from '../components/layout/LayoutSkeleton'

const TechnicianDashboard = lazy(() => import('../technician/pages/TechnicianDashboard'))
const TrainingAcademy = lazy(() => import('../features/training/TrainingAcademy'))
const CertificationsPage = lazy(() => import('../features/certifications/pages/CertificationsPage'))
const JobMarketplacePage = lazy(() => import('../features/jobMarketplace/pages/JobMarketplacePage'))
const WorkOrdersPage = lazy(() => import('../features/workOrders/pages/WorkOrdersPage'))
const EarningsPage = lazy(() => import('../features/earnings/pages/EarningsPage'))
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage'))
const TechnicianAiPage = lazy(() => import('../features/technicianAi/pages/TechnicianAiPage'))

function TechnicianShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}

const technicianRouteElements = [
  <Route key="t-root" path="/app/technician" element={<Navigate to={ROUTES.TECHNICIAN_DASHBOARD} replace />} />,
  <Route key="t-jobs-alias" path="/app/technician/jobs" element={<Navigate to={ROUTES.TECHNICIAN_MARKETPLACE} replace />} />,
  <Route key="t-academy-alias" path="/app/technician/academy" element={<Navigate to={ROUTES.TECHNICIAN_TRAINING} replace />} />,
  <Route key="t-orders-alias" path="/app/technician/orders" element={<Navigate to={ROUTES.TECHNICIAN_WORK_ORDERS} replace />} />,
  <Route key="t-ai-alias" path="/app/technician/ai" element={<Navigate to={ROUTES.TECHNICIAN_AI} replace />} />,
  <Route key="t-dashboard" path={ROUTES.TECHNICIAN_DASHBOARD} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-dashboard">
        <Suspense fallback={<LayoutSkeleton />}>
          <TechnicianDashboard />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-training" path={ROUTES.TECHNICIAN_TRAINING} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-training">
        <Suspense fallback={<LayoutSkeleton />}>
          <TrainingAcademy />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-certifications" path={ROUTES.TECHNICIAN_CERTIFICATIONS} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-certifications">
        <Suspense fallback={<LayoutSkeleton />}>
          <CertificationsPage />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-marketplace" path={ROUTES.TECHNICIAN_MARKETPLACE} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-marketplace">
        <Suspense fallback={<LayoutSkeleton />}>
          <JobMarketplacePage />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-work-orders" path={ROUTES.TECHNICIAN_WORK_ORDERS} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-work-orders">
        <Suspense fallback={<LayoutSkeleton />}>
          <WorkOrdersPage />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-earnings" path={ROUTES.TECHNICIAN_EARNINGS} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-earnings">
        <Suspense fallback={<LayoutSkeleton />}>
          <EarningsPage />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-profile" path={ROUTES.TECHNICIAN_PROFILE} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-profile">
        <Suspense fallback={<LayoutSkeleton />}>
          <ProfilePage />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
  <Route key="t-ai" path={ROUTES.TECHNICIAN_AI} element={
    <TechnicianShell>
      <PermissionGuard feature="technician-ai">
        <Suspense fallback={<LayoutSkeleton />}>
          <TechnicianAiPage />
        </Suspense>
      </PermissionGuard>
    </TechnicianShell>
  } />,
]

export default technicianRouteElements
