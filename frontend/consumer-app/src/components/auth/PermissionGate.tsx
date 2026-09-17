import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import type { FeatureId } from '../../config/permissions'

interface PermissionGateProps {
  feature: FeatureId
  fallback?: React.ReactNode
  children: React.ReactNode
}

export default function PermissionGate({ feature, fallback = null, children }: PermissionGateProps) {
  const { canAccess } = usePermissions()

  if (canAccess(feature)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
