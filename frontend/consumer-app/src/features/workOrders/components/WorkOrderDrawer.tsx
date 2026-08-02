import React, { useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

interface WorkOrderDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function WorkOrderDrawer({
  isOpen,
  onClose,
  title = 'Work Order Details',
  children,
}: WorkOrderDrawerProps) {
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
      className={`wo-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="woDrawerTitle"
    >
      <div
        className="wo-drawer-container"
        ref={drawerRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="wo-drawer-header">
          <h2 className="wo-drawer-title" id="woDrawerTitle">
            {title}
          </h2>
          <button
            className="wo-drawer-close-btn"
            onClick={onClose}
            aria-label="Close work order drawer"
            title="Close work order drawer"
          >
            <MdClose />
          </button>
        </div>

        <div className="wo-drawer-body">{children}</div>
      </div>
    </div>
  )
}
