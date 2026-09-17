import React from 'react'
import type { RawDiagnosisPayload } from '../types/technicianAi.types'
import { MdWarning, MdBook, MdSchool, MdChevronRight } from 'react-icons/md'

interface DiagnosticCardProps {
  diagnosis: RawDiagnosisPayload
  onOpenDrawer: (diag: RawDiagnosisPayload) => void
}

export default function DiagnosticCard({ diagnosis, onOpenDrawer }: DiagnosticCardProps) {
  return (
    <div className="diagnostic-card-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#00aeef' }}>FAULT CODE: {diagnosis.error_code}</span>
        <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
          {diagnosis.severity} Severity
        </span>
      </div>

      <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0' }}>
        {diagnosis.title}
      </h4>

      {diagnosis.safety_warning && (
        <div style={{ background: 'rgba(247, 147, 30, 0.1)', border: '1px solid rgba(247,147,30,0.3)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#f7931e', marginBottom: '12px' }}>
          <MdWarning style={{ display: 'inline', marginRight: '4px' }} /> {diagnosis.safety_warning}
        </div>
      )}

      {diagnosis.suggested_kb_title && (
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdBook style={{ color: '#00aeef' }} /> {diagnosis.suggested_kb_title}
        </div>
      )}

      {diagnosis.recommended_training_module && (
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdSchool style={{ color: '#10b981' }} /> {diagnosis.recommended_training_module}
        </div>
      )}

      <button
        className="btn btn-primary btn-sm"
        style={{ width: '100%' }}
        onClick={() => onOpenDrawer(diagnosis)}
        aria-label="View full step-by-step action plan"
      >
        View Full Action Plan <MdChevronRight />
      </button>
    </div>
  )
}
