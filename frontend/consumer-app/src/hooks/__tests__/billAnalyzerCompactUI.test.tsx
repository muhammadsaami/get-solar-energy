import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import BillAnalyzer from '../../pages/BillAnalyzer'
import * as billAnalyzerHook from '../useBillAnalyzer'
import type { BillAnalysisData, SolarReportData } from '../billAnalyzer.types'

vi.mock('../../components/dashboard/DashboardSprites', () => ({
  default: () => <div data-testid="dashboard-sprites" />,
}))

const mockQuotas = {
  upload: { remaining: 2, limit: 3, reset_hours: 24 },
  manual: { remaining: 4, limit: 5, reset_hours: 24 },
  source: 'auth' as const,
}

const mockAnalysis: BillAnalysisData = {
  customer_name: 'Saami Haq',
  consumer_number: '1029384756',
  discom: 'TPDDL Delhi',
  billing_period: 'May 2026',
  monthly_units: 343,
  bill_amount: 335,
  per_unit_rate: 0.98,
  sanctioned_load_kw: 3.0,
  recommended_kw: 3.0,
  monthly_generation_units: 405,
  monthly_savings_rs: 330,
  system_cost_rs: 165000,
  subsidy_rs: 78000,
  net_cost_rs: 87000,
  payback_years: 3.0,
  savings_25_years_rs: 99000,
  monthlySolarGeneration: 405,
  annualSolarGeneration: 4860,
  solarUsedDirectly: 240,
  solarExportedToGrid: 165,
  solarOffsetPercent: 98,
  gridDependency: 103,
  netMeteringBenefit: 330,
  isSolarConsumer: true,
  importUnits: 343,
  exportUnits: 165,
  netConsumption: 178,
  netMeteringCredit: 160,
  extractionConfidence: {
    score: 95,
    label: 'High Confidence',
    badgeClass: 'conf-high',
  },
  billHealth: {
    score: 88,
    rating: 'Optimal',
  },
  solarOpportunity: {
    score: 94,
    rating: 'Prime Opportunity',
  },
}

const mockSolarReport: SolarReportData = {
  productionKwh: 446.7,
  systemSizeKw: 3.6,
  month: 'May',
  year: 2026,
  source: 'SolarEdge App',
  generationValues: [446.7],
}

