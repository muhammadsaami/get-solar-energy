import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import BillAnalyzer from '../../pages/BillAnalyzer'
import * as billAnalyzerHook from '../useBillAnalyzer'
import api from '../../services/api/client'

vi.mock('../../components/dashboard/DashboardSprites', () => ({
  default: () => <div data-testid="dashboard-sprites" />,
}))

const mockQuotas = {
  upload: { remaining: 2, limit: 3, reset_hours: 24 },
  manual: { remaining: 4, limit: 5, reset_hours: 24 },
  source: 'auth' as const,
}

describe('Bill Analyzer Demo — Customer-Facing Example Preview', () => {
  let postSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    postSpy = vi.spyOn(api, 'post')

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
      resetBill: vi.fn(),
      fetchQuotas: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('1. renders "See Example Analysis" button in initial idle upload view', () => {
    render(<BillAnalyzer />)

    const exampleButtons = screen.getAllByRole('button', { name: /See Example Analysis/i })
    expect(exampleButtons.length).toBeGreaterThan(0)
    expect(document.getElementById('btnSeeExampleAnalysis')).toBeInTheDocument()

    // Primary KPIs initially render empty/idle state
    expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('—')
    expect(document.getElementById('billTabUnits')).toHaveTextContent('—')
    expect(document.getElementById('billTabSavings')).toHaveTextContent('—')
  })

  it('2. clicking "See Example Analysis" activates demo mode and 3. causes no network requests', () => {
    render(<BillAnalyzer />)

    const seeExampleBtn = document.getElementById('btnSeeExampleAnalysis')
    expect(seeExampleBtn).toBeInTheDocument()

    fireEvent.click(seeExampleBtn!)

    // Absolutely zero API calls to analyze-bill, analyze-bill/manual, or analyze-solar-report
    expect(postSpy).not.toHaveBeenCalled()
  })

  it('4. renders DemoBanner and 5. displays "DEMO — SAMPLE DATA" notice clearly', () => {
    render(<BillAnalyzer />)

    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Demo Mode Notice banner exists
    expect(screen.getByRole('region', { name: /Demo Mode Notice/i })).toBeInTheDocument()
    expect(screen.getByText('DEMO — SAMPLE DATA')).toBeInTheDocument()
    expect(
      screen.getByText(/This is a representative example of the insights Bill Analyzer provides/i)
    ).toBeInTheDocument()
  })

  it('6. primary KPIs display correct sample values (₹3,450, 380 kWh, ₹2,835/mo)', () => {
    render(<BillAnalyzer />)

    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('₹3,450')
    expect(document.getElementById('billTabUnits')).toHaveTextContent('380 kWh')
    expect(document.getElementById('billTabSavings')).toHaveTextContent('₹2,835/mo')
  })

  it('7. Energy Flow section displays all four expected demo values (Grid Import, Grid Export, Solar Gen, Self-Consumption)', () => {
    render(<BillAnalyzer />)

    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Grid Import = 380 kWh
    const gridImportEl = document.getElementById('resPrimaryGridImport')
    expect(gridImportEl).toBeInTheDocument()
    expect(gridImportEl).toHaveTextContent('380 kWh')

    // Grid Export = 145 kWh
    const gridExportEl = document.getElementById('resPrimaryGridExport')
    expect(gridExportEl).toBeInTheDocument()
    expect(gridExportEl).toHaveTextContent('145 kWh')

    // Solar Generation = 412.5 kWh
    const solarGenEl = document.getElementById('resPrimarySolarGen')
    expect(solarGenEl).toBeInTheDocument()
    expect(solarGenEl).toHaveTextContent('412.5')

    // Direct Self-Consumption = 267.5 kWh
    const selfConsEl = document.getElementById('resPrimarySelfConsumption')
    expect(selfConsEl).toBeInTheDocument()
    expect(selfConsEl).toHaveTextContent('267.5')

    // Derived Rates
    expect(document.getElementById('resDerivedSelfConsumptionRate')).toHaveTextContent('64.8%')
    expect(document.getElementById('resDerivedExportRate')).toHaveTextContent('35.2%')
    expect(document.getElementById('resDerivedNetGridEnergy')).toHaveTextContent('235 kWh')
  })

  it('8. Net-metering ledger displays expected demo values and reconciliation', () => {
    render(<BillAnalyzer />)

    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Opening Surplus = 120 kWh
    expect(document.getElementById('resNetMeterOpeningSurplus')).toHaveTextContent('120 kWh')

    // Net Grid Energy = 235 kWh
    expect(document.getElementById('resNetMeterNetGridEnergy')).toHaveTextContent('235 kWh')

    // Closing Surplus = 0.00 kWh
    expect(document.getElementById('resNetMeterClosingSurplus')).toHaveTextContent('0.00 kWh')

    // Net Billed Units = 115 kWh
    expect(document.getElementById('resNetMeterBilledUnits')).toHaveTextContent('115 kWh')

    // Financial Current Bill & Savings
    expect(document.getElementById('resFinancialCurrentBill')).toHaveTextContent('₹3,450')
    expect(document.getElementById('resFinancialSavingsPotential')).toHaveTextContent('₹2,835/mo')
  })

  it('9. chart canvases initialize without errors and display insights', async () => {
    render(<BillAnalyzer />)

    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Chart canvases exist in the document
    expect(document.getElementById('billCostBreakdownChart')).toBeInTheDocument()
    expect(document.getElementById('billHistoryChart')).toBeInTheDocument()

    // Chart insights populated
    expect(document.getElementById('resTopCostDriver')).toHaveTextContent('Energy Charges (~70%)')
    expect(document.getElementById('resPotentialSavingsText')).toHaveTextContent('₹2,835 / month (~82%)')
  })

  it('10. metric explanation opens, 11. "What it means" is present, and 12. "Why you see this" is present', () => {
    render(<BillAnalyzer />)

    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Find explainer buttons for Grid Import
    const explainerButtons = screen.getAllByRole('button', { name: /Learn what Grid Import means/i })
    expect(explainerButtons.length).toBeGreaterThan(0)

    // Click to open explanation popover
    fireEvent.click(explainerButtons[0])

    // Popover dialog opened
    const dialog = screen.getByRole('dialog', { name: /Grid Import explanation/i })
    expect(dialog).toBeInTheDocument()

    // Educational sections present
    expect(screen.getByText('What it means')).toBeInTheDocument()
    expect(screen.getByText('Why you see this')).toBeInTheDocument()
    expect(screen.getByText('Decision impact')).toBeInTheDocument()
    expect(screen.getByText(/Total units of electricity drawn from your distribution utility/i)).toBeInTheDocument()
  })

  it('10a. only ONE explainer may be open at a time; opening a second closes the first', () => {
    render(<BillAnalyzer />)
    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Find trigger buttons for Opening Surplus and Net Grid Energy in Net-Metering section
    const openingSurplusBtn = screen.getByRole('button', { name: /Learn what Opening Surplus means/i })
    const netGridEnergyBtns = screen.getAllByRole('button', { name: /Learn what Net Grid Energy means/i })
    const netGridEnergyBtn = netGridEnergyBtns[netGridEnergyBtns.length - 1]

    expect(openingSurplusBtn).toHaveAttribute('aria-expanded', 'false')
    expect(netGridEnergyBtn).toHaveAttribute('aria-expanded', 'false')

    // Open Opening Surplus
    fireEvent.click(openingSurplusBtn)
    expect(openingSurplusBtn).toHaveAttribute('aria-expanded', 'true')
    expect(netGridEnergyBtn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('dialog', { name: /Opening Surplus explanation/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Net Grid Energy explanation/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('dialog').length).toBe(1)

    // Open Net Grid Energy -> Opening Surplus must close automatically
    fireEvent.click(netGridEnergyBtn)
    expect(openingSurplusBtn).toHaveAttribute('aria-expanded', 'false')
    expect(netGridEnergyBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('dialog', { name: /Opening Surplus explanation/i })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /Net Grid Energy explanation/i })).toBeInTheDocument()
    expect(screen.getAllByRole('dialog').length).toBe(1)

    // Re-clicking open trigger toggles it closed
    fireEvent.click(netGridEnergyBtn)
    expect(netGridEnergyBtn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('10b. Escape key closes the active explainer and restores aria-expanded', () => {
    render(<BillAnalyzer />)
    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    const trigger = screen.getByRole('button', { name: /Learn what Closing Surplus means/i })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: /Closing Surplus explanation/i })).toBeInTheDocument()

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('10c. Clicking outside closes the active explainer', () => {
    render(<BillAnalyzer />)
    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    const trigger = screen.getByRole('button', { name: /Learn what Net Billed Units means/i })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: /Net Billed Units explanation/i })).toBeInTheDocument()

    // Click outside on document body
    fireEvent.pointerDown(document.body)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('13. "Analyze My Bill" exits demo mode and 14. demo values disappear after exit', () => {
    render(<BillAnalyzer />)

    // Enter demo mode
    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)
    expect(screen.getByText('DEMO — SAMPLE DATA')).toBeInTheDocument()
    expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('₹3,450')

    // Click "Analyze My Bill" in banner
    const analyzeButtons = screen.getAllByRole('button', { name: /Analyze My Bill/i })
    expect(analyzeButtons.length).toBeGreaterThan(0)
    fireEvent.click(analyzeButtons[0])

    // Demo banner gone
    expect(screen.queryByText('DEMO — SAMPLE DATA')).not.toBeInTheDocument()

    // Real idle state restored
    expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('—')
    expect(document.getElementById('billTabUnits')).toHaveTextContent('—')
    expect(document.getElementById('billTabSavings')).toHaveTextContent('—')

    // Dropzone restored
    expect(screen.getByText(/Drag & drop your electricity bill here/i)).toBeInTheDocument()
  })

  it('15. existing localStorage values are not overwritten by demo mode', () => {
    // Pre-populate legitimate localStorage
    const savedBill = { customer_name: 'Existing Customer', bill_amount: 5000, monthly_units: 600 }
    localStorage.setItem('lastBillAnalysis', JSON.stringify(savedBill))

    render(<BillAnalyzer />)

    // Enter demo mode
    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Verify localStorage was NOT modified with demo data
    const rawStored = localStorage.getItem('lastBillAnalysis')
    expect(rawStored).toBeTruthy()
    const parsed = JSON.parse(rawStored!)
    expect(parsed.customer_name).toBe('Existing Customer')
    expect(parsed.bill_amount).toBe(5000)
    expect(parsed.customer_name).not.toBe('Sample Homeowner')
  })

  it('16. no POST request occurs to /api/analyze-bill, /api/analyze-bill/manual, or /api/analyze-solar-report', () => {
    render(<BillAnalyzer />)

    // Enter demo
    fireEvent.click(document.getElementById('btnSeeExampleAnalysis')!)

    // Open an explanation
    const explainers = screen.getAllByRole('button', { name: /Learn what/i })
    if (explainers.length > 0) {
      fireEvent.click(explainers[0])
    }

    // Exit demo via bottom button
    const bottomBtn = document.getElementById('btnAnalyzeMyBillBottom')
    if (bottomBtn) {
      fireEvent.click(bottomBtn)
    }

    expect(postSpy).not.toHaveBeenCalledWith('/analyze-bill', expect.anything())
    expect(postSpy).not.toHaveBeenCalledWith('/analyze-bill/manual', expect.anything())
    expect(postSpy).not.toHaveBeenCalledWith('/analyze-solar-report', expect.anything())
  })

  it('18. restores original Bill Upload card UI after real analysis while preserving results', () => {
    const mockFileHandler = vi.fn()
    vi.spyOn(billAnalyzerHook, 'useBillAnalyzer').mockReturnValue({
      analysis: {
        customer_name: 'Real User',
        consumer_number: '1234567890',
        discom: 'Tata Power-DDL',
        billing_period: 'July 2026',
        monthly_units: 450,
        bill_amount: 4200,
        per_unit_rate: 9.33,
        recommended_kw: 3.5,
        monthly_generation_units: 437.5,
        monthly_savings_rs: 3150,
        system_cost_rs: 190000,
        payback_years: 2.8,
        savings_25_years_rs: 850000,
        solarYield: 125,
        monthlySolarGeneration: 437.5,
        annualSolarGeneration: 5250,
        solarUsedDirectly: 300,
        solarExportedToGrid: 137.5,
        solarOffsetPercent: 97.2,
        gridDependency: 150,
        netMeteringBenefit: 1100,
        isSolarConsumer: false,
        extractionConfidence: { score: 95, label: 'High Confidence', badgeClass: 'confidence-high' },
        billHealth: { score: 90, rating: 'Optimal' },
        solarOpportunity: { score: 92, rating: 'Prime Opportunity' },
      },
      solarReport: null,
      unifiedEnergy: null,
      billUploadState: 'complete',
      solarUploadState: 'NOT_PROVIDED',
      billProgress: { percent: 100, status: 'Done' },
      solarProgress: { percent: 0, status: '' },
      billError: null,
      solarError: null,
      quotas: mockQuotas,
      handleBillFile: mockFileHandler,
      handleSolarFile: vi.fn(),
      retryBillUpload: vi.fn(),
      retrySolarUpload: vi.fn(),
      clearSolarReport: vi.fn(),
      submitManualBill: vi.fn(),
      resetBill: vi.fn(),
      fetchQuotas: vi.fn(),
    })

    render(<BillAnalyzer />)

    // Analyzed results are displayed
    expect(document.getElementById('billTabCurrentBill')).toHaveTextContent('₹4,200')
    expect(document.getElementById('billTabUnits')).toHaveTextContent('450 kWh')
    expect(document.getElementById('billTabSavings')).toHaveTextContent('₹3,150/mo')
    expect(document.getElementById('resCustomerName')).toHaveTextContent('Real User')

    // Bill Upload card maintains original upload UI (no "Bill Verified & Extracted" or "Upload Another Bill" banner)
    expect(screen.queryByText('Bill Verified & Extracted')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Upload Another Bill/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Drag & drop your electricity bill here/i)).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 3 left today/i)).toBeInTheDocument()
    expect(screen.getByText(/2 analyses remaining today/i)).toBeInTheDocument()
    expect(document.getElementById('billFileInput')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enter Details Manually/i })).toBeInTheDocument()

    // Upload action remains functional
    const fileInput = document.getElementById('billFileInput') as HTMLInputElement
    const file = new File(['dummy'], 'new_bill.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(mockFileHandler).toHaveBeenCalledWith(file)
  })
})
