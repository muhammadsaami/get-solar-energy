import React from 'react'
import type { CanonicalCertification } from '../types/certifications.types'
import { MdVerified, MdChevronRight } from 'react-icons/md'

interface CertificationTimelineProps {
  timeline: CanonicalCertification[]
  onSelect: (cert: CanonicalCertification) => void
}

export default function CertificationTimeline({
  timeline,
  onSelect,
}: CertificationTimelineProps) {
  return (
    <div style={{ background: 'rgba(8, 24, 42, 0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '20px' }}>
        Career Certification Milestones
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '24px' }}>
        <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(0, 174, 239, 0.3)' }} />

        {timeline.map((cert) => (
          <div key={cert.id} style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'absolute', left: '-23px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderRadius: '50%', background: '#00aeef', border: '3px solid #06111f' }} />

            <div>
              <div style={{ fontSize: '12px', color: '#00aeef', fontWeight: 600 }}>
                {new Date(cert.issuedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '4px 0' }}>{cert.title}</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                {cert.badgeName} • License: {cert.certificateNumber}
              </p>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onSelect(cert)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MdVerified /> View Credentials <MdChevronRight />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
