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

function searchBox() {
  return screen.getByRole('combobox', { name: /Search customer ID, name or email/i })
}

const settle = (ms = 400) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })

async function typeSearch(text: string) {
  fireEvent.change(searchBox(), { target: { value: text } })
}

async function selectFirstResult() {
  const options = await screen.findAllByRole('option')
  fireEvent.click(options[0])
  await waitFor(() => {
    expect(screen.getByText(/Selected Customer/i)).toBeInTheDocument()
  })
}

async function selectCustomer() {
  mockSearchCustomers.mockResolvedValue([CUSTOMER])
  mockGetBundle.mockResolvedValue(BUNDLE)
  await typeSearch('Priya')
  await selectFirstResult()
}

describe('AdminProposals customer autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    previewProps.length = 0
    render(<AdminProposals />)
  })

  it('empty search field makes no request and shows no dropdown', async () => {
    expect(searchBox()).toHaveValue('')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(mockSearchCustomers).not.toHaveBeenCalled()
    await typeSearch('x')
    await settle()
    expect(mockSearchCustomers).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('typing "demo" shows the matching customer in a dropdown', async () => {
    mockSearchCustomers.mockResolvedValue([CUSTOMER])
    await typeSearch('demo')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await settle()
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
    expect(mockSearchCustomers).toHaveBeenCalledTimes(1)
    expect(mockSearchCustomers.mock.calls[0][0]).toBe('demo')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent(/Priya Sharma/)
    expect(options[0]).toHaveTextContent(/priya@example.com/)
    expect(options[0]).toHaveTextContent(/Customer ID: CONS-42/)
  })

  it('debounces rapid typing into a single request', async () => {
    mockSearchCustomers.mockResolvedValue([CUSTOMER])
    await typeSearch('P')
    await typeSearch('Pr')
    await typeSearch('Pri')
    await settle()
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
    expect(mockSearchCustomers).toHaveBeenCalledTimes(1)
    expect(mockSearchCustomers.mock.calls[0][0]).toBe('Pri')
  })

  it('searching email or name or consumer_number returns the customer', async () => {
    for (const query of ['priya@example.com', 'Priya Sharma', 'CONS-42']) {
      mockSearchCustomers.mockResolvedValue([CUSTOMER])
      await typeSearch(query)
      await settle()
      await waitFor(() => {
        expect(screen.getAllByRole('option')).toHaveLength(1)
      })
      expect(mockSearchCustomers).toHaveBeenLastCalledWith(query)
      fireEvent.change(searchBox(), { target: { value: '' } })
      await settle()
    }
  })

  it('shows loading, no-results, and failure states', async () => {
    let resolveSearch!: (v: unknown) => void
    mockSearchCustomers.mockReturnValue(new Promise((res) => { resolveSearch = res }))
    await typeSearch('Priya')
    await settle()
    await waitFor(() => {
      expect(screen.getByText(/Searching\.\.\./i)).toBeInTheDocument()
    })
    resolveSearch([])
    await waitFor(() => {
      expect(screen.getByText(/No customer found — check the search or create the CRM record first\./i)).toBeInTheDocument()
    })
    mockSearchCustomers.mockRejectedValue(new Error('down'))
    await typeSearch('Priya Sharma')
    await settle()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Customer search failed/i)
    })
  })

  it('results expose only name, email, and consumer ID', async () => {
    mockSearchCustomers.mockResolvedValue([{ ...CUSTOMER, phone: '9000000001', address: 'Secret Lane' }])
    await typeSearch('Priya')
    await settle()
    const options = await screen.findAllByRole('option')
    const text = options[0].textContent || ''
    expect(text).toMatch(/Priya Sharma/)
    expect(text).toMatch(/priya@example.com/)
    expect(text).toMatch(/CONS-42/)
    expect(text).not.toMatch(/9000000001/)
    expect(text).not.toMatch(/Secret Lane/)
  })

  it('selecting a result closes the dropdown and shows authoritative identity', async () => {
    mockSearchCustomers.mockResolvedValue([CUSTOMER])
    mockGetBundle.mockResolvedValue(BUNDLE)
    await typeSearch('Priya')
    await settle()
    await selectFirstResult()
    expect(mockGetBundle).toHaveBeenCalledWith(42)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByText(/Selected Customer/i)).toBeInTheDocument()
    expect(screen.getAllByText(/CONS-42/).length).toBeGreaterThanOrEqual(1)
  })

  it('Escape closes the dropdown without selecting', async () => {
    mockSearchCustomers.mockResolvedValue([CUSTOMER])
    await typeSearch('Priya')
    await settle()
    await screen.findByRole('listbox')
    fireEvent.keyDown(searchBox(), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(mockGetBundle).not.toHaveBeenCalled()
  })

  it('keyboard Enter selects the highlighted result', async () => {
    mockSearchCustomers.mockResolvedValue([CUSTOMER])
    mockGetBundle.mockResolvedValue(BUNDLE)
    await typeSearch('Priya')
    await settle()
    await screen.findByRole('listbox')
    fireEvent.keyDown(searchBox(), { key: 'ArrowDown' })
    fireEvent.keyDown(searchBox(), { key: 'Enter' })
    await waitFor(() => {
      expect(screen.getByText(/Selected Customer/i)).toBeInTheDocument()
    })
    expect(mockGetBundle).toHaveBeenCalledWith(42)
  })

  it('no separate Search button is required for autocomplete', () => {
    expect(screen.queryByRole('button', { name: /Search Customer/i })).not.toBeInTheDocument()
  })

  it('dropdown floats above card content without clipping', async () => {
    mockSearchCustomers.mockResolvedValue([CUSTOMER])
    await typeSearch('Priya')
    await settle()
    const listbox = await screen.findByRole('listbox')
    // Positioning context: wrapper is relative so the dropdown anchors to the input
    const wrapper = listbox.parentElement as HTMLElement
    expect(wrapper.style.position).toBe('relative')
    // Dropdown layer uses the design-system dropdown layer (below modals)
    expect(listbox.style.position).toBe('absolute')
    expect(listbox.style.zIndex).toBe('var(--z-dropdown)')
    expect(listbox.style.left).toBe('0px')
    expect(listbox.style.right).toBe('0px')
    expect(listbox.style.maxHeight).not.toBe('')
    // Customer Selection card must not clip the floating dropdown
    const card = wrapper.closest('.card-base') as HTMLElement
    expect(card).not.toBeNull()
    expect(card.style.overflow).toBe('visible')
  })

  it('dropdown renders multiple results with full content', async () => {
    const other = { ...CUSTOMER, id: 43, consumerNumber: 'CONS-43', customerName: 'Amit', email: 'amit@example.com' }
    mockSearchCustomers.mockResolvedValue([CUSTOMER, other])
    await typeSearch('am')
    await settle()
    const options = await screen.findAllByRole('option')
    expect(options).toHaveLength(2)
    const text = options.map((o) => o.textContent || '').join('|')
    expect(text).toMatch(/Priya Sharma/)
    expect(text).toMatch(/Amit/)
    expect(text).toMatch(/CONS-42/)
    expect(text).toMatch(/CONS-43/)
  })

  it('native browser autocomplete is disabled for the search field', () => {
    const input = searchBox()
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input.getAttribute('name')).not.toMatch(/email|user/i)
  })

  it('selector auto-fills real customer data, never fabricated', async () => {
    await selectCustomer()
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

  it('switching customers clears all previous proposal state', async () => {
    await selectCustomer()
    mockGenerate.mockResolvedValue({ success: true, data: GENERATED })
    fireEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }))
    await waitFor(() => {
      expect(screen.getByText(/PROP-ABC123/i)).toBeInTheDocument()
    })
    const other = { ...CUSTOMER, id: 43, consumerNumber: 'CONS-43', customerName: 'Amit' }
    const otherBundle = { ...BUNDLE, customer_id: 43, consumer_number: 'CONS-43', latest_bill: null }
    mockSearchCustomers.mockResolvedValue([other])
    mockGetBundle.mockResolvedValue(otherBundle)
    await typeSearch('Amit')
    await settle()
    await selectFirstResult()
    expect(screen.queryByText(/PROP-ABC123/i)).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('3200')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('Priya Sharma')).not.toBeInTheDocument()
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

  it('send failure shows an honest error and keeps the proposal', async () => {
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
    mockSend.mockResolvedValue({ success: false, error: 'Unable to send' })
    const sends = screen.getAllByRole('button', { name: /^Send Proposal/i })
    fireEvent.click(sends[sends.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/Unable to send the proposal right now/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Proposal sent to/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/PROP-ABC123/i).length).toBeGreaterThanOrEqual(1)
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
