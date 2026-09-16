import React from 'react'
import { MdSchool, MdChevronRight } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

export default function CertificationsEmptyState() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'rgba(8, 24, 42, 0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 174, 239, 0.1)', color: '#00aeef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px auto' }}>
        <MdSchool />
      </div>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
        No Certifications Earned Yet
      </h3>
      <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
        Complete training modules in the GET Solar Energy Training Academy to earn verified technical badges and unlock higher-paying work orders.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => navigate('/app/technician/training')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        Go to Training Academy <MdChevronRight />
      </button>
    </div>
  )
}
