import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { DEMO_EXPLANATIONS, type MetricExplanation } from '../../data/billAnalyzerDemoData'

interface DemoExplainerContextType {
  activeId: string | null
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>
}

export const DemoExplainerContext = React.createContext<DemoExplainerContextType | null>(null)

export function DemoExplainerProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  return (
    <DemoExplainerContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </DemoExplainerContext.Provider>
  )
}

interface DemoMetricExplainerProps {
  id?: string
  metricKey?: string
  customExplanation?: Partial<MetricExplanation>
  compact?: boolean
}

export default function DemoMetricExplainer({
  id,
  metricKey,
  customExplanation,
  compact = false,
}: DemoMetricExplainerProps) {
  const autoId = useId()
  const explainerId = id || `${metricKey || 'metric'}-${autoId}`
  const dialogId = `dialog-${explainerId}`

  const context = React.useContext(DemoExplainerContext)
  const [fallbackId, setFallbackId] = useState<string | null>(null)

  const activeId = context ? context.activeId : fallbackId
  const setActiveId = context ? context.setActiveId : setFallbackId

  const isOpen = activeId === explainerId

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
    placement: 'bottom' | 'top'
  }>({
    top: 0,
    left: 0,
    width: 310,
    placement: 'bottom',
  })

  const explanation: MetricExplanation | undefined =
    (metricKey && DEMO_EXPLANATIONS[metricKey]) ||
    (customExplanation as MetricExplanation) ||
    undefined

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth || 1024
    const viewportHeight = window.innerHeight || 768

    // Constrain width to 310px on desktop or viewport minus 24px on mobile
    const popoverWidth = Math.min(310, Math.max(260, viewportWidth - 24))

    // Horizontal positioning:
    // Try aligning with trigger left, but guarantee at least 12px margins from edges
    let left = triggerRect.left
    if (left + popoverWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - popoverWidth - 12)
    }
    if (left < 12) {
      left = 12
    }

    // Vertical positioning:
    // Determine whether to place above or below trigger
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const estimatedHeight = 220

    let top: number
    let placement: 'bottom' | 'top' = 'bottom'

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      placement = 'top'
      top = Math.max(12, triggerRect.top - estimatedHeight - 6)
    } else {
      placement = 'bottom'
      top = triggerRect.bottom ? triggerRect.bottom + 6 : triggerRect.top + 24
    }

    // jsdom fallback when bounding rect values are 0
    if (triggerRect.top === 0 && triggerRect.bottom === 0 && triggerRect.left === 0) {
      top = 40
      left = 16
      placement = 'bottom'
    }

    setCoords({ top, left, width: popoverWidth, placement })
  }, [])

  // Mutual exclusion when outside provider (standalone / isolated tests)
  useEffect(() => {
    if (context) return
    const handleOtherOpen = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail !== explainerId) {
        setFallbackId(null)
      }
    }
    window.addEventListener('demo-explainer-open', handleOtherOpen)
    return () => window.removeEventListener('demo-explainer-open', handleOtherOpen)
  }, [context, explainerId])

  // Recalculate position on open, window resize, and scroll
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen, updatePosition])

  // Close on outside pointer click and on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (popoverRef.current && popoverRef.current.contains(target)) return
      if (triggerRef.current && triggerRef.current.contains(target)) return
      setActiveId(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveId(null)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, setActiveId])

  if (!explanation) return null

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextState = !isOpen
    if (nextState) {
      if (!context && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('demo-explainer-open', { detail: explainerId }))
      }
      setActiveId(explainerId)
    } else {
      setActiveId(null)
    }
  }

  const closeExplainer = () => {
    setActiveId(null)
    triggerRef.current?.focus()
  }

  return (
    <div className="demo-explainer-wrapper" style={{ display: 'inline-block', position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? dialogId : undefined}
        aria-label={`Learn what ${explanation.label} means in this demo`}
        title={`Click to understand ${explanation.label}`}
        className="demo-explainer-trigger"
        style={{
          background: isOpen ? 'rgba(23, 168, 229, 0.18)' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${isOpen ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)'}`,
          color: isOpen ? 'var(--accent-blue)' : 'var(--text-muted)',
          borderRadius: '4px',
          padding: compact ? '2px 5px' : '2px 6px',
          fontSize: '9px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          transition: 'all var(--transition-fast)',
          lineHeight: '1.2',
        }}
      >
        <span style={{ fontSize: '10px' }}>ℹ</span>
        <span>What this means</span>
      </button>

      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            id={dialogId}
            className="demo-explainer-card card-base"
            role="dialog"
            aria-label={`${explanation.label} explanation`}
            style={
              {
                '--card-theme': '23, 168, 229',
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 9999,
                width: `${coords.width}px`,
                maxWidth: 'calc(100vw - 24px)',
                padding: '12px 14px',
                background: '#0a1a2f',
                border: '1px solid rgba(23, 168, 229, 0.35)',
                borderRadius: '8px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(23, 168, 229, 0.2)',
                textAlign: 'left',
                animation: 'fadeIn 0.15s ease-out',
              } as React.CSSProperties
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    background: 'rgba(23, 168, 229, 0.15)',
                    color: 'var(--accent-blue)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Metric
                </span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }}>
                  {explanation.label}
                </span>
              </div>
              <button
                type="button"
                onClick={closeExplainer}
                aria-label="Close explanation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: 1,
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: 'var(--accent-blue)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  What it means
                </span>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-navy)',
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  {explanation.whatItMeans}
                </p>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: 'var(--accent-orange)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Why you see this
                </span>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  {explanation.whyYouSeeThis}
                </p>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: 'var(--accent-green)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Decision impact
                </span>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  {explanation.decisionImpact}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
