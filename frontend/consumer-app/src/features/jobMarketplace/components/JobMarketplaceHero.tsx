import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import { MdWork, MdLocationOn, MdCheckCircle, MdFlashOn, MdAssignment } from 'react-icons/md'

interface JobMarketplaceHeroProps {
  onQuickApplyClick: () => void
}

export default function JobMarketplaceHero({ onQuickApplyClick }: JobMarketplaceHeroProps) {
  return (
    <div className="job-hero">
      <div className="job-hero-header">
        <div className="job-hero-title-group">
          <h1>
            <MdWork style={{ color: '#00aeef' }} /> Technician Job Marketplace
          </h1>
          <p>
            Browse verified solar installation, AMC diagnostic, high-voltage repair, and field inspection jobs posted by top EPC vendors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to={ROUTES.TECHNICIAN_WORK_ORDERS}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MdAssignment /> Active Work Orders
          </Link>

          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={onQuickApplyClick}
          >
            <MdFlashOn /> Quick Match & Apply
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdLocationOn style={{ color: '#00aeef' }} /> Location Preference: <strong style={{ color: '#ffffff' }}>Mumbai & Suburban</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdCheckCircle style={{ color: '#10b981' }} /> Availability: <strong style={{ color: '#ffffff' }}>Immediate (Field Ready)</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdWork style={{ color: '#f7931e' }} /> Preferred Skill Level: <strong style={{ color: '#ffffff' }}>Level 1 & Level 2</strong>
        </div>
      </div>
    </div>
  )
}
