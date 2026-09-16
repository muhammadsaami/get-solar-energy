import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VendorInventory } from '../pages/VendorInventory'
import { VendorPayments } from '../pages/VendorPayments'
import * as vendorService from '../services/vendor.service'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'vendor@getsolar.in', name: 'Aman Verma', role: 'vendor' },
  }),
}))

vi.mock('../hooks/useVendorNotify', () => ({
  useVendorNotify: () => vi.fn(),
}))

describe('VendorInventory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially and then empty state when API returns 0 items', async () => {
    vi.spyOn(vendorService, 'getInventory').mockResolvedValueOnce({
      success: true,
      items: [],
      total_count: 0,
      total_pages: 0,
      page: 1,
      page_size: 10,
      count: 0,
    })

    render(<VendorInventory />)

    // Initial loading indicator
    expect(screen.getByText('Loading warehouse inventory from live database...')).toBeInTheDocument();

    // After resolution, renders proper empty state
    await waitFor(() => {
      expect(screen.getByText('No inventory items available')).toBeInTheDocument();
      expect(screen.getByText('0 Active SKUs')).toBeInTheDocument();
      expect(screen.getAllByText('+ Add Stock Item').length).toBeGreaterThanOrEqual(1);
    })
  })

  it('renders items and correct badge when API returns inventory items', async () => {
    vi.spyOn(vendorService, 'getInventory').mockResolvedValueOnce({
      success: true,
      items: [
        {
          id: 1,
          vendor_email: 'vendor@getsolar.in',
          product_name: '540W Mono PERC Solar Panel',
          category: 'Module',
          sku: 'MOD-540W-MONO',
          quantity: 45,
          unit: 'Units',
          unit_price: 16500,
          warehouse_city: 'Jaipur Central',
          status: 'In Stock',
          created_at: '2026-08-20T10:00:00Z',
          updated_at: null,
        },
      ],
      total_count: 1,
      total_pages: 1,
      page: 1,
      page_size: 10,
      count: 1,
    })

    render(<VendorInventory />)

    await waitFor(() => {
      expect(screen.getByText('540W Mono PERC Solar Panel')).toBeInTheDocument();
      expect(screen.getByText('MOD-540W-MONO')).toBeInTheDocument();
      expect(screen.getByText('1 Active SKUs')).toBeInTheDocument();
    })
  })

  it('renders error state and retry button when API fails', async () => {
    vi.spyOn(vendorService, 'getInventory').mockRejectedValueOnce(new Error('Network connection timeout'))

    render(<VendorInventory />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch inventory from server')).toBeInTheDocument();
      expect(screen.getByText('Network connection timeout')).toBeInTheDocument();
      expect(screen.getByText('— Active SKUs')).toBeInTheDocument();
      expect(screen.getByText('🔄 Retry Load')).toBeInTheDocument();
    })
  })
})

describe('VendorPayments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially and then empty state with ₹0 totals when API returns 0 records', async () => {
    vi.spyOn(vendorService, 'getPayouts').mockResolvedValueOnce({
      success: true,
      count: 0,
      total_paid: 0,
      total_pending: 0,
      payouts: [],
    })
    vi.spyOn(vendorService, 'getInvoices').mockResolvedValueOnce({
      success: true,
      count: 0,
      invoices: [],
    })

    render(<VendorPayments />)

    expect(screen.getByText('Loading payment records from live database...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('No Payment Records Found')).toBeInTheDocument();
      expect(screen.getByText('0 Transactions')).toBeInTheDocument();
      expect(screen.getAllByText('₹0').length).toBe(2); // Total Settled and Pending Escrow
    })
  })

  it('renders error state with "—" KPI metrics when API fails', async () => {
    vi.spyOn(vendorService, 'getPayouts').mockRejectedValueOnce(new Error('Internal server error 500'))
    vi.spyOn(vendorService, 'getInvoices').mockRejectedValueOnce(new Error('Internal server error 500'))

    render(<VendorPayments />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load payment records')).toBeInTheDocument();
      expect(screen.getByText('Internal server error 500')).toBeInTheDocument();
      expect(screen.getByText('— Transactions')).toBeInTheDocument();
      expect(screen.getAllByText('—').length).toBe(3); // Total Settled, Pending Escrow, Invoices
      expect(screen.getByText('🔄 Retry Load')).toBeInTheDocument();
    })
  })

  it('renders payouts ledger and calculates metrics accurately when records exist', async () => {
    vi.spyOn(vendorService, 'getPayouts').mockResolvedValueOnce({
      success: true,
      count: 2,
      total_paid: 300000,
      total_pending: 150000,
      payouts: [
        {
          id: 101,
          vendor_email: 'vendor@getsolar.in',
          amount: 300000,
          currency: 'INR',
          status: 'Paid',
          payment_method: 'NEFT Transfer',
          reference_id: 'TXN-98231',
          notes: 'Stage 1 Delivery',
          created_at: '2026-08-15T12:00:00Z',
          updated_at: null,
          paid_at: '2026-08-16T10:00:00Z',
        },
        {
          id: 102,
          vendor_email: 'vendor@getsolar.in',
          amount: 150000,
          currency: 'INR',
          status: 'Pending',
          payment_method: 'Escrow Milestone Release',
          reference_id: 'TXN-98232',
          notes: 'Stage 2 Installation',
          created_at: '2026-08-20T12:00:00Z',
          updated_at: null,
          paid_at: null,
        },
      ],
    })
    vi.spyOn(vendorService, 'getInvoices').mockResolvedValueOnce({
      success: true,
      count: 1,
      invoices: [
        {
          id: 1,
          vendor_email: 'vendor@getsolar.in',
          payout_id: 101,
          invoice_number: 'INV-202608-A1B2C3D4',
          amount: 300000,
          description: 'Stage 1 Delivery Invoice',
          status: 'Paid',
          created_at: '2026-08-16T10:00:00Z',
        },
      ],
    })

    render(<VendorPayments />)

    await waitFor(() => {
      expect(screen.getByText('₹3,00,000')).toBeInTheDocument(); // Settled
      expect(screen.getByText('₹1,50,000')).toBeInTheDocument(); // Pending
      expect(screen.getByText('TXN-98231')).toBeInTheDocument();
      expect(screen.getByText('TXN-98232')).toBeInTheDocument();
      expect(screen.getByText('2 Transactions')).toBeInTheDocument();
      expect(screen.getByText('Payouts Ledger (2)')).toBeInTheDocument();
      expect(screen.getByText('Invoices (1)')).toBeInTheDocument();
    })
  })
})

