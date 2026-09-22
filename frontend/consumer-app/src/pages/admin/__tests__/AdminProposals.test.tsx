import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminProposals from '../AdminProposals'

const mockSearchCustomers = vi.fn()
vi.mock('../../../services/crm.service', () => ({
  crmService: { searchCustomers: (...a: any[]) => mockSearchCustomers(...a) },
}))

const mockGetBundle = vi.fn()
const mockGenerate = vi.fn()
const mockSend = vi.fn()
vi.mock('../../../services/adminProposal.service', () => ({
  adminProposalService: {
    getCustomerBundle: (...a: any[]) => mockGetBundle(...a),
    generate: (...a: any[]) => mockGenerate(...a),
    send: (...a: any[]) => mockSend(...a),
  },
}))

const previewProps: any[] = []
vi.mock('../../../components/proposal/ProposalPreview', () => ({
  default: (props: any) => {
    previewProps.push(props)
    return <div role="dialog" aria-label="proposal preview stub">Preview stub</div>
  },
}))

const CUSTOMER = {
  id: 42,
  consumerNumber: 'CONS-42',
  customerName: 'Priya Sharma',
  email: 'priya@example.com',
  phone: '9000000001',
  city: 'Lucknow',
}

const BUNDLE = {
  customer_id: 42,
  consumer_number: 'CONS-42',
  customer_name: 'Priya Sharma',
  email: 'priya@example.com',
  phone: '9000000001',
  address: '1 Solar Street',
  city: 'Lucknow',
  state: null,
  pincode: null,
  latest_bill: {
    monthly_units: 400,
    bill_amount: 3200,
    per_unit_rate: 8.0,
    recommended_kw: 3,
    billing_period: '2026-08',
  },
}

const GENERATED = {
  customer_id: 42,
  consumer_number: 'CONS-42',
  customer_email: 'priya@example.com',
  proposal_reference: 'PROP-ABC123',
  generated_at: '2026-09-22T00:00:00+00:00',
  generated_by: 'admin@getsolar.in',
  system_cost_rs: 150000,
}

async function selectCustomer() {
  mockSearchCustomers.mockResolvedValue([CUSTOMER])
  mockGetBundle.mockResolvedValue(BUNDLE)
  fireEvent.change(screen.getByPlaceholderText(/Search Customer ID/i), { target: { value: 'CONS-42' } })
  fireEvent.click(screen.getByRole('button', { name: /Search Customer/i }))
  await waitFor(() => {
    expect(screen.getByText(/Customer ID: CONS-42/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByRole('button', { name: 'Select' }))
  await waitFor(() => {
    expect(screen.getByText(/Selected Customer/i)).toBeInTheDocument()
  })
}

describe('AdminProposals page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    previewProps.length = 0
    render(<AdminProposals />)
  })

  it('selector searches and auto-fills real customer data, never fabricated', async () => {
    await selectCustomer()
    expect(mockGetBundle).toHaveBeenCalledWith(42)
    // Identity is read-only text (never editable inputs)
    expect(screen.getAllByText(/Priya Sharma/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/priya@example.com/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/CONS-42/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByDisplayValue('3200')).toBeInTheDocument()
    expect(screen.getByDisplayValue('400')).toBeInTheDocument()
    const text = document.body.textContent || ''
    expect(text).not.toMatch(/Rajesh Kumar/i)
  })

  it('missing inputs are rejected with exact messages, no fake generation', async () => {
    await selectCustomer()
    fireEvent.change(screen.getByDisplayValue('3200'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByText(/Monthly electricity bill is required/i)).toBeInTheDocument()
    })
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('switching customers clears previous proposal state', async () => {
    await selectCustomer()
    mockGenerate.mockResolvedValue({ success: true, data: GENERATED })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByText(/Reference:/i)).toBeInTheDocument()
    })
    const other = { ...CUSTOMER, id: 43, consumerNumber: 'CONS-43', customerName: 'Amit' }
    const otherBundle = { ...BUNDLE, customer_id: 43, consumer_number: 'CONS-43', latest_bill: null }
    mockSearchCustomers.mockResolvedValue([other])
    mockGetBundle.mockResolvedValue(otherBundle)
    fireEvent.change(screen.getByPlaceholderText(/Search Customer ID/i), { target: { value: 'CONS-43' } })
    fireEvent.click(screen.getByRole('button', { name: /Search Customer/i }))
    await waitFor(() => {
      expect(screen.getByText(/Customer ID: CONS-43/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Select' }))
    await waitFor(() => {
      expect(screen.getByText(/Selected Customer/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/PROP-ABC123/i)).not.toBeInTheDocument()
    // Missing bill data surfaces as empty, not fabricated
    expect(screen.queryByDisplayValue('3200')).not.toBeInTheDocument()
  })

  it('preview shows the selected customer before sending', async () => {
    await selectCustomer()
    mockGenerate.mockResolvedValue({ success: true, data: GENERATED })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Preview Proposal/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Preview Proposal/i }))
    await waitFor(() => {
      expect(screen.getByLabelText('proposal preview stub')).toBeInTheDocument()
    })
    expect(previewProps[0].form.customerName).toBe('Priya Sharma')
    expect(previewProps[0].proposal.id).toBe('PROP-ABC123')
  })

  it('send requires confirmation and reports success with the reference', async () => {
    await selectCustomer()
    mockGenerate.mockResolvedValue({ success: true, data: GENERATED })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Send Proposal/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Send Proposal/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Confirm proposal send/i })).toBeInTheDocument()
    })
    expect(screen.getAllByText(/Priya Sharma/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/CONS-42/).length).toBeGreaterThanOrEqual(1)
    mockSend.mockResolvedValue({ success: true, proposal_reference: 'PROP-ABC123', recipient: 'priya@example.com' })
    const sends = screen.getAllByRole('button', { name: /^Send Proposal/i })
    fireEvent.click(sends[sends.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/Proposal sent to priya@example.com.*PROP-ABC123/i)).toBeInTheDocument()
    })
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend.mock.calls[0][0]).toBe(42)
    expect(mockSend.mock.calls[0][1]).toEqual(GENERATED)
  })

  it('send failure shows an honest error and keeps the proposal', async () => {    await selectCustomer()
    mockGenerate.mockResolvedValue({ success: true, data: GENERATED })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Send Proposal/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Send Proposal/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Confirm proposal send/i })).toBeInTheDocument()
    })
    mockSend.mockResolvedValue({ success: false, error: 'Unable to send' })
    const sends = screen.getAllByRole('button', { name: /^Send Proposal/i })
    fireEvent.click(sends[sends.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/Unable to send the proposal right now/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Proposal sent to/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Reference:/i).length).toBeGreaterThanOrEqual(1)
  })

  it('generation failure shows an honest error with no preview', async () => {
    await selectCustomer()
    mockGenerate.mockResolvedValue({ success: false, error: 'Proposal generation failed. Please try again.' })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByText(/Proposal generation failed/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Preview Proposal/i })).not.toBeInTheDocument()
  })
})
