import React, { Suspense, lazy } from 'react'
import { Route, Navigate } from 'react-router-dom'

import { ROUTES } from '../config/routes'
import PermissionGuard from './PermissionGuard'
import VendorAppShell from '../vendor/components/VendorAppShell'
import LayoutSkeleton from '../components/layout/LayoutSkeleton'

const VendorDashboard = lazy(() => import('../vendor/pages/VendorDashboard'))
const VendorProjects = lazy(() => import('../vendor/pages/VendorProjects'))
const VendorCustomers = lazy(() => import('../vendor/pages/VendorCustomers'))
const VendorLeads = lazy(() => import('../vendor/pages/VendorLeads'))
const VendorInstallations = lazy(() => import('../vendor/pages/VendorInstallations'))
const VendorTeams = lazy(() => import('../vendor/pages/VendorTeams'))
const VendorInventory = lazy(() => import('../vendor/pages/VendorInventory'))
const VendorAMC = lazy(() => import('../vendor/pages/VendorAMC'))
const VendorPayments = lazy(() => import('../vendor/pages/VendorPayments'))
const VendorReports = lazy(() => import('../vendor/pages/VendorReports'))
const VendorAnalytics = lazy(() => import('../vendor/pages/VendorAnalytics'))
const VendorDocuments = lazy(() => import('../vendor/pages/VendorDocuments'))
const VendorSettings = lazy(() => import('../vendor/pages/VendorSettings'))
const VendorProfile = lazy(() => import('../vendor/pages/VendorProfile'))
const MyWork = lazy(() => import('../vendor/pages/MyWork'))

function VendorShell({ children }: { children: React.ReactNode }) {
  return <VendorAppShell>{children}</VendorAppShell>
}

const vendorRouteElements = [
  <Route key="v-root" path={ROUTES.VENDOR_ROOT} element={<Navigate to={ROUTES.VENDOR_DASHBOARD} replace />} />,
  <Route key="v-mywork" path={ROUTES.VENDOR_MY_WORK} element={
    <VendorShell>
      <PermissionGuard feature="vendor-projects">
        <Suspense fallback={<LayoutSkeleton />}>
          <MyWork />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-tasks" path={ROUTES.VENDOR_TASKS} element={<Navigate to={ROUTES.VENDOR_MY_WORK} replace />} />,
  <Route key="v-visits" path={ROUTES.VENDOR_VISITS} element={<Navigate to={ROUTES.VENDOR_MY_WORK} replace />} />,
  <Route key="v-orders" path={ROUTES.VENDOR_WORK_ORDERS} element={<Navigate to={ROUTES.VENDOR_MY_WORK} replace />} />,
  <Route key="v-proj-active" path={ROUTES.VENDOR_PROJECTS_ACTIVE} element={<Navigate to={ROUTES.VENDOR_PROJECTS} replace />} />,
  <Route key="v-proj-completed" path={ROUTES.VENDOR_PROJECTS_COMPLETED} element={<Navigate to={ROUTES.VENDOR_PROJECTS} replace />} />,
  <Route key="v-dashboard" path={ROUTES.VENDOR_DASHBOARD} element={
    <VendorShell>
      <PermissionGuard feature="vendor-dashboard">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorDashboard />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-projects" path={ROUTES.VENDOR_PROJECTS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-projects">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorProjects />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-customers" path={ROUTES.VENDOR_CUSTOMERS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-customers">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorCustomers />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-leads" path={ROUTES.VENDOR_LEADS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-leads">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorLeads />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-installations" path={ROUTES.VENDOR_INSTALLATIONS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-installations">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorInstallations />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-teams" path={ROUTES.VENDOR_TEAMS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-teams">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorTeams />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-inventory" path={ROUTES.VENDOR_INVENTORY} element={
    <VendorShell>
      <PermissionGuard feature="vendor-inventory">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorInventory />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-amc" path={ROUTES.VENDOR_AMC} element={
    <VendorShell>
      <PermissionGuard feature="vendor-amc">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorAMC />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-payments" path={ROUTES.VENDOR_PAYMENTS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-payments">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorPayments />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-reports" path={ROUTES.VENDOR_REPORTS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-reports">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorReports />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-analytics" path={ROUTES.VENDOR_ANALYTICS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-analytics">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorAnalytics />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-documents" path={ROUTES.VENDOR_DOCUMENTS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-documents">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorDocuments />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-settings" path={ROUTES.VENDOR_SETTINGS} element={
    <VendorShell>
      <PermissionGuard feature="vendor-settings">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorSettings />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
  <Route key="v-profile" path={ROUTES.VENDOR_PROFILE} element={
    <VendorShell>
      <PermissionGuard feature="vendor-profile">
        <Suspense fallback={<LayoutSkeleton />}>
          <VendorProfile />
        </Suspense>
      </PermissionGuard>
    </VendorShell>
  } />,
]

export default vendorRouteElements
