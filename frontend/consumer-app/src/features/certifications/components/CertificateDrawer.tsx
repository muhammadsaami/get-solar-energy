import React, { useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

interface CertificateDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function CertificateDrawer({
  isOpen,
  onClose,
  title = 'Certificate Details',
  children,
}: CertificateDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      drawerRef.current?.focus()

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    } else if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus()
    }
  }, [isOpen, onClose])

  return (
    <div
      className={`cert-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="certDrawerTitle"
    >
      <div
        className="cert-drawer-container"
        ref={drawerRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="cert-drawer-header">
          <h2 className="cert-drawer-title" id="certDrawerTitle">
            {title}
          </h2>
          <button
            className="cert-drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
            title="Close drawer"
          >
            <MdClose />
          </button>
        </div>

        <div className="cert-drawer-body">{children}</div>
      </div>
    </div>
  )
}
