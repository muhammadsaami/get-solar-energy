import React from 'react'

const STATUS_STYLES = {
  Active: { color: 'var(--accent-green)', bg: 'rgba(54,211,153,0.1)', border: 'rgba(54,211,153,0.2)' },
  Expired: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  'In Progress': { color: 'var(--accent-orange)', bg: 'rgba(255,138,29,0.1)', border: 'rgba(255,138,29,0.2)' },
}

export default function Certifications({ certifications }) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' }}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Certifications</span>
        <svg className="kpi-title-icon green"><use href="#icon-shield" /></svg>
      </div>

      {(!certifications || certifications.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-shield" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No certifications earned yet. Complete courses to earn certifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {certifications.map((cert) => {
            const ss = STATUS_STYLES[cert.status] || STATUS_STYLES['In Progress']
            return (
              <div key={cert.id} style={{
                padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>{cert.title}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{cert.issuer}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 3, color: ss.color, background: ss.bg, border: `1px solid ${ss.border}`, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {cert.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 9, color: 'var(--text-muted)' }}>
                  <span>Issued: {cert.issueDate}</span>
                  {cert.expiryDate && <span>Expires: {cert.expiryDate}</span>}
                  {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                </div>
                {cert.status === 'Active' && (
                  <button className="calc-btn" style={{ width: 'auto', fontSize: 9, padding: '2px 12px', height: 'auto', minHeight: 0, marginTop: 6 }}>Download Certificate</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
