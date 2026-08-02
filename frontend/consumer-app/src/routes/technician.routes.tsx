import React, { Suspense, lazy } from 'react'
import { Route } from 'react-router-dom'

import { ROUTES } from '../config/routes'
import type { FeatureId } from '../config/permissions'
import PermissionGuard from './PermissionGuard'
import AppShell from '../components/layout/AppShell'
import LockedWorkspace from '../components/feedback/LockedWorkspace'
import LayoutSkeleton from '../components/layout/LayoutSkeleton'

const TechnicianDashboard = lazy(() => import('../technician/pages/TechnicianDashboard'))
const TrainingAcademy = lazy(() => import('../features/training/TrainingAcademy'))
const CertificationsPage = lazy(() => import('../features/certifications/pages/CertificationsPage'))

function TechnicianShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}

function TechnicianLocked({ feature, stageId, title }: { feature: FeatureId; stageId: string; title: string }) {
  return (
    <TechnicianShell>
      <PermissionGuard feature={feature}>
        <LockedWorkspace targetStageId={stageId} featureTitle={title} />
      </PermissionGuard>
    </TechnicianShell>
  )
}

const technicianRouteElements = [
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
  <Route key="t-marketplace" path={ROUTES.TECHNICIAN_MARKETPLACE} element={<TechnicianLocked feature="technician-marketplace" stageId="PHASE_18_6" title="Job Marketplace" />} />,
  <Route key="t-work-orders" path={ROUTES.TECHNICIAN_WORK_ORDERS} element={<TechnicianLocked feature="technician-work-orders" stageId="PHASE_18_7" title="Work Orders" />} />,
  <Route key="t-earnings" path={ROUTES.TECHNICIAN_EARNINGS} element={<TechnicianLocked feature="technician-earnings" stageId="PHASE_18_8" title="Earnings" />} />,
  <Route key="t-profile" path={ROUTES.TECHNICIAN_PROFILE} element={<TechnicianLocked feature="technician-profile" stageId="PHASE_18_9" title="Profile & Performance" />} />,
  <Route key="t-ai" path={ROUTES.TECHNICIAN_AI} element={<TechnicianLocked feature="technician-ai" stageId="PHASE_18_10" title="AI Troubleshooting" />} />,
]

export default technicianRouteElements
