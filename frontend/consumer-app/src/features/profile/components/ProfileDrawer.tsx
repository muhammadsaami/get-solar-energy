import React, { useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  title = 'Achievement Badge Details',
  children,
}: ProfileDrawerProps) {
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
      className={`profile-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileDrawerTitle"
    >
      <div
        className="profile-drawer-container"
        ref={drawerRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="profile-drawer-header">
          <h2 className="profile-drawer-title" id="profileDrawerTitle">
            {title}
          </h2>
          <button
            className="profile-drawer-close-btn"
            onClick={onClose}
            aria-label="Close profile drawer"
            title="Close profile drawer"
          >
            <MdClose />
          </button>
        </div>

        <div className="profile-drawer-body">{children}</div>
      </div>
    </div>
  )
}
