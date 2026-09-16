import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import type { RawDiagnosisPayload } from '../types/technicianAi.types'
import { MdWarning, MdCheckCircle, MdBook, MdSchool, MdBuild } from 'react-icons/md'
import { useNotificationStore } from '../../../stores/notificationStore'

interface TroubleshootingDrawerContentProps {
  diagnosis: RawDiagnosisPayload
}

export default function TroubleshootingDrawerContent({ diagnosis }: TroubleshootingDrawerContentProps) {
  const addToast = useNotificationStore((s) => s.addToast)
  return (
    <>
      <div style={{ background: 'linear-gradient(135deg, #0b2233 0%, #061524 100%)', border: '1px solid rgba(0,174,239,0.2)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
              {diagnosis.title}
            </h3>
            <p style={{ fontSize: '12px', color: '#00aeef', margin: 0 }}>FAULT CODE: {diagnosis.error_code}</p>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {diagnosis.severity}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '8px 0 0 0' }}>
          <strong>Probable Root Cause:</strong> {diagnosis.cause}
        </p>
      </div>

      {diagnosis.safety_warning && (
        <div style={{ background: 'rgba(247, 147, 30, 0.1)', border: '1px solid rgba(247,147,30,0.3)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#f7931e', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <MdWarning style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>LOTO Safety Requirement:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#fed7aa' }}>{diagnosis.safety_warning}</p>
          </div>
        </div>
      )}

      {/* Step-by-Step Resolution Plan */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdBuild style={{ color: '#00aeef' }} /> Step-by-Step Field Resolution Sequence
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {diagnosis.steps.map((step, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Connected Knowledge Base & Training */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {diagnosis.suggested_kb_title && (
          <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdBook style={{ color: '#00aeef' }} /> {diagnosis.suggested_kb_title}
            </span>
            <Link to={ROUTES.KNOWLEDGE_BASE} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
              Open Article
            </Link>
          </div>
        )}
        {diagnosis.recommended_training_module && (
          <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdSchool style={{ color: '#10b981' }} /> {diagnosis.recommended_training_module}
            </span>
            <Link to={ROUTES.TECHNICIAN_TRAINING} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
              Open Academy
            </Link>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => addToast({ type: 'info', message: `Saved diagnostic report for ${diagnosis.error_code} to field log` })}
        >
          <MdCheckCircle /> Log Resolution in Work Order History
        </button>
      </div>
    </>
  )
}
