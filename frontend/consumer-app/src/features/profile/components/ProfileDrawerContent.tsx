import React from 'react'
import type { AchievementBadge } from '../types/profile.types'
import { MdStar, MdShield, MdFlashOn, MdVerified, MdCalendarToday } from 'react-icons/md'

interface ProfileDrawerContentProps {
  badge: AchievementBadge
}

export default function ProfileDrawerContent({ badge }: ProfileDrawerContentProps) {
  return (
    <>
      <div style={{ background: 'linear-gradient(135deg, #0b2233 0%, #061524 100%)', border: '1px solid rgba(0,174,239,0.2)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(0,174,239,0.15)', color: '#00aeef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
          {badge.icon === 'flash' ? <MdFlashOn /> : badge.icon === 'shield' ? <MdShield /> : <MdStar />}
        </div>
        <div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
            {badge.title}
          </h3>
          <span style={{ fontSize: '12px', color: '#00aeef', background: 'rgba(0,174,239,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            Category: {badge.category}
          </span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
        <h4 style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0' }}>Achievement Description</h4>
        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
          {badge.description}
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdCalendarToday style={{ color: '#00aeef' }} /> Issued Date: <strong style={{ color: '#ffffff' }}>{badge.issuedDate}</strong>
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdVerified style={{ color: '#10b981' }} /> Verification: <strong style={{ color: '#ffffff' }}>GET Solar Quality Board Verified</strong>
        </div>
      </div>
    </>
  )
}
