import React from 'react'
import type { CanonicalCertification } from '../types/certifications.types'
import { MdVerified, MdDownload, MdShare, MdChevronRight } from 'react-icons/md'

interface CertificateCardProps {
  certification: CanonicalCertification
  onSelect: (cert: CanonicalCertification) => void
  onDownload: (id: string) => void
  onShare: (id: string) => void
}

export default function CertificateCard({
  certification,
  onSelect,
  onDownload,
  onShare,
}: CertificateCardProps) {
  const isExpiring = certification.status === 'Expiring'

  return (
    <div className={`cert-card ${isExpiring ? 'expiring' : ''}`}>
      <div className="cert-card-top">
        <span className={`cert-badge-chip ${isExpiring ? 'expiring' : 'active'}`}>
          {isExpiring ? 'Expiring Soon' : certification.status}
        </span>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          {certification.level}
        </span>
      </div>

      <div>
        <h3 className="cert-card-title">{certification.title}</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.4 }}>
          {certification.badgeName}
        </p>
      </div>

      <div className="cert-card-meta">
        <div className="cert-card-meta-row">
          <span>License No:</span>
          <strong style={{ color: '#00aeef', fontFamily: 'monospace' }}>{certification.certificateNumber}</strong>
        </div>
        <div className="cert-card-meta-row">
          <span>Issued:</span>
          <span>{new Date(certification.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="cert-card-meta-row">
          <span>Score:</span>
          <strong style={{ color: '#10b981' }}>{certification.score}%</strong>
        </div>
      </div>

      <div className="cert-skills-tags">
        {certification.skillsUnlocked.slice(0, 3).map((skill, i) => (
          <span key={i} className="cert-skill-tag">
            {skill}
          </span>
        ))}
        {certification.skillsUnlocked.length > 3 && (
          <span className="cert-skill-tag">+{certification.skillsUnlocked.length - 3} more</span>
        )}
      </div>

      <div className="cert-card-actions">
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onSelect(certification)}
        >
          <MdVerified /> View Credentials <MdChevronRight />
        </button>

        <button
          className="btn btn-icon btn-sm"
          title="Download PDF"
          aria-label="Download PDF"
          onClick={(e) => {
            e.stopPropagation()
            onDownload(certification.id)
          }}
        >
          <MdDownload />
        </button>

        <button
          className="btn btn-icon btn-sm"
          title="Share Verification Link"
          aria-label="Share Verification Link"
          onClick={(e) => {
            e.stopPropagation()
            onShare(certification.id)
          }}
        >
          <MdShare />
        </button>
      </div>
    </div>
  )
}
