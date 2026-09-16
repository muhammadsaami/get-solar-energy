import React, { useEffect, useRef } from 'react'
import { MdClose } from 'react-icons/md'

interface PayoutDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function PayoutDrawer({
  isOpen,
  onClose,
  title = 'Payout Transaction Details',
  children,
}: PayoutDrawerProps) {
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
      className={`payout-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payoutDrawerTitle"
    >
      <div
        className="payout-drawer-container"
        ref={drawerRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="payout-drawer-header">
          <h2 className="payout-drawer-title" id="payoutDrawerTitle">
            {title}
          </h2>
          <button
            className="payout-drawer-close-btn"
            onClick={onClose}
            aria-label="Close payout details drawer"
            title="Close payout details drawer"
          >
            <MdClose />
          </button>
        </div>

        <div className="payout-drawer-body">{children}</div>
      </div>
    </div>
  )
}