describe('Bill Analyzer Compact UI & Above-The-Fold Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders primary KPI cards and empty states in initial view before upload', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: null,
      solarReport: null,
      unifiedEnergy: null,
      billUploadState: 'idle',
      solarUploadState: 'NOT_PROVIDED',
      billProgress: { percent: 0, status: '' },
      solarProgress: { percent: 0, status: '' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Primary KPI cards immediately visible with empty state fallbacks
    const billAmountEl = document.getElementById('billTabCurrentBill')
    const unitsEl = document.getElementById('billTabUnits')
    const savingsEl = document.getElementById('billTabSavings')

    expect(billAmountEl).toHaveTextContent('—')
    expect(unitsEl).toHaveTextContent('—')
    expect(savingsEl).toHaveTextContent('—')

    // Initial dropzones visible
    expect(screen.getByText(/Drag & drop your electricity bill here/i)).toBeInTheDocument()
    expect(screen.getByText(/Upload Solar Production Report/i)).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 3 left today/i)).toBeInTheDocument()
  })

  it('renders compact verified states for Bill Upload and Solar Report after extraction', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: mockAnalysis,
      solarReport: mockSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Primary KPIs immediately visible above the fold with verified figures
    expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('₹335')
    expect(document.getElementById('billTabUnits')).toHaveTextContent('343 kWh')
    expect(document.getElementById('billTabSavings')).toHaveTextContent('₹330/mo')

    // Compact verified status cards rendered
    expect(screen.getByText('Bill Verified & Extracted')).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 3 uploads remaining today/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload Another Bill/i })).toBeInTheDocument()

    // Solar report compact loaded status with dynamic figures
    expect(screen.getByText('Solar Report Loaded')).toBeInTheDocument()
    expect(screen.getByText(/446.7 kWh · 3.6 kW · May 2026/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Replace/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Skip \/ Dismiss/i })).toBeInTheDocument()
  })

  it('collapses secondary analytical sections by default and expands on click with accessibility attributes', async () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: mockAnalysis,
      solarReport: mockSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Verify critical DOM IDs exist
    expect(document.getElementById('billAnalysisResults')).toBeInTheDocument()
    expect(document.getElementById('secPlantPerformance')).toBeInTheDocument()
    expect(document.getElementById('snapSolarPotential')).toBeInTheDocument()
    expect(document.getElementById('res25YearSavings')).toBeInTheDocument()

    // Find the collapsible accordion buttons
    const billDetailsToggle = screen.getByRole('button', { name: /Bill Details & Recommendations/i })
    expect(billDetailsToggle).toHaveAttribute('aria-expanded', 'false')

    // Content container should initially be hidden
    const content = document.getElementById('secBillDetails-content')
    expect(content).toHaveStyle({ display: 'none' })

    // Click to expand
    fireEvent.click(billDetailsToggle)
    expect(billDetailsToggle).toHaveAttribute('aria-expanded', 'true')
    expect(content).toHaveStyle({ display: 'block' })

    // Click to collapse again
    fireEvent.click(billDetailsToggle)
    expect(billDetailsToggle).toHaveAttribute('aria-expanded', 'false')
    expect(content).toHaveStyle({ display: 'none' })
  })

  it('provides compact summary for manual bill submission and allows editing details', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: mockAnalysis,
      solarReport: null,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'NOT_PROVIDED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 0, status: '' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Switch to manual details
    const manualBtn = screen.getByRole('button', { name: /Manual Details/i })
    fireEvent.click(manualBtn)

    // Manual bill verified summary shown
    expect(screen.getByText('Bill Details Verified')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit Details/i })).toBeInTheDocument()

    // Clicking Edit Details reveals the input form
    fireEvent.click(screen.getByRole('button', { name: /Edit Details/i }))
    expect(screen.getByRole('button', { name: /Analyze Bill/i })).toBeInTheDocument()
  })
})

