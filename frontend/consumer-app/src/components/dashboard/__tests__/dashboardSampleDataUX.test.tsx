import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import { deriveDashboard } from '../../../utils/dashboard'
import LiveSummaryPanel from '../LiveSummaryPanel'
import KPIGrid from '../KPIGrid'
import type { CustomerDashboardData } from '../../../hooks/useCustomerDashboard'

const createEmptyDashboardData = (): CustomerDashboardData => ({
  ready: true,
  loading: false,
  error: null,
  stats: {
    avg_bill: 2848,
    avg_units: 350,
    avg_system_size: 2.65,
    avg_payback: 2.4,
  },
  analytics: {},
  recentBills: [],
  analysis: {
    bill: null,
    solar: null,
    roof: null,
    roi: null,
    roiChart: [],
  },
  journey: {
    bill: false,
    roof: false,
    roi: false,
    proposal: false,
    installation: false,
  },
})

describe('Dashboard Fresh User Isolation & Explicit Demo Mode', () => {
  it('identifies fresh user with isFreshUser: true and null metrics by default', () => {
    const data = createEmptyDashboardData()
    const derived = deriveDashboard(data, false)

    expect(derived.isFreshUser).toBe(true)
    expect(derived.isSamplePreview).toBe(false)
    expect(derived.monthlyBill).toBeNull()
    expect(derived.annualSavings).toBeNull()
    expect(derived.recommendedKw).toBeNull()
    expect(derived.paybackYears).toBeNull()
    expect(derived.readinessPercent).toBeNull()
  })

  it('provides sample preview data only when isDemoMode is explicitly true', () => {
    const data = createEmptyDashboardData()
    const derived = deriveDashboard(data, true)

    expect(derived.isFreshUser).toBe(false)
    expect(derived.isSamplePreview).toBe(true)
    expect(derived.monthlyBill).toBe(2848)
    expect(derived.annualSavings).toBe(91800)
    expect(derived.recommendedKw).toBe(3)
    expect(derived.paybackYears).toBe(2.7)
  })

  it('sets isFreshUser to false and uses real bill data when analysis exists', () => {
    const data = createEmptyDashboardData()
    data.analysis.bill = {
      bill_amount: 5200,
      monthly_units: 600,
      recommended_kw: 4.5,
      monthly_savings_rs: 4680,
    }

    const derived = deriveDashboard(data, false)

    expect(derived.isFreshUser).toBe(false)
    expect(derived.isSamplePreview).toBe(false)
    expect(derived.monthlyBill).toBe(5200)
    expect(derived.monthlyUnits).toBe(600)
    expect(derived.recommendedKw).toBe(4.5)
  })

  it('renders fresh user empty state banner, CTA, and See Example Dashboard button', () => {
    const data = createEmptyDashboardData()
    const derived = deriveDashboard(data, false)

    renderWithProviders(
      <LiveSummaryPanel
        loading={false}
        derived={derived}
        journey={data.journey}
        isDemoMode={false}
        onToggleDemo={() => {}}
      />
    )

    // Fresh user message
    expect(
      screen.getByText(
        'Your personalized solar insights will appear here after you analyze your electricity usage.'
      )
    ).toBeInTheDocument()

    // Primary CTA
    const primaryCta = screen.getByRole('link', { name: /Analyze your electricity bill/i })
    expect(primaryCta).toBeInTheDocument()
    expect(primaryCta.getAttribute('href')).toBe('/app/bill-analyzer')

    // Secondary CTA
    expect(screen.getByRole('button', { name: /See Example Dashboard/i })).toBeInTheDocument()
  })

  it('renders DEMO — SAMPLE DATA — NOT YOUR DATA banner when demo mode is active', () => {
    const data = createEmptyDashboardData()
    const derived = deriveDashboard(data, true)

    renderWithProviders(
      <LiveSummaryPanel
        loading={false}
        derived={derived}
        journey={data.journey}
        isDemoMode={true}
        onToggleDemo={() => {}}
      />
    )

    expect(screen.getByText('DEMO — SAMPLE DATA — NOT YOUR DATA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exit Demo/i })).toBeInTheDocument()
  })

  it('KPIGrid displays Sample Preview footers when derived.isSamplePreview is true in demo mode', () => {
    const data = createEmptyDashboardData()
    const derived = deriveDashboard(data, true)

    renderWithProviders(<KPIGrid loading={false} derived={derived} />)

    const pills = screen.getAllByText('Sample Preview')
    expect(pills.length).toBe(2)
  })

  it('KPIGrid displays Awaiting Data footers and dashes when user is fresh and not in demo mode', () => {
    const data = createEmptyDashboardData()
    const derived = deriveDashboard(data, false)

    renderWithProviders(<KPIGrid loading={false} derived={derived} />)

    const pills = screen.getAllByText('Awaiting Data')
    expect(pills.length).toBe(2)
  })
})
