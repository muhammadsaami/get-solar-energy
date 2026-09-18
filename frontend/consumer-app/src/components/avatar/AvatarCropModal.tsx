import React, { useState, useEffect, useRef, useCallback } from 'react'
import { clampOffset, getBaseScale, createCroppedImageFile } from '../../utils/imageCrop'

export interface AvatarCropModalProps {
  isOpen: boolean
  imageFile: File | null
  onClose: () => void
  onSave: (croppedFile: File) => Promise<void> | void
  isSaving?: boolean
}

const CROP_SIZE = 240 // diameter of crop preview in px

export default function AvatarCropModal({
  isOpen,
  imageFile,
  onClose,
  onSave,
  isSaving = false,
}: AvatarCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1.0)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dragStartRef = useRef<{ startX: number; startY: number; initialOffsetX: number; initialOffsetY: number } | null>(null)
  const imageElementRef = useRef<HTMLImageElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  // Load image file into an object URL
  useEffect(() => {
    if (!isOpen || !imageFile) {
      setImageSrc(null)
      setImageDims({ width: 0, height: 0 })
      setZoom(1.0)
      setOffset({ x: 0, y: 0 })
      setErrorMessage(null)
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setImageSrc(objectUrl)
    setZoom(1.0)
    setOffset({ x: 0, y: 0 })
    setErrorMessage(null)

    const img = new Image()
    img.onload = () => {
      setImageDims({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = objectUrl

    return () => {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [isOpen, imageFile])

  // Focus management & Escape key handling
  useEffect(() => {
    if (!isOpen) return

    const previousActive = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose()
        return
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    setTimeout(() => saveButtonRef.current?.focus(), 100)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActive && typeof previousActive.focus === 'function') {
        previousActive.focus()
      }
    }
  }, [isOpen, isSaving, onClose])

  // Compute scale & clamped coordinates
  const baseScale = imageDims.width > 0 && imageDims.height > 0 ? getBaseScale(imageDims, CROP_SIZE) : 1
  const renderedWidth = imageDims.width * baseScale * zoom
  const renderedHeight = imageDims.height * baseScale * zoom
  const clamped = clampOffset(offset, imageDims, CROP_SIZE, zoom)

  // Zoom handlers
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1.0, Math.min(3.0, newZoom))
    setZoom(clampedZoom)
    setOffset((prev) => clampOffset(prev, imageDims, CROP_SIZE, clampedZoom))
  }

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSaving || !imageDims.width) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: clamped.x,
      initialOffsetY: clamped.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return
    e.preventDefault()
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    const nextOffset = {
      x: dragStartRef.current.initialOffsetX + dx,
      y: dragStartRef.current.initialOffsetY + dy,
    }
    setOffset(clampOffset(nextOffset, imageDims, CROP_SIZE, zoom))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Safe fallback
      }
      setIsDragging(false)
      dragStartRef.current = null
    }
  }

  // Save handler
  const handleSaveClick = async () => {
    if (!imageElementRef.current || !imageDims.width || isSaving) return
    setErrorMessage(null)
    try {
      const croppedFile = await createCroppedImageFile(
        imageElementRef.current,
        { x: clamped.x, y: clamped.y, zoom },
        CROP_SIZE,
        512,
        'avatar.jpg',
        'image/jpeg',
        0.92
      )
      await onSave(croppedFile)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save cropped photo. Please try again.'
      setErrorMessage(msg)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay active glass-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6, 15, 31, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="card-glass modal-animate-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#08172C',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          padding: '24px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2
            id="crop-modal-title"
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}
          >
            Set Your Profile Photo
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close crop dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94A3B8)',
              fontSize: '20px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              padding: '6px',
              borderRadius: '6px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Concise Instructional Text */}
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '13px',
            color: 'var(--text-muted, #94A3B8)',
            lineHeight: '1.4',
          }}
        >
          Drag the photo to position it. Use the slider to zoom so it fits naturally.
        </p>

        {/* Circular Crop Frame Area */}
        <div
          style={{
            position: 'relative',
            width: `${CROP_SIZE}px`,
            height: `${CROP_SIZE}px`,
            margin: '8px auto 16px auto',
            borderRadius: '50%',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            border: '2px solid var(--color-cyan, #17A8E5)',
            boxShadow: '0 0 28px rgba(23, 168, 229, 0.35)',
            backgroundColor: '#060F1F',
            touchAction: 'none',
            userSelect: 'none',
            flexShrink: 0,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="region"
          aria-label="Avatar preview. Drag to adjust position."
          tabIndex={0}
        >
          {imageSrc ? (
            <img
              ref={imageElementRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${renderedWidth}px`,
                height: `${renderedHeight}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(calc(-50% + ${clamped.x}px), calc(-50% + ${clamped.y}px))`,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted, #94A3B8)',
                fontSize: '13px',
              }}
            >
              Loading photo…
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '4px 8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.1)}
            disabled={zoom <= 1.0 || isSaving}
            aria-label="Zoom out"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 700,
              cursor: zoom <= 1.0 || isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: zoom <= 1.0 ? 0.4 : 1,
              transition: 'all 150ms ease',
            }}
          >
            −
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              disabled={isSaving}
              aria-label="Zoom level"
              style={{
                width: '100%',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                accentColor: 'var(--color-cyan, #17A8E5)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.1)}
            disabled={zoom >= 3.0 || isSaving}
            aria-label="Zoom in"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 700,
              cursor: zoom >= 3.0 || isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: zoom >= 3.0 ? 0.4 : 1,
              transition: 'all 150ms ease',
            }}
          >
            +
          </button>
        </div>

        {/* Error message banner if save fails */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '14px',
              fontSize: '12px',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions Footer */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn btn-secondary"
            style={{
              minHeight: '44px',
              minWidth: '100px',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            ref={saveButtonRef}
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving || !imageDims.width}
            className="btn btn-primary"
            style={{
              minHeight: '44px',
              minWidth: '130px',
              padding: '10px 22px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSaving || !imageDims.width ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, var(--color-blue, #17A8E5) 0%, #0D82B9 100%)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 14px rgba(23, 168, 229, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {isSaving ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Saving photo...
              </>
            ) : (
              'Save Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
