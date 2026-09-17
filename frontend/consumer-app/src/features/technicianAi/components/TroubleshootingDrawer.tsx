import React, { useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

interface TroubleshootingDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function TroubleshootingDrawer({
  isOpen,
  onClose,
  title = 'Field Action Plan',
  children,
}: TroubleshootingDrawerProps) {
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
      className={`troubleshooting-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="troubleshootingDrawerTitle"
    >
      <div
        className="troubleshooting-drawer-container"
        ref={drawerRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="troubleshooting-drawer-header">
          <h2 className="troubleshooting-drawer-title" id="troubleshootingDrawerTitle">
            {title}
          </h2>
          <button
            className="troubleshooting-drawer-close-btn"
            onClick={onClose}
            aria-label="Close troubleshooting drawer"
            title="Close troubleshooting drawer"
          >
            <MdClose />
          </button>
        </div>

        <div className="troubleshooting-drawer-body">{children}</div>
      </div>
    </div>
  )
}
