import React from 'react'
import type { CanonicalTechnicianProfile, AchievementBadge } from '../types/profile.types'
import { MdEmail, MdPhone, MdLocationOn, MdStar, MdShield, MdFlashOn } from 'react-icons/md'

interface OverviewTabProps {
  profile: CanonicalTechnicianProfile
  onSelectBadge: (badge: AchievementBadge) => void
}

export default function OverviewTab({ profile, onSelectBadge }: OverviewTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Bio Section */}
      <div className="profile-panel">
        <h3 className="profile-panel-title">
          Technician Bio & Engineering Focus
        </h3>
        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
          {profile.bio}
        </p>
      </div>

      {/* Contact & Account Grid */}
      <div className="profile-panel">
        <h3 className="profile-panel-title">
          Verified Identity & Contact Info
        </h3>

        <div className="profile-info-grid">
          <div className="profile-info-card">
            <MdEmail style={{ color: '#00aeef', fontSize: '20px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Email Address</div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500 }}>{profile.email}</div>
            </div>
          </div>

          <div className="profile-info-card">
            <MdPhone style={{ color: '#10b981', fontSize: '20px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Phone Number</div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500 }}>{profile.phone}</div>
            </div>
          </div>

          <div className="profile-info-card">
            <MdLocationOn style={{ color: '#f7931e', fontSize: '20px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Service City</div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500 }}>{profile.city}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges Highlights */}
      <div className="profile-panel">
        <h3 className="profile-panel-title">
          Recent Achievement Badges
        </h3>

        <div className="badge-grid">
          {profile.badges.map(badge => (
            <div key={badge.id} className="badge-card" onClick={() => onSelectBadge(badge)}>
              <div className="badge-icon-box">
                {badge.icon === 'flash' ? <MdFlashOn /> : badge.icon === 'shield' ? <MdShield /> : <MdStar />}
              </div>
              <div>
                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
                  {badge.title}
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
