import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AnalyticsCharts from '../AnalyticsCharts'
import { SIDEBAR_ITEMS } from '../../../config/sidebar'
import { FEATURE_PERMISSIONS } from '../../../config/permissions'
import { ROLES } from '../../../config/roles'
import { ROUTES } from '../../../config/routes'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../performance/hooks/useSystemPerformance', () => ({
  useSystemPerformance: () => ({
    plants: [],
    loading: false,
    summary: null,
  }),
}))

describe('Site Survey Permission & Navigation Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifies permissions.ts restricts site-survey strictly to VENDOR and ADMIN (Case B)', () => {
    const siteSurveyPerms = FEATURE_PERMISSIONS['site-survey']
    expect(siteSurveyPerms).toBeDefined()
    expect(siteSurveyPerms.roles).toContain(ROLES.VENDOR)
    expect(siteSurveyPerms.roles).toContain(ROLES.ADMIN)
    expect(siteSurveyPerms.roles).not.toContain(ROLES.CUSTOMER)
  })

  it('customer sidebar configuration does NOT expose Site Survey in navigation', () => {
    // Check all groups in SIDEBAR_ITEMS
    const allItems = SIDEBAR_ITEMS.flatMap((group) => group.items)
    const siteSurveyItem = allItems.find((item) => item.id === 'site-survey' || item.route === ROUTES.SITE_SURVEY)

    // Customer sidebar must not have site-survey
    expect(siteSurveyItem).toBeUndefined()
  })

  it('renders "View Assessment →" button and routes customer to Roof Vision AI (ROUTES.ROOF_ANALYSIS)', () => {
    const mockData: any = {
      project: null,
      stats: { total_customers: 0, total_capacity_kw: 0, avg_bill: 0 },
      recentBills: [],
      recentSurveys: [],
    }
    const mockDerived: any = {
      isFreshUser: true,
      isSamplePreview: false,
      monthlyBill: null,
      monthlyUnits: null,
      recommendedKw: null,
      annualSavings: null,
      lifetimeSavings: null,
      paybackYears: null,
      productionKwh: null,
      roiPercent: null,
      readinessPercent: null,
      completedSteps: 0,
      totalSteps: 5,
      activities: [],
    }

    render(
      <MemoryRouter>
        <AnalyticsCharts data={mockData} derived={mockDerived} loading={false} />
      </MemoryRouter>
    )

    const viewAssessmentBtn = screen.getByRole('button', { name: /view assessment →/i })
    expect(viewAssessmentBtn).toBeInTheDocument()

    fireEvent.click(viewAssessmentBtn)

    // Critical assertion: must navigate to ROUTES.ROOF_ANALYSIS (/app/roof-analysis), NOT ROUTES.SITE_SURVEY (/app/site-survey)
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.ROOF_ANALYSIS)
    expect(mockNavigate).not.toHaveBeenCalledWith(ROUTES.SITE_SURVEY)
  })
})
