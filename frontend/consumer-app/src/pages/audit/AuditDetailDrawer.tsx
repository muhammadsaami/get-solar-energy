import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuditEvent, AuditSeverity } from './audit.types'

const SEVERITY_META: Record<AuditSeverity, { color: string; bg: string }> = {
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  success: { color: '#36d399', bg: 'rgba(54,211,153,0.15)' },
  info: { color: '#17a8e5', bg: 'rgba(23,168,229,0.15)' },
}

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (value == null || value === '') return null
  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-word', fontFamily: mono ? 'var(--font-mono, ui-monospace, monospace)' : 'inherit' }}>{value}</div>
    </div>
  )
}

export default function AuditDetailDrawer({ event, onClose }: { event: AuditEvent | null; onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 220)
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { handleClose(); return }
    if (e.key === 'Tab') {
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [handleClose])

  useEffect(() => {
    if (event) {
      setClosing(false)
      document.body.style.overflow = 'hidden'
      const t = setTimeout(() => drawerRef.current?.querySelector('button')?.focus(), 100)
      return () => { clearTimeout(t); document.body.style.overflow = '' }
    }
  }, [event])

  if (!event) return null

  const severityMeta = SEVERITY_META[event.severity]
  const fullTimestamp = new Date(event.timestamp).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  const entityValue = event.entityType
    ? (event.entityId != null ? `${event.entityType} #${event.entityId}` : event.entityType)
    : (event.source === 'activity' ? 'Customer' : null)

  return (
    <>
      <div className={`drawer-overlay${closing ? ' drawer-overlay-closing' : ''}`} onClick={handleClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className={`drawer${closing ? ' drawer-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Event details"
        onKeyDown={handleKeyDown}
        style={{ width: '480px', maxWidth: '95vw' }}
      >
        <div style={{ padding: 'var(--space-4) var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{event.action}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: severityMeta.bg, color: severityMeta.color, textTransform: 'capitalize' }}>{event.severity}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 8 }}>{event.module}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleClose} aria-label="Close drawer" style={{ flexShrink: 0, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <DetailRow label="Full Timestamp" value={fullTimestamp} />
        <DetailRow label="User" value={event.user || 'System'} />
        <DetailRow label="Entity" value={entityValue} mono />
        <DetailRow label="Detail" value={event.detail} />
        <DetailRow label="IP Address" value={event.ipAddress} mono />
        <DetailRow label="Previous Value" value={event.oldValue} mono />
        <DetailRow label="New Value" value={event.newValue} mono />
        <DetailRow label="Source" value={event.source} />
      </div>
    </>
  )
}
