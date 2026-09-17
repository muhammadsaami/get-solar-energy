import React, { useCallback, useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

export default function DocumentDrawer({ open, title, subtitle, onClose, children }) {
  const drawerRef = useRef(null)

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => {
      drawerRef.current?.querySelector('button')?.focus()
    }, 100)
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-drawer-title"
        onKeyDown={handleKeyDown}
      >
        <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {subtitle ? (
                <span className="badge badge-sm badge-neutral" style={{ marginBottom: 'var(--space-2)' }}>{subtitle}</span>
              ) : null}
              <h2 id="document-drawer-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--text-primary)' }}>
                {title}
              </h2>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close drawer" style={{ flexShrink: 0 }}>
              <MdClose size={20} />
            </button>
          </div>
        </div>
        <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </>
  )
}
