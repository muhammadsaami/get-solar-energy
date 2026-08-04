import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import type { CanonicalTechnicianProfile } from '../types/profile.types'
import { MdVerified, MdCheckCircle, MdSchool, MdArrowForward } from 'react-icons/md'

interface SkillsCertificationsTabProps {
  profile: CanonicalTechnicianProfile
}

export default function SkillsCertificationsTab({ profile }: SkillsCertificationsTabProps) {
  const summary = profile.certificationsSummary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="profile-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Training Academy Badges & Certifications
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={ROUTES.TECHNICIAN_TRAINING} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Training Academy <MdArrowForward />
            </Link>
            <Link to={ROUTES.TECHNICIAN_CERTIFICATIONS} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Certifications <MdArrowForward />
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0,174,239,0.12)', color: '#00aeef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <MdSchool />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>
                Level 1: Solar Foundations
              </h4>
              <span style={{ fontSize: '12px', color: summary.level1Passed ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MdCheckCircle /> {summary.level1Passed ? 'Verified & Passed' : 'In Progress'}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(247,147,30,0.12)', color: '#f7931e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <MdSchool />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>
                Level 2: Advanced Installation
              </h4>
              <span style={{ fontSize: '12px', color: summary.level2Passed ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MdCheckCircle /> {summary.level2Passed ? 'Verified & Passed' : 'In Progress'}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <MdVerified />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>
                Certified Master Technician
              </h4>
              <span style={{ fontSize: '12px', color: summary.certifiedPassed ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MdCheckCircle /> {summary.certifiedPassed ? 'Officially Certified' : 'Locked'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
