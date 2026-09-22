import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoofSuitabilityScene from '../RoofSuitabilityScene'
import { ROOF_VISION_RELEASED } from '../../../config/release'

vi.mock('../../../hooks/useSceneVisibility', () => ({
  useSceneVisibility: () => ({ current: null }),
}))

if (typeof IntersectionObserver === 'undefined') {
  class StubObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', StubObserver)
}

const BANNED_ACTIVE_VERBS = [
  'Analyze your roof now',
  'Upload your roof',
  'Get your AI roof report',
  'Instantly analyze your roof',
  'Start Roof Vision',
  'Generate your roof analysis',
]

describe('RoofSuitabilityScene coming-soon teaser', () => {
  it('renders the Roof Vision section', () => {
    render(<RoofSuitabilityScene />)
    expect(screen.getByRole('heading', { name: /Roof Vision AI/i })).toBeInTheDocument()
  })

  it('shows a Coming Soon indicator', () => {
    render(<RoofSuitabilityScene />)
    const badges = screen.getAllByText(/Coming Soon/i)
    expect(badges.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/✨ Coming Soon/)).toBeInTheDocument()
  })

  it('copy communicates future availability', () => {
    render(<RoofSuitabilityScene />)
    const text = document.body.textContent || ''
    expect(text).toMatch(/coming soon/i)
    expect(text).toMatch(/Planned AI insights/i)
    for (const phrase of BANNED_ACTIVE_VERBS) {
      expect(text).not.toContain(phrase)
    }
  })

  it('capability cards read as planned insights without metric values', () => {
    render(<RoofSuitabilityScene />)
    for (const label of ['Solar Irradiance', 'Obstruction Analysis', 'Compass Azimuth', 'Generation Yield']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    const text = document.body.textContent || ''
    expect(text).not.toMatch(/highly accurate/i)
  })

  it('existing released CTA still targets the installation section', () => {
    render(<RoofSuitabilityScene />)
    const cta = screen.getByRole('link', { name: /Explore Installation/i })
    expect(cta).toHaveAttribute('href', '#sceneInstallation')
  })

  it('ROOF_VISION_RELEASED remains false', () => {
    expect(ROOF_VISION_RELEASED).toBe(false)
  })
})
