import React, { useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

interface JobDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function JobDrawer({
  isOpen,
  onClose,
  title = 'Job Details',
  children,
}: JobDrawerProps) {
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
      className={`job-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="jobDrawerTitle"
    >
      <div
        className="job-drawer-container"
        ref={drawerRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="job-drawer-header">
          <h2 className="job-drawer-title" id="jobDrawerTitle">
            {title}
          </h2>
          <button
            className="job-drawer-close-btn"
            onClick={onClose}
            aria-label="Close job drawer"
            title="Close job drawer"
          >
            <MdClose />
          </button>
        </div>

        <div className="job-drawer-body">{children}</div>
      </div>
    </div>
  )
}
