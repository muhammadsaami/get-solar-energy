import { useCallback, useEffect, useRef, useState } from 'react'
import type { MlopsVersion, MlopsEvent } from './mlops.types'
import type { MlopsRegistryRow } from './MlOpsPage'

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (value == null || value === '') return null
  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-word', fontFamily: mono ? 'var(--font-mono, ui-monospace, monospace)' : 'inherit' }}>{value}</div>
    </div>
  )
}

const VERSION_STATUS: Record<string, { color: string; bg: string }> = {
  deployed: { color: '#36d399', bg: 'rgba(54,211,153,0.15)' },
  failed: { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  validating: { color: '#17a8e5', bg: 'rgba(23,168,229,0.15)' },
  registered: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
}

function shortTs(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

export default function ModelDetailDrawer({ model, versions, events, onClose }: {
  model: MlopsRegistryRow | null
  versions: MlopsVersion[]
  events: MlopsEvent[]
  onClose: () => void
}) {
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
    if (model) {
      setClosing(false)
      document.body.style.overflow = 'hidden'
      const t = setTimeout(() => drawerRef.current?.querySelector('button')?.focus(), 100)
      return () => { clearTimeout(t); document.body.style.overflow = '' }
    }
  }, [model])

  if (!model) return null

  const versionInfo = versions.find(v => v.modelName === model.name)
  const history = versionInfo?.history ?? []
  const modelEvents = events.filter(e => e.modelName === model.name).slice(0, 20)
  const checksumShort = model.checksum ? `${model.checksum.slice(0, 8)}…${model.checksum.slice(-8)}` : null

  return (
    <>
      <div className={`drawer-overlay${closing ? ' drawer-overlay-closing' : ''}`} onClick={handleClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className={`drawer${closing ? ' drawer-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Model details"
        onKeyDown={handleKeyDown}
        style={{ width: '480px', maxWidth: '95vw' }}
      >
        <div style={{ padding: 'var(--space-4) var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{model.name}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(54,211,153,0.15)', color: '#36d399', textTransform: 'capitalize' }}>{model.lifecycleState}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 8 }}>{model.algorithm} · {model.task}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleClose} aria-label="Close drawer" style={{ flexShrink: 0, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <DetailRow label="Version" value={model.version} mono />
        <DetailRow label="Framework" value={model.framework} />
        <DetailRow label="Algorithm" value={model.algorithm} />
        <DetailRow label="Task" value={model.task} />
        <DetailRow label="File Size" value={model.fileSize && model.fileSize > 0 ? `${(model.fileSize / 1024).toFixed(1)} KB` : null} />
        <DetailRow label="Checksum" value={checksumShort} mono />
        <DetailRow label="Features" value={(model.features && model.features.length > 0) ? model.features.join(', ') : null} />
        <DetailRow label="Last Deployment" value={model.lastDeployment ? shortTs(model.lastDeployment) : null} />

        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Version History</div>
          {history.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No recorded version history for this model.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {history.map(h => {
                const meta = VERSION_STATUS[h.status] ?? VERSION_STATUS.registered
                return (
                  <div key={`${h.version}-${h.deploymentDate}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '11px', color: 'var(--text-primary)' }}>{h.version}</span>
                    <span style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      {h.rollbackTarget && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>rollback target</span>}
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, textTransform: 'capitalize', background: meta.bg, color: meta.color }}>{h.status}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Recent Events</div>
          {modelEvents.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No recorded events for this model.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {modelEvents.map((e, i) => (
                <div key={`${e.eventType}-${e.timestamp}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{e.eventType.replace(/_/g, ' ')}</span>
                  <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{shortTs(e.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
