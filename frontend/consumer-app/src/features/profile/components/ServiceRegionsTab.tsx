import React from 'react'
import type { CanonicalTechnicianProfile } from '../types/profile.types'
import { MdLocationOn, MdCheckCircle } from 'react-icons/md'

interface ServiceRegionsTabProps {
  profile: CanonicalTechnicianProfile
}

export default function ServiceRegionsTab({ profile }: ServiceRegionsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="profile-panel">
        <h3 className="profile-panel-title">
          Active Dispatch & Field Service Regions
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>
          Work orders are matched automatically based on your primary location ({profile.city}) and active service regions.
        </p>

        <div className="region-grid">
          {profile.serviceRegions.map((region, i) => (
            <div key={i} className="region-card">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdLocationOn style={{ color: '#00aeef' }} /> {region}
              </span>
              <MdCheckCircle style={{ color: '#10b981' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
