import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, render } from '@testing-library/react'
import AvatarCropModal from '../components/avatar/AvatarCropModal'

describe('AvatarCropModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:http://localhost:5173/mock-avatar-blob'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  const dummyFile = new File(['dummy content'], 'profile.jpg', { type: 'image/jpeg' })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AvatarCropModal
        isOpen={false}
        imageFile={dummyFile}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders modal with circular preview and controls when isOpen is true', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        imageFile={dummyFile}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Set Your Profile Photo')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /avatar preview/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Zoom level' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Photo' })).toBeInTheDocument()
  })

  it('triggers onClose when Cancel button is clicked', () => {
    const onCloseMock = vi.fn()
    const onSaveMock = vi.fn()

    render(
      <AvatarCropModal
        isOpen={true}
        imageFile={dummyFile}
        onClose={onCloseMock}
        onSave={onSaveMock}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCloseMock).toHaveBeenCalledTimes(1)
    expect(onSaveMock).not.toHaveBeenCalled()
  })

  it('triggers onClose when Escape key is pressed', () => {
    const onCloseMock = vi.fn()
    const onSaveMock = vi.fn()

    render(
      <AvatarCropModal
        isOpen={true}
        imageFile={dummyFile}
        onClose={onCloseMock}
        onSave={onSaveMock}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCloseMock).toHaveBeenCalledTimes(1)
    expect(onSaveMock).not.toHaveBeenCalled()
  })

  it('updates zoom when Zoom In button is clicked', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        imageFile={dummyFile}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    )

    const slider = screen.getByRole('slider', { name: 'Zoom level' }) as HTMLInputElement
    expect(slider.value).toBe('1')

    const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' })
    fireEvent.click(zoomInBtn)

    expect(slider.value).toBe('1.1')
    expect(screen.getByText('1.1x')).toBeInTheDocument()
  })

  it('shows saving spinner and disables buttons when isSaving is true', () => {
    render(
      <AvatarCropModal
        isOpen={true}
        imageFile={dummyFile}
        onClose={vi.fn()}
        onSave={vi.fn()}
        isSaving={true}
      />
    )

    expect(screen.getByText(/saving photo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /saving photo/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
