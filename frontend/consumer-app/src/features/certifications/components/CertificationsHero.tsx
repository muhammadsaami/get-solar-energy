import React from 'react'
import type { AdaptedCertificationsData } from '../types/certifications.types'
import { MdVerified, MdWorkspacePremium, MdWarning, MdSchool } from 'react-icons/md'

interface CertificationsHeroProps {
  summary: AdaptedCertificationsData['summary']
}

export default function CertificationsHero({ summary }: CertificationsHeroProps) {
  return (
    <div className="certifications-hero">
      <div className="cert-hero-header">
        <div className="cert-hero-title-group">
          <h1>
            <MdVerified style={{ color: '#00aeef' }} /> Technician Credentials & Certifications
          </h1>
          <p>
            Official verified qualifications, skill tier badges, and digital credentials issued by the GET Solar Energy Engineering Board.
          </p>
        </div>
      </div>

      <div className="cert-kpi-grid">
        <div className="cert-kpi-card">
          <div className="cert-kpi-icon">
            <MdWorkspacePremium />
          </div>
          <div>
            <div className="cert-kpi-val">{summary.skillLevel}</div>
            <div className="cert-kpi-lbl">Current Skill Level</div>
          </div>
        </div>

        <div className="cert-kpi-card">
          <div className="cert-kpi-icon success">
            <MdVerified />
          </div>
          <div>
            <div className="cert-kpi-val">{summary.totalActive}</div>
            <div className="cert-kpi-lbl">Active Certifications</div>
          </div>
        </div>

        <div className="cert-kpi-card">
          <div className="cert-kpi-icon warning">
            <MdWarning />
          </div>
          <div>
            <div className="cert-kpi-val">{summary.totalExpiring}</div>
            <div className="cert-kpi-lbl">Expiring (30 Days)</div>
          </div>
        </div>

        <div className="cert-kpi-card">
          <div className="cert-kpi-icon">
            <MdSchool />
          </div>
          <div>
            <div className="cert-kpi-val">{summary.overallScorePercent}%</div>
            <div className="cert-kpi-lbl">Avg Audit Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}
