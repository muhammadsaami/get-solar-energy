import React from 'react'
import type { CanonicalCertification } from '../types/certifications.types'
import CertificateCard from './CertificateCard'

interface ActiveCertificationsGridProps {
  certifications: CanonicalCertification[]
  onSelect: (cert: CanonicalCertification) => void
  onDownload: (id: string) => void
  onShare: (id: string) => void
}

export default function ActiveCertificationsGrid({
  certifications,
  onSelect,
  onDownload,
  onShare,
}: ActiveCertificationsGridProps) {
  if (certifications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        No certifications found matching the selected filter.
      </div>
    )
  }

  return (
    <div className="cert-card-grid">
      {certifications.map(cert => (
        <CertificateCard
          key={cert.id}
          certification={cert}
          onSelect={onSelect}
          onDownload={onDownload}
          onShare={onShare}
        />
      ))}
    </div>
  )
}
