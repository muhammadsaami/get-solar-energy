import React from 'react'
import { MdSupportAgent, MdPhone, MdShield } from 'react-icons/md'
import { useNotificationStore } from '../../../stores/notificationStore'

export default function EscalationPanel() {
  const addToast = useNotificationStore((s) => s.addToast)
  return (
    <div className="escalation-box">
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MdSupportAgent style={{ color: '#10b981' }} /> Senior Engineering Escalation
      </h3>
      <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 12px 0' }}>
        Unresolved grid compliance or high-voltage structural anomaly? Escalate directly to Level 3 Lead Systems Engineer.
      </p>

      <button
        className="btn btn-secondary btn-sm"
        style={{ width: '100%' }}
        onClick={() => addToast({ type: 'info', message: 'Escalating case to Level 3 System Specialist...' })}
        aria-label="Request emergency technical callback"
      >
        <MdPhone /> Request Emergency Callback
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
        <MdShield style={{ color: '#10b981' }} /> Average Callback SLA: <strong>&lt; 15 mins</strong>
      </div>
    </div>
  )
}
