import React from 'react'
import type { CanonicalCertification } from '../types/certifications.types'
import { MdVerified, MdDownload, MdShare, MdCheckCircle, MdQrCode2, MdPrint } from 'react-icons/md'

interface CertificateDrawerContentProps {
  certification: CanonicalCertification
  onDownload: (id: string) => void
  onShare: (id: string) => void
}

export default function CertificateDrawerContent({
  certification,
  onDownload,
  onShare,
}: CertificateDrawerContentProps) {
  return (
    <>
      <div className="cert-credential-paper">
        <div className="cert-paper-watermark">Official Technical Credential</div>
        <h3 className="cert-paper-title">{certification.title}</h3>
        <div className="cert-paper-num">{certification.certificateNumber}</div>

        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          {certification.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <div>
            <span style={{ display: 'block', color: '#64748b' }}>Issued Date</span>
            <strong style={{ color: '#ffffff' }}>{new Date(certification.issuedAt).toLocaleDateString('en-IN')}</strong>
          </div>
          <div>
            <span style={{ display: 'block', color: '#64748b' }}>Passing Score</span>
            <strong style={{ color: '#10b981' }}>{certification.score}%</strong>
          </div>
          <div>
            <span style={{ display: 'block', color: '#64748b' }}>Tier Level</span>
            <strong style={{ color: '#00aeef' }}>{certification.level}</strong>
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdCheckCircle style={{ color: '#10b981' }} /> Unlocked Field Competencies
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {certification.skillsUnlocked.map((skill, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#00aeef', fontWeight: 700 }}>•</span> {skill}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(0, 174, 239, 0.05)', border: '1px solid rgba(0, 174, 239, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '40px', color: '#00aeef' }}>
          <MdQrCode2 />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Cryptographic Verification</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Verified on GET Solar Energy Blockchain Registry
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onShare(certification.id)}
        >
          <MdShare /> Share Link
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => onDownload(certification.id)}
        >
          <MdDownload /> Download Official PDF
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => window.print()}
          title="Print Document"
        >
          <MdPrint /> Print
        </button>
      </div>
    </>
  )
}
