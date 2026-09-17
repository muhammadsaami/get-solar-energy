import React from 'react'
import OfficialLogo from '../../components/brand/OfficialLogo'

interface VendorBrandLogoProps {
  collapsed?: boolean
}

export function VendorBrandLogo({ collapsed = false }: VendorBrandLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: '44px', userSelect: 'none' }}>
      <OfficialLogo collapsed={collapsed} height={38} />
    </div>
  )
}

export default VendorBrandLogo
