import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FooterGrid from '../FooterGrid'
import { ROUTES } from '../../../config/routes'
import * as referralUtils from '../../../utils/referral'
import { fetchAnalytics } from '../../../services/reward.service'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockAddToast = vi.fn()
vi.mock('../../../stores/notificationStore', () => ({
  useNotificationStore: (sel: any) => sel({ addToast: mockAddToast }),
}))

vi.mock('../../../utils/referral', async () => {
  const actual = await vi.importActual('../../../utils/referral')
  return {
    ...actual,
    getUser: vi.fn(),
    copyReferralCode: vi.fn(),
    copyReferralLink: vi.fn(),
  }
})

vi.mock('../../../services/reward.service', () => ({
  fetchAnalytics: vi.fn(),
}))

const mockGetUser = vi.mocked(referralUtils.getUser)
const mockCopyCode = vi.mocked(referralUtils.copyReferralCode)
const mockCopyLink = vi.mocked(referralUtils.copyReferralLink)
const mockFetchAnalytics = vi.mocked(fetchAnalytics)

function renderGrid() {
  return render(
    <MemoryRouter>
      <FooterGrid />
    </MemoryRouter>,
  )
}

describe('FooterGrid Engagement & Community', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockReturnValue({ id: 1, email: 'cust@test.com', name: 'Test', referral_code: 'TEST-123' })
    mockFetchAnalytics.mockResolvedValue({ success: true } as any)
  })

  it('renders the section and YOUR SOLAR JOURNEY card with headline and CTA', () => {
    renderGrid()
    expect(screen.getByText(/engagement & community/i)).toBeInTheDocument()
    expect(screen.getByText(/your solar journey/i)).toBeInTheDocument()
    expect(screen.getByText(/your roof has potential/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get my solar plan/i })).toBeInTheDocument()
  })

  it('CTA navigates to ROUTES.ROI_CALCULATOR', () => {
    renderGrid()
    fireEvent.click(screen.getByRole('button', { name: /get my solar plan/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.ROI_CALCULATOR)
  })

  it('renders the referral code and copy actions', () => {
    renderGrid()
    expect(screen.getByText('TEST-123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy referral promo code/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy referral link/i })).toBeInTheDocument()
  })

  it('Copy Code invokes existing copy logic and toast', async () => {
    mockCopyCode.mockResolvedValue(true)
    renderGrid()
    fireEvent.click(screen.getByRole('button', { name: /copy referral promo code/i }))
    await waitFor(() => {
      expect(mockCopyCode).toHaveBeenCalledWith('TEST-123')
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      )
    })
  })

  it('Copy Link invokes existing copy logic and toast', async () => {
    mockCopyLink.mockResolvedValue(true)
    renderGrid()
    fireEvent.click(screen.getByRole('button', { name: /copy referral link/i }))
    await waitFor(() => {
      expect(mockCopyLink).toHaveBeenCalledWith('TEST-123')
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      )
    })
  })

  it('renders real referral totals from analytics', async () => {
    mockFetchAnalytics.mockResolvedValue({
      success: true,
      summary: { total_referrals: 7, completed_referrals: 5, pending_referrals: 2, total_points: 350, wallet_balance_rs: 0 },
    } as any)
    renderGrid()
    await waitFor(() => {
      expect(screen.getByText('Total Referrals')).toBeInTheDocument()
      expect(screen.getByText('Reward Points')).toBeInTheDocument()
    })
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('350')).toBeInTheDocument()
  })

  it('analytics failure renders fallback flow with no fabricated metrics', async () => {
    mockFetchAnalytics.mockRejectedValue(new Error('offline'))
    renderGrid()
    await waitFor(() => {
      expect(screen.getByText('Refer')).toBeInTheDocument()
    })
    expect(screen.getByText('Share')).toBeInTheDocument()
    expect(screen.getByText('Verified Installation')).toBeInTheDocument()
    expect(screen.getByText('Reward')).toBeInTheDocument()
    expect(screen.queryByText('Total Referrals')).not.toBeInTheDocument()
    // Referral functionality still intact
    expect(screen.getByText('TEST-123')).toBeInTheDocument()
    expect(mockAddToast).not.toHaveBeenCalled()
  })

  it('missing customer email skips analytics but renders fallback', async () => {
    mockGetUser.mockReturnValue({ id: 1, email: '', name: 'Test', referral_code: '' })
    renderGrid()
    await waitFor(() => {
      expect(screen.getByText('Verified Installation')).toBeInTheDocument()
    })
    expect(mockFetchAnalytics).not.toHaveBeenCalled()
    expect(screen.getByText('Awaiting Profile Sync')).toBeInTheDocument()
  })

  it('resolves existing image assets and introduces no Microsoft UI', () => {
    renderGrid()
    const banner = screen.getByAltText(/rooftop solar panel installation/i) as HTMLImageElement
    expect(banner.getAttribute('src')).toBe('/assets/solar_roof_banner.png')
    const gift = document.querySelector('img[src="/assets/gift_box.png"]')
    expect(gift).toBeInTheDocument()
    expect(screen.queryByText(/microsoft/i)).not.toBeInTheDocument()
  })
})
