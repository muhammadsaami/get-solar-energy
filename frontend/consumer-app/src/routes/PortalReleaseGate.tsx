import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { ROLES } from '../config/roles'
import { ROUTES } from '../config/routes'
import PortalComingSoon from '../components/ui/PortalComingSoon'

interface PortalReleaseGateProps {
  portal: 'vendor' | 'technician'
  released: boolean
  children: React.ReactNode
}

const VENDOR_CAPABILITIES = [
  { label: 'Project pipeline', hint: 'Installations assigned to your team' },
  { label: 'Inventory', hint: 'Panels, inverters, and mounting stock' },
  { label: 'Payments', hint: 'Payouts and invoice tracking' },
  { label: 'Service tickets', hint: 'Support and AMC work orders' },
]

const TECHNICIAN_CAPABILITIES = [
  { label: 'Work orders', hint: 'Assigned installation and service jobs' },
  { label: 'Job marketplace', hint: 'Open jobs in your region' },
  { label: 'Earnings', hint: 'Payouts and job history' },
  { label: 'Training', hint: 'Certifications and skill building' },
]

/**
 * Release gate for unreleased portals. Renders inside PermissionGuard, so
 * unauthenticated users still redirect to login and unauthorized roles
 * still receive the existing AccessDenied page. Only Admin sees the
 * operational portal; the owning role (and engineer, on vendor) sees a
 * Coming Soon state with no operational data.
 */
export default function PortalReleaseGate({ portal, released, children }: PortalReleaseGateProps) {
  const { role } = usePermissions()

  if (released || role === ROLES.ADMIN) {
    return <>{children}</>
  }

  if (portal === 'vendor') {
    return (
      <PortalComingSoon
        title="Vendor Portal"
        description="Vendor project management, inventory, payments, and service operations are being prepared for a future release."
        capabilities={VENDOR_CAPABILITIES}
        closingNote="Your vendor workspace will be available here in a future release."
        ctaLabel="Back to Dashboard"
        ctaTo={ROUTES.HOME}
        ariaLabel="vendor portal"
      />
    )
  }

  return (
    <PortalComingSoon
      title="Technician Portal"
      description="Work orders, job marketplace, earnings, and training tools are being prepared for a future release."
      capabilities={TECHNICIAN_CAPABILITIES}
      closingNote="Your technician workspace will be available here in a future release."
      ctaLabel="Open Knowledge Base"
      ctaTo={ROUTES.KNOWLEDGE_BASE}
      ariaLabel="technician portal"
    />
  )
}