describe('VendorTeams Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially and then empty state when API returns 0 team members', async () => {
    vi.spyOn(vendorService, 'getTeam').mockResolvedValueOnce({
      success: true,
      count: 0,
      members: [],
    })

    const { VendorTeams } = await import('../pages/VendorTeams')
    render(<VendorTeams />)

    expect(screen.getByText('Loading engineering roster from live database...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('No Field Engineers Registered')).toBeInTheDocument()
      expect(screen.getByText('0 Active Engineers')).toBeInTheDocument()
    })
  })

  it('renders team members when API returns data', async () => {
    vi.spyOn(vendorService, 'getTeam').mockResolvedValueOnce({
      success: true,
      count: 1,
      members: [
        {
          id: 1,
          vendor_email: 'vendor@getsolar.in',
          name: 'Ramesh Kumar',
          role: 'Field Installation Engineer',
          phone: '9829012345',
          email: 'ramesh@getsolar.in',
          city: 'Jaipur',
          is_active: true,
          created_at: '2026-08-20T10:00:00Z',
          updated_at: null,
        },
      ],
    })

    const { VendorTeams } = await import('../pages/VendorTeams')
    render(<VendorTeams />)

    await waitFor(() => {
      expect(screen.getByText('Ramesh Kumar')).toBeInTheDocument()
      expect(screen.getByText('ENG-0001')).toBeInTheDocument()
      expect(screen.getByText('1 Active Engineers')).toBeInTheDocument()
    })
  })

  it('renders error state when API fails', async () => {
    vi.spyOn(vendorService, 'getTeam').mockRejectedValueOnce(new Error('Database query failed'))

    const { VendorTeams } = await import('../pages/VendorTeams')
    render(<VendorTeams />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load team members')).toBeInTheDocument()
      expect(screen.getByText('— Active Engineers')).toBeInTheDocument()
      expect(screen.getByText('🔄 Retry Load')).toBeInTheDocument()
    })
  })
})

describe('VendorDocuments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially and then empty state when API returns 0 documents', async () => {
    vi.spyOn(vendorService, 'getDocuments').mockResolvedValueOnce({
      success: true,
      count: 0,
      documents: [],
    })

    const { VendorDocuments } = await import('../pages/VendorDocuments')
    render(<VendorDocuments />)

    expect(screen.getByText('Loading compliance documents from live vault...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('No Documents Vaulted')).toBeInTheDocument()
      expect(screen.getByText('0 Verified Records')).toBeInTheDocument()
    })
  })

  it('renders documents when API returns data', async () => {
    vi.spyOn(vendorService, 'getDocuments').mockResolvedValueOnce({
      success: true,
      count: 1,
      documents: [
        {
          id: 1,
          vendor_email: 'vendor@getsolar.in',
          document_name: 'Jaipur 50kW EPC Agreement',
          document_type: 'EPC Contract',
          file_url: '/uploads/epc_contract.pdf',
          original_filename: 'epc_contract.pdf',
          size_mb: 2.45,
          uploaded_at: '2026-08-20T10:00:00Z',
        },
      ],
    })

    const { VendorDocuments } = await import('../pages/VendorDocuments')
    render(<VendorDocuments />)

    await waitFor(() => {
      expect(screen.getByText('Jaipur 50kW EPC Agreement')).toBeInTheDocument()
      expect(screen.getByText('DOC-0001')).toBeInTheDocument()
      expect(screen.getByText('1 Verified Records')).toBeInTheDocument()
    })
  })

  it('renders error state when API fails', async () => {
    vi.spyOn(vendorService, 'getDocuments').mockRejectedValueOnce(new Error('Storage connection timeout'))

    const { VendorDocuments } = await import('../pages/VendorDocuments')
    render(<VendorDocuments />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load document records')).toBeInTheDocument()
      expect(screen.getByText('— Verified Records')).toBeInTheDocument()
      expect(screen.getByText('🔄 Retry Load')).toBeInTheDocument()
    })
  })
})