describe('Bill Analyzer Energy Intelligence Model & Formulas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const referenceBillAnalysis: BillAnalysisData = {
    customer_name: 'Saami Haq',
    consumer_number: '1029384756',
    discom: 'TPDDL Delhi',
    billing_period: '01-MAY-2026 to 01-JUN-2026',
    monthly_units: 342.74,
    bill_amount: 334.95,
    per_unit_rate: 0.98,
    recommended_kw: 3.0,
    monthly_generation_units: 405,
    monthly_savings_rs: 330,
    system_cost_rs: 165000,
    payback_years: 3.0,
    savings_25_years_rs: 99000,
    monthlySolarGeneration: 405,
    annualSolarGeneration: 4860,
    solarUsedDirectly: 240,
    solarExportedToGrid: 165,
    solarOffsetPercent: 98,
    gridDependency: 103,
    netMeteringBenefit: 330,
    isSolarConsumer: true,
    importUnits: 342.74,
    exportUnits: 292.89,
    gridImport: 342.74,
    gridExport: 292.89,
    openingSolarSurplus: 211.55,
    closingSolarSurplus: 161.70,
    netBilledUnits: 0.00,
    netConsumption: 49.85,
    netMeteringCredit: 160,
    extractionConfidence: { score: 95, label: 'High Confidence', badgeClass: 'conf-high' },
    billHealth: { score: 88, rating: 'Optimal' },
    solarOpportunity: { score: 94, rating: 'Prime Opportunity' },
    filename: 'electricity_bill.pdf',
  }

  const referenceSolarReport: SolarReportData = {
    productionKwh: 446.7,
    systemSizeKw: 3.6,
    month: 'May',
    year: '2026',
    source: 'Solarman',
  }

  it('renders all 4 primary energy metrics with authoritative values for reference bill', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: referenceSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // 1. Grid Import
    const importEl = document.getElementById('resPrimaryGridImport')
    expect(importEl).toHaveTextContent('342.74 kWh')

    // 2. Grid Export
    const exportEl = document.getElementById('resPrimaryGridExport')
    expect(exportEl).toHaveTextContent('292.89 kWh')

    // 3. Solar Generation
    const genEl = document.getElementById('resPrimarySolarGen')
    expect(genEl).toHaveTextContent('446.70 kWh')

    // 4. Solar Self-Consumption (446.70 - 292.89 = 153.81 kWh)
    const selfConsEl = document.getElementById('resPrimarySelfConsumption')
    expect(selfConsEl).toHaveTextContent('153.81 kWh')
  })

  it('calculates derived energy summary metrics accurately', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: referenceSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // 5. Self-Consumption Rate: 153.81 / 446.70 * 100 ≈ 34.4%
    const rateEl = document.getElementById('resDerivedSelfConsumptionRate')
    expect(rateEl).toHaveTextContent('34.4%')

    // 6. Export Rate: 292.89 / 446.70 * 100 ≈ 65.6%
    const exportRateEl = document.getElementById('resDerivedExportRate')
    expect(exportRateEl).toHaveTextContent('65.6%')

    // 7. Net Grid Energy: 342.74 - 292.89 = 49.85 kWh
    const netGridEl = document.getElementById('resDerivedNetGridEnergy')
    expect(netGridEl).toHaveTextContent('49.85 kWh')
  })

  it('strictly distinguishes Net Grid Energy from Net Billed Units and shows surplus reconciliation', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: referenceSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Opening Solar Surplus
    expect(document.getElementById('resNetMeterOpeningSurplus')).toHaveTextContent('211.55 kWh')

    // Net Grid Energy in Net-Metering block
    expect(document.getElementById('resNetMeterNetGridEnergy')).toHaveTextContent('49.85 kWh')

    // Closing Solar Surplus
    expect(document.getElementById('resNetMeterClosingSurplus')).toHaveTextContent('161.70 kWh')

    // Net Billed Units (MUST be 0.00 kWh, NOT 49.85 kWh)
    const billedUnitsEl = document.getElementById('resNetMeterBilledUnits')
    expect(billedUnitsEl).toHaveTextContent('0.00 kWh')
    expect(billedUnitsEl).not.toHaveTextContent('49.85')

    // Reconciliation formula: 211.55 - 49.85 = 161.70 kWh
    expect(document.getElementById('resNetMeterReconciliation')).toHaveTextContent('211.55 − 49.85 = 161.70 kWh')

    // Financial Current Bill: ₹334.95
    expect(document.getElementById('resFinancialCurrentBill')).toHaveTextContent('₹334.95')
  })

  it('renders unavailable state for derived solar metrics when periods mismatch', () => {
    const mismatchedSolarReport: SolarReportData = {
      productionKwh: 446.7,
      systemSizeKw: 3.6,
      month: 'October', // Mismatches May bill
      year: '2026',
      source: 'Solarman',
    }

    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: mismatchedSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Solar self-consumption and rates should be unavailable (—)
    expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('—')
    expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('—')
    expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('—')

    // Explanatory subtitle shown
    expect(screen.getByText(/Period mismatch: solar report and bill periods differ/i)).toBeInTheDocument()
    expect(screen.getByText(/PERIOD MISMATCH \(October vs Bill\)/i)).toBeInTheDocument()

    // Independent meter values remain visible
    expect(document.getElementById('resPrimaryGridImport')).toHaveTextContent('342.74 kWh')
    expect(document.getElementById('resPrimaryGridExport')).toHaveTextContent('292.89 kWh')
  })

  it('renders available grid metrics and empty solar metrics when only bill is provided', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: null,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'NOT_PROVIDED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 0, status: '' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Grid metrics are present
    expect(document.getElementById('resPrimaryGridImport')).toHaveTextContent('342.74 kWh')
    expect(document.getElementById('resPrimaryGridExport')).toHaveTextContent('292.89 kWh')

    // Solar metrics are unavailable (not fabricated from electricity bill)
    expect(document.getElementById('resPrimarySolarGen')).toHaveTextContent('—')
    expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('—')
    expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('—')
    expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('—')
  })

  it('renders Solar Energy Flow diagram with correct flow pathways', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: referenceSolarReport,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    const flowDiagram = document.getElementById('secSolarEnergyFlow')
    expect(flowDiagram).toBeInTheDocument()
    expect(flowDiagram).toHaveTextContent(/Solar Generation/i)
    expect(flowDiagram).toHaveTextContent(/Direct Self-Consumption/i)
    expect(flowDiagram).toHaveTextContent(/Grid Export/i)
    expect(flowDiagram).toHaveTextContent(/Grid Supply/i)
    expect(flowDiagram).toHaveTextContent(/Powers Home/i)
  })

  it('keeps all 7 supporting accordion sections collapsed by default', () => {
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: referenceBillAnalysis,
      solarReport: referenceSolarReport,
      unifiedEnergy: {
        solarGenerated: 446.7,
        gridImport: 342.74,
        gridExport: 292.89,
        solarUsedDirectly: 153.81,
        selfConsumptionPct: 34.4,
        solarOffsetPct: 130.3,
        gridDependencyPct: 65.6,
        netMeteringBenefit: 878,
      },
      billUploadState: 'complete',
      solarUploadState: 'EXTRACTED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 100, status: 'Done' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: vi.fn(),
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Verify all 7 accordions exist and have aria-expanded="false"
    const accordionNames = [
      /Bill Details & Recommendations/i,
      /Solar Utilization Summary/i,
      /Consumer Profile Summary/i,
      /Plant Performance/i,
      /Unified Energy Summary/i,
      /Bill Health & Cost Driver Analysis/i,
      /Historical Consumption & Potential Savings Trend/i,
    ]

    accordionNames.forEach(name => {
      const btn = screen.getByRole('button', { name })
      expect(btn).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Source-of-Truth Enforcement & Dynamic Calculation Suite', () => {
    // Deliberately distinct fixture A (Non-reference numbers)
    const distinctBillA: BillAnalysisData = {
      customer_name: 'Ananya Sharma',
      consumer_number: '9876543210',
      discom: 'BESCOM Bangalore',
      billing_period: 'July 2026',
      monthly_units: 560.25,
      bill_amount: 4785.50,
      per_unit_rate: 8.54,
      recommended_kw: 5.0,
      monthly_generation_units: 675,
      monthly_savings_rs: 4200,
      system_cost_rs: 275000,
      payback_years: 4.2,
      savings_25_years_rs: 980000,
      monthlySolarGeneration: 675,
      annualSolarGeneration: 8100,
      solarUsedDirectly: 339.75,
      solarExportedToGrid: 340.75,
      solarOffsetPercent: 120.5,
      gridDependency: 220.5,
      netMeteringBenefit: 340.75 * 3.0,
      isSolarConsumer: true,
      importUnits: 560.25,
      exportUnits: 340.75,
      gridImport: 560.25,
      gridExport: 340.75,
      openingSolarSurplus: 150.00,
      closingSolarSurplus: null, // missing!
      netBilledUnits: null, // missing! Must not be 0.00
      netConsumption: 219.50,
      netMeteringCredit: 1022.25,
      extractionConfidence: { score: 98, label: 'High Confidence', badgeClass: 'conf-high' },
      billHealth: { score: 90, rating: 'Excellent' },
      solarOpportunity: { score: 95, rating: 'Prime Opportunity' },
      filename: 'ananya_bescom_bill.pdf',
    }

    const distinctSolarA: SolarReportData = {
      productionKwh: 680.50,
      systemSizeKw: 5.2,
      month: 'July',
      year: 2026,
      source: 'Sungrow',
    }

    // Deliberately distinct fixture B (Different customer and different values)
    const distinctBillB: BillAnalysisData = {
      customer_name: 'Karan Mehra',
      consumer_number: '4567890123',
      discom: 'MSEDCL Mumbai',
      billing_period: 'August 2026',
      monthly_units: 185.40,
      bill_amount: 1450.00,
      per_unit_rate: 7.84,
      recommended_kw: 2.0,
      monthly_generation_units: 270,
      monthly_savings_rs: 1800,
      system_cost_rs: 110000,
      payback_years: 3.5,
      savings_25_years_rs: 430000,
      monthlySolarGeneration: 270,
      annualSolarGeneration: 3240,
      solarUsedDirectly: 150,
      solarExportedToGrid: 120,
      solarOffsetPercent: 100,
      gridDependency: 35,
      netMeteringBenefit: 360,
      isSolarConsumer: false,
      importUnits: 185.40,
      exportUnits: null, // No export
      gridImport: 185.40,
      gridExport: null,
      openingSolarSurplus: null,
      closingSolarSurplus: null,
      netBilledUnits: null,
      netConsumption: 185.00,
      netMeteringCredit: 0,
      extractionConfidence: { score: 92, label: 'High Confidence', badgeClass: 'conf-high' },
      billHealth: { score: 85, rating: 'Good' },
      solarOpportunity: { score: 90, rating: 'Good Candidate' },
      filename: 'karan_bill.pdf',
    }

    it('proves uploaded bill value appears directly from extracted data and differs from another bill (req 1, 2, 8)', () => {
      // Render Bill A
      const { unmount } = render(
        <BillAnalyzer />
      )
      // Spy Bill A
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      unmount()
      const { unmount: unmountA } = render(<BillAnalyzer />)

      // Bill A values
      expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('₹4,785.50')
      expect(document.getElementById('resFinancialCurrentBill')).toHaveTextContent('₹4,785.50')
      expect(document.getElementById('resPrimaryGridImport')).toHaveTextContent('560.25 kWh')

      // Switch to Bill B
      unmountA()
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillB,
        solarReport: null,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'NOT_PROVIDED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 0, status: '' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Bill B values differ completely
      expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('₹1,450')
      expect(document.getElementById('resFinancialCurrentBill')).toHaveTextContent('₹1,450')
      expect(document.getElementById('resPrimaryGridImport')).toHaveTextContent('185.40 kWh')
    })

    it('proves missing values display "—" and are not coerced to zero (req 4, 5)', () => {
      // Bill A has missing closingSolarSurplus and missing netBilledUnits
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Net Billed Units is missing -> displays "—", NOT "0.00 kWh" or "0"
      expect(document.getElementById('resNetMeterBilledUnits')).toHaveTextContent('—')
      expect(document.getElementById('resNetMeterBilledUnits')).not.toHaveTextContent('0.00')

      // Closing surplus is missing -> displays "—"
      expect(document.getElementById('resNetMeterClosingSurplus')).toHaveTextContent('—')
      expect(document.getElementById('resNetMeterClosingSurplus')).not.toHaveTextContent('0.00')
    })

    it('proves Grid Import (req 6) and Grid Export (req 7) are sourced from extracted bill data', () => {
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      expect(document.getElementById('resPrimaryGridImport')).toHaveTextContent('560.25 kWh')
      expect(document.getElementById('resPrimaryGridExport')).toHaveTextContent('340.75 kWh')
    })

    it('proves Solar Generation (req 9) is sourced from extracted solar report data', () => {
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      expect(document.getElementById('resPrimarySolarGen')).toHaveTextContent('680.50 kWh')
    })

    it('proves Net Grid Energy is calculated only when import + export exist, and unavailable if export missing (req 10)', () => {
      // When both import (560.25) and export (340.75) exist:
      // Net Grid Energy = 560.25 - 340.75 = 219.50 kWh
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      const { unmount } = render(<BillAnalyzer />)
      expect(document.getElementById('resDerivedNetGridEnergy')).toHaveTextContent('219.50 kWh')
      expect(document.getElementById('resNetMeterNetGridEnergy')).toHaveTextContent('219.50 kWh')

      // When export is missing (Bill B):
      unmount()
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillB,
        solarReport: null,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'NOT_PROVIDED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 0, status: '' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)
      // Net Grid Energy must be unavailable "—" rather than silently using 185.00 - 0 = 185.00
      expect(document.getElementById('resDerivedNetGridEnergy')).toHaveTextContent('—')
    })

    it('proves Solar Self-Consumption is calculated only when generation + export exist (req 11)', () => {
      // When generation (680.50) and export (340.75) exist and period matches:
      // Solar Self-Consumption = 680.50 - 340.75 = 339.75 kWh
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      const { unmount } = render(<BillAnalyzer />)
      expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('339.75 kWh')

      // When export is missing:
      unmount()
      const billNoExport = { ...distinctBillA, exportUnits: null, gridExport: null }
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: billNoExport,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)
      // Must not calculate by treating export as 0
      expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('—')
    })

    it('proves percentage calculations dynamically use live source values (req 12)', () => {
      // Self-consumption: 339.75 / 680.50 * 100 ≈ 49.9%
      // Export rate: 340.75 / 680.50 * 100 ≈ 50.1%
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: distinctSolarA,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)
      expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('49.9%')
      expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('50.1%')
    })

    it('proves incompatible periods do not produce combined derived values (req 13)', () => {
      // Bill A is July 2026. Solar report is December 2026.
      const decSolarReport: SolarReportData = {
        productionKwh: 520.40,
        systemSizeKw: 5.2,
        month: 'December',
        year: 2026,
        source: 'Sungrow',
      }

      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: distinctBillA,
        solarReport: decSolarReport,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Source values preserved
      expect(document.getElementById('resPrimaryGridImport')).toHaveTextContent('560.25 kWh')
      expect(document.getElementById('resPrimaryGridExport')).toHaveTextContent('340.75 kWh')
      expect(document.getElementById('resPrimarySolarGen')).toHaveTextContent('520.40 kWh')

      // Combined derived metrics disabled and show "—"
      expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('—')
      expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('—')
      expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('—')

      // Explanatory badge shown
      expect(screen.getByText(/PERIOD MISMATCH \(December vs Bill\)/i)).toBeInTheDocument()
    })
  })

  describe('Solar Production Report UI Data Contract — Approved Specification', () => {
    const distinctSolarReportAlpha: SolarReportData = {
      productionKwh: 612.5,
      systemSizeKw: 5.0,
      month: 'October',
      year: 2026,
      source: 'Fronius Solar.web',
      dailyGenerationKwh: 19.8,
      confidence: 0.95,
    }

    const distinctSolarReportBeta: SolarReportData = {
      productionKwh: 285.2,
      systemSizeKw: 2.2,
      month: 'August',
      year: 2025,
      source: 'Enphase Enlighten',
      dailyGenerationKwh: 9.2,
      confidence: 0.88,
    }

    const octBill: BillAnalysisData = {
      ...mockAnalysis,
      billing_period: 'October 2026',
      monthly_units: 500,
      importUnits: 500,
      exportUnits: 200,
      monthly_savings_rs: 450,
      bill_amount: 3200,
    }

    it('proves solar generation, capacity, period, and source come strictly from solarReport (req 1, 2, 3, 4, 28)', () => {
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: distinctSolarReportAlpha,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Extracted report fields
      expect(document.getElementById('resProdKwh')).toHaveTextContent('612.5 kWh')
      expect(document.getElementById('resProdSystemSize')).toHaveTextContent('5 kW')
      expect(document.getElementById('resProdMonth')).toHaveTextContent('October 2026')
      expect(document.getElementById('resProdSource')).toHaveTextContent('Fronius Solar.web')
      expect(document.getElementById('resProdDailyGeneration')).toHaveTextContent('19.8 kWh')
      expect(document.getElementById('resProdConfidence')).toHaveTextContent('95%')

      // Compact banner has dynamic values
      expect(screen.getByText(/612.5 kWh · 5 kW · October 2026/i)).toBeInTheDocument()
    })

    it('proves different fixture values produce different UI outputs without hardcoded fallbacks (req 5, 6, 24)', () => {
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: distinctSolarReportBeta,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Values must reflect Beta fixture, NOT Alpha and NOT reference defaults
      expect(document.getElementById('resProdKwh')).toHaveTextContent('285.2 kWh')
      expect(document.getElementById('resProdSystemSize')).toHaveTextContent('2.2 kW')
      expect(document.getElementById('resProdMonth')).toHaveTextContent('August 2025')
      expect(document.getElementById('resProdSource')).toHaveTextContent('Enphase Enlighten')
      expect(document.getElementById('resProdDailyGeneration')).toHaveTextContent('9.2 kWh')
      expect(document.getElementById('resProdConfidence')).toHaveTextContent('88%')

      // Ensure reference values do not leak into production UI
      expect(screen.queryByText('446.70 kWh')).not.toBeInTheDocument()
      expect(screen.queryByText('3.6 kW')).not.toBeInTheDocument()
      expect(screen.queryByText('May 2026')).not.toBeInTheDocument()
    })

    it('proves missing generation, capacity, period, or source display em-dash — without coercing to zero or fake names (req 7, 8, 9, 10, 15)', () => {
      const emptySolarReport: SolarReportData = {
        productionKwh: null,
        systemSizeKw: null,
        month: null,
        year: null,
        source: null,
        dailyGenerationKwh: null,
        confidence: null,
      }

      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: emptySolarReport,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Missing fields MUST show em-dash "—", NEVER "0", "0 kWh", or "Solar App"
      expect(document.getElementById('resProdKwh')).toHaveTextContent('—')
      expect(document.getElementById('resProdKwh')).not.toHaveTextContent('0')
      expect(document.getElementById('resProdSystemSize')).toHaveTextContent('—')
      expect(document.getElementById('resProdSystemSize')).not.toHaveTextContent('0')
      expect(document.getElementById('resProdMonth')).toHaveTextContent('—')
      expect(document.getElementById('resProdSource')).toHaveTextContent('—')
      expect(document.getElementById('resProdSource')).not.toHaveTextContent('Solar App')
      expect(document.getElementById('resProdDailyGeneration')).toHaveTextContent('—')
      expect(document.getElementById('resProdSpecificYield')).toHaveTextContent('—')
      expect(document.getElementById('resProdAvgDailyGen')).toHaveTextContent('—')
      expect(document.getElementById('resProdExpected')).toHaveTextContent('—')
      expect(document.getElementById('resPlantPerformancePercent')).toHaveTextContent('—')
      expect(document.getElementById('resPlantPerformanceRating')).toHaveTextContent('—')

      // Compact state must show em-dashes for missing items
      expect(screen.getByText(/— · — · —/)).toBeInTheDocument()
    })

    it('proves specific yield calculates dynamically when valid and is unavailable when invalid (req 11, 12)', () => {
      // 612.5 kWh / 5.0 kW = 122.5 kWh/kWp
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: distinctSolarReportAlpha,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)
      expect(document.getElementById('resProdSpecificYield')).toHaveTextContent('122.5 kWh/kWp')

      // Unit test calculateSpecificYield
      expect(billAnalyzerHook.calculateSpecificYield(612.5, 5.0)).toBe(122.5)
      expect(billAnalyzerHook.calculateSpecificYield(null, 5.0)).toBeNull()
      expect(billAnalyzerHook.calculateSpecificYield(612.5, null)).toBeNull()
      expect(billAnalyzerHook.calculateSpecificYield(612.5, 0)).toBeNull()
      expect(billAnalyzerHook.calculateSpecificYield(0, 5.0)).toBeNull()
      expect(billAnalyzerHook.calculateSpecificYield(-10, 5.0)).toBeNull()
    })

    it('proves combined metrics calculate dynamically when periods match and disable on mismatch (req 13, 14, 15, 16, 17, 18)', () => {
      // Matched: October 2026 bill & October 2026 solar report
      // Generation: 612.5 kWh, Grid Export: 200 kWh
      // Solar Self-Consumption: 612.5 - 200 = 412.5 kWh
      // Self-Consumption Rate: 412.5 / 612.5 = 67.3%
      // Export Rate: 200 / 612.5 = 32.7%
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: distinctSolarReportAlpha,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      const { unmount } = render(<BillAnalyzer />)

      expect(document.getElementById('resPrimarySolarGen')).toHaveTextContent('612.50 kWh')
      expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('412.50 kWh')
      expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('67.3%')
      expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('32.7%')
      expect(screen.getByText(/PERIOD SYNCHRONIZED/i)).toBeInTheDocument()

      unmount()

      // Mismatched: October 2026 bill vs August 2025 solar report
      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: distinctSolarReportBeta,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: vi.fn(),
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Source values remain visible
      expect(document.getElementById('resPrimarySolarGen')).toHaveTextContent('285.20 kWh')
      // Combined calculations disabled and show "—"
      expect(document.getElementById('resPrimarySelfConsumption')).toHaveTextContent('—')
      expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('—')
      expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('—')
      // Mismatch explanation rendered without error
      expect(screen.getByText(/PERIOD MISMATCH \(August vs Bill\)/i)).toBeInTheDocument()
      expect(screen.getByText('Period mismatch: solar report and bill periods differ')).toBeInTheDocument()
    })

    it('proves existing upload state, replace, skip/dismiss, and accordion toggle remain functional (req 19, 20, 21, 22, 23)', () => {
      const clearSolarReportMock = vi.fn()

      vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
        analysis: octBill,
        solarReport: distinctSolarReportAlpha,
        unifiedEnergy: null,
        billUploadState: 'complete',
        solarUploadState: 'EXTRACTED',
        billProgress: { percent: 100, status: 'Done' },
        solarProgress: { percent: 100, status: 'Done' },
        billError: null,
        solarError: null,
        quotas: mockQuotas,
        handleBillFile: vi.fn(),
        handleSolarFile: vi.fn(),
        retryBillUpload: vi.fn(),
        retrySolarUpload: vi.fn(),
        clearSolarReport: clearSolarReportMock,
        submitManualBill: vi.fn(),
      })

      render(<BillAnalyzer />)

      // Replace button exists and is clickable
      const replaceBtn = screen.getByRole('button', { name: /Replace/i })
      expect(replaceBtn).toBeInTheDocument()

      // Skip / Dismiss button exists and triggers clearSolarReport
      const skipBtn = screen.getByRole('button', { name: /Skip \/ Dismiss/i })
      expect(skipBtn).toBeInTheDocument()
      fireEvent.click(skipBtn)
      expect(clearSolarReportMock).toHaveBeenCalledTimes(1)

      // Plant performance section exists and can be expanded
      const plantPerfHeader = screen.getByRole('button', { name: /Plant Performance/i })
      expect(plantPerfHeader).toBeInTheDocument()
      expect(plantPerfHeader).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(plantPerfHeader)
      expect(plantPerfHeader).toHaveAttribute('aria-expanded', 'true')
    })
  })
})

