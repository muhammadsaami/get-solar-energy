import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AnalyticsCharts from '../../components/dashboard/AnalyticsCharts'
import { ComponentHealthCard } from '../components/ComponentHealthCard'
import { PostInstallationAnalyticsSection } from '../components/PostInstallationAnalyticsSection'
import type { DashboardDerived } from '../../utils/dashboard'
import type { CustomerDashboardData } from '../../hooks/useCustomerDashboard'
import type { PerformanceSummary, PerformanceCharts } from '../types/performance.types'

const mockUseSystemPerformance = vi.fn()

vi.mock('../hooks/useSystemPerformance', () => ({
  useSystemPerformance: () => mockUseSystemPerformance(),
}))

const mockDerived: DashboardDerived = {
  monthlyBill: 2500,
  monthlyUnits: 300,
  recommendedKw: 2.5,
  annualSavings: 27000,
  lifetimeSavings: 675000,
  systemCost: 137500,
  paybackYears: 3.2,
  productionKwh: 300,
  roofSystemKw: 2.5,
  roiPercent: 120,
  readinessPercent: 75,
  completedSteps: 3,
  totalSteps: 4,
  activities: [],
}

const mockCustomerData: CustomerDashboardData = {
  ready: true,
  loading: false,
  error: null,
  stats: {},
  analytics: {},
  recentBills: [],
  analysis: { bill: {}, solar: null, roof: {}, roi: {}, roiChart: [] },
  journey: { bill: true, roof: true, roi: true, proposal: false, installation: false },
}

describe('Post-Installation Data Integrity & Gatekeeper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Pre-Installation Assessment Mode when customer has NO installed plant (plants.length === 0)', () => {
    mockUseSystemPerformance.mockReturnValue({
      plants: [],
      activePlant: null,
      selectedPlantId: null,
      summary: null,
      charts: null,
      alerts: [],
      loading: false,
      syncing: false,
      error: null,
      lastUpdated: null,
      stale: false,
      refresh: vi.fn(),
      syncTelemetry: vi.fn(),
      acknowledgeAlert: vi.fn(),
    })

    render(
      <MemoryRouter>
        <AnalyticsCharts data={mockCustomerData} derived={mockDerived} loading={false} />
      </MemoryRouter>
    )

    // Verify Pre-Installation Mode
    expect(screen.getByText('PRE-INSTALLATION')).toBeInTheDocument()
    expect(screen.getByText('ASSESSMENT MODE')).toBeInTheDocument()
    expect(screen.getByText(/Your solar system has not been commissioned yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Assessment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View AI Proposal/i })).toBeInTheDocument()

    // Verify NOT INSTALLED badge on post-installation analytics
    expect(screen.getByText('NOT INSTALLED')).toBeInTheDocument()

    // Assert NO fake operational telemetry is rendered
    expect(screen.queryByText(/No outages in the last 30 days/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/₹2,984/)).not.toBeInTheDocument()
    expect(screen.queryByText(/₹12,450/)).not.toBeInTheDocument()
  })

  it('renders ComponentHealthCard with Telemetry unavailable for unmonitored sensors without inventing fake numbers', () => {
    const partialHealth = {
      inverterHealth: 92,
      panelHealth: 92,
      batteryHealth: null,
      wiringHealth: null,
      overallHealth: 92,
      healthLabel: 'OPTIMAL',
    }

    render(
      <ComponentHealthCard metrics={partialHealth} loading={false} />
    )

    expect(screen.getAllByText(/92%/)[0]).toBeInTheDocument()
    expect(screen.getByText('OPTIMAL')).toBeInTheDocument()

    // Battery and Wiring should show Telemetry unavailable rather than synthetic 95% or 98%
    const unavailElements = screen.getAllByText('Telemetry unavailable')
    expect(unavailElements.length).toBe(2)
  })

  it('renders PostInstallationAnalyticsSection without demo fallbacks when telemetry is absent', () => {
    render(
      <MemoryRouter>
        <PostInstallationAnalyticsSection
          summary={null}
          charts={null}
          hasPlant={false}
          loading={false}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('NOT INSTALLED')).toBeInTheDocument()
    expect(screen.getByText('Performance Analytics Standing By')).toBeInTheDocument()
    expect(screen.queryByText('₹2,984')).not.toBeInTheDocument()
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
  })

  it('renders live telemetry when customer has an installed plant with real performance data', () => {
    const mockSummary: PerformanceSummary = {
      generation: {
        solarGenerated: 120,
        dailyGeneration: 4.0,
        monthlyGeneration: 120,
        systemSizeKw: 3.0,
        monthlyGenerationTrend: [100, 110, 120],
      },
      consumption: {
        solarConsumed: 90,
        monthlyConsumption: 110,
        selfConsumptionPct: 75,
      },
      grid: {
        importUnits: 20,
        exportUnits: 30,
        netExport: 10,
        gridDependencyPct: 25,
      },
      efficiency: {
        prRatio: 88,
        systemEfficiency: null,
        performanceRating: 'Excellent',
      },
      health: {
        inverterHealth: 90,
        panelHealth: 90,
        batteryHealth: null,
        wiringHealth: null,
        overallHealth: 90,
        healthLabel: 'OPTIMAL',
      },
    }

    const mockCharts: PerformanceCharts = {
      energyProduction: [{ month: 'May', value: 120 }],
      electricityConsumption: [{ month: 'May', value: 110 }],
      solarGenVsConsumption: [],
      importExport: [],
      prRatio: [{ month: 'May', value: 88 }],
      carbonReduction: [],
    }

    mockUseSystemPerformance.mockReturnValue({
      plants: [{ id: 1, capacity_kw: 3.0, city: 'Delhi', status: 'active' }],
      activePlant: { id: 1, capacity_kw: 3.0, city: 'Delhi', status: 'active' },
      selectedPlantId: 1,
      summary: mockSummary,
      charts: mockCharts,
      alerts: [],
      loading: false,
      syncing: false,
      error: null,
      lastUpdated: '2026-08-26T10:00:00Z',
      stale: false,
      refresh: vi.fn(),
      syncTelemetry: vi.fn(),
      acknowledgeAlert: vi.fn(),
    })

    render(
      <MemoryRouter>
        <AnalyticsCharts data={mockCustomerData} derived={mockDerived} loading={false} />
      </MemoryRouter>
    )

    // Operational Cards are mounted with verified live metrics
    expect(screen.getByText('LIVE TELEMETRY')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument() // dailyGeneration
    expect(screen.getByText('⚡ 120 kWh')).toBeInTheDocument() // monthly generation
  })
})
