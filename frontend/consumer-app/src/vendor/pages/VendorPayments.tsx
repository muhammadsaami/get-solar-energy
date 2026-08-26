import React, { useState, useEffect, useCallback, useRef } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'
import { useAuth } from '../../contexts/AuthContext'
import {
  getPayouts,
  createPayout,
  updatePayout,
  deletePayout,
  createPayoutInvoice,
  getInvoices,
  downloadPayoutReceipt,
} from '../services/vendor.service'
import type {
  VendorPayout,
  VendorPayoutCreatePayload,
  VendorInvoice,
} from '../types/vendor.types'

export function VendorPayments() {
  const notify = useVendorNotify()
  const auth = useAuth() as unknown as { user?: { email?: string; name?: string } }
  const vendorEmail = auth?.user?.email || 'vendor@getsolar.in'

  // Data State
  const [payouts, setPayouts] = useState<VendorPayout[]>([])
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])
  const [totalPaid, setTotalPaid] = useState<number | null>(null)
  const [totalPending, setTotalPending] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'payouts' | 'invoices'>('payouts')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  // Payout Form
  const [payoutForm, setPayoutForm] = useState({
    amount: 150000,
    currency: 'INR',
    payment_method: 'NEFT Transfer',
    notes: '',
  })

  // Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    payout_id: 0,
    description: '',
  })

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchPaymentData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [payoutsRes, invoicesRes] = await Promise.all([
        getPayouts(vendorEmail, statusFilter !== 'All' ? statusFilter : undefined),
        getInvoices(vendorEmail).catch(() => ({ success: true, count: 0, invoices: [] })),
      ])

      if (!isMountedRef.current) return

      if (payoutsRes && payoutsRes.success) {
        setPayouts(Array.isArray(payoutsRes.payouts) ? payoutsRes.payouts : [])
        setTotalPaid(typeof payoutsRes.total_paid === 'number' ? payoutsRes.total_paid : 0)
        setTotalPending(typeof payoutsRes.total_pending === 'number' ? payoutsRes.total_pending : 0)
        setError(null)
      } else {
        setPayouts([])
        setTotalPaid(0)
        setTotalPending(0)
        setError(null)
      }

      if (invoicesRes && invoicesRes.success) {
        setInvoices(Array.isArray(invoicesRes.invoices) ? invoicesRes.invoices : [])
      } else {
        setInvoices([])
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to load payments ledger'
      setError(msg)
      setPayouts([])
      setInvoices([])
      setTotalPaid(null)
      setTotalPending(null)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [vendorEmail, statusFilter])

  useEffect(() => {
    fetchPaymentData()
  }, [fetchPaymentData])

  // Filtered Payouts
  const filteredPayouts = payouts.filter((p) => {
    const term = search.toLowerCase().trim()
    if (!term) return true
    const matchId = String(p.id).includes(term) || (p.reference_id && p.reference_id.toLowerCase().includes(term))
    const matchMethod = p.payment_method?.toLowerCase().includes(term)
    const matchNotes = p.notes?.toLowerCase().includes(term)
    return Boolean(matchId || matchMethod || matchNotes)
  })

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase().trim()
    if (!term) return true
    const matchNum = inv.invoice_number?.toLowerCase().includes(term)
    const matchDesc = inv.description?.toLowerCase().includes(term)
    const matchId = String(inv.id).includes(term) || String(inv.payout_id).includes(term)
    return Boolean(matchNum || matchDesc || matchId)
  })

  // Handlers
  const handleOpenPayoutModal = () => {
    setPayoutForm({
      amount: 150000,
      currency: 'INR',
      payment_method: 'NEFT Transfer',
      notes: '',
    })
    setIsPayoutModalOpen(true)
  }

  const handleOpenInvoiceModal = (presetPayoutId?: number) => {
    const defaultId = presetPayoutId || (payouts.length > 0 ? payouts[0].id : 0)
    setInvoiceForm({
      payout_id: defaultId,
      description: 'Milestone Execution Turnkey Settlement',
    })
    setIsInvoiceModalOpen(true)
  }

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payoutForm.amount || payoutForm.amount <= 0) {
      notify('Amount must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const payload: VendorPayoutCreatePayload = {
        vendor_email: vendorEmail,
        amount: Number(payoutForm.amount),
        currency: payoutForm.currency || 'INR',
        payment_method: payoutForm.payment_method || 'NEFT Transfer',
        notes: payoutForm.notes.trim() || undefined,
      }
      const res = await createPayout(payload)
      if (res && res.success) {
        notify(`Created payout request of ₹${payoutForm.amount.toLocaleString('en-IN')}`)
        setIsPayoutModalOpen(false)
        fetchPaymentData()
      } else {
        notify('Failed to create payout')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed'
      notify(`Payout error: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceForm.payout_id) {
      notify('Please select a payout transaction')
      return
    }

    setSubmitting(true)
    try {
      const res = await createPayoutInvoice(
        invoiceForm.payout_id,
        invoiceForm.description.trim() || undefined,
        vendorEmail
      )
      if (res && res.success) {
        notify(res.message || `Invoice ${res.invoice?.invoice_number || ''} generated successfully`)
        setIsInvoiceModalOpen(false)
        setActiveTab('invoices')
        fetchPaymentData()
      } else {
        notify('Failed to create invoice')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invoice generation failed'
      notify(`Invoice error: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadReceipt = async (payout: VendorPayout) => {
    if (payout.status !== 'Paid') {
      notify('Receipt PDF is only available for Paid payouts.')
      return
    }

    setDownloadingId(payout.id)
    try {
      const blob = await downloadPayoutReceipt(payout.id, vendorEmail)
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `receipt-payout-${payout.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
      notify(`Downloaded receipt for Payout #${payout.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      notify(`Failed to download receipt: ${msg}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleStatusChange = async (payout: VendorPayout, newStatus: string) => {
    try {
      const res = await updatePayout(payout.id, { status: newStatus }, vendorEmail)
      if (res && res.success) {
        notify(`Payout #${payout.id} status updated to ${newStatus}`)
        fetchPaymentData()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      notify(`Status update failed: ${msg}`)
    }
  }

  const handleDeletePayout = async (payout: VendorPayout) => {
    if (!window.confirm(`Are you sure you want to delete Payout #${payout.id}?`)) return
    try {
      const res = await deletePayout(payout.id, vendorEmail)
      if (res && res.success) {
        notify(`Payout #${payout.id} deleted successfully`)
        fetchPaymentData()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      notify(`Delete failed: ${msg}`)
    }
  }

  // Derive badge and financial display values
  const badgeLabel = loading
    ? 'Loading Records...'
    : error
    ? '— Transactions'
    : `${payouts.length} Transactions`

  const displaySettled = loading
    ? '...'
    : error || totalPaid === null
    ? '—'
    : `₹${totalPaid.toLocaleString('en-IN')}`

  const displayPending = loading
    ? '...'
    : error || totalPending === null
    ? '—'
    : `₹${totalPending.toLocaleString('en-IN')}`

  const displayInvoicesCount = loading
    ? '...'
    : error
    ? '—'
    : invoices.length

  const payoutsTabLabel = loading
    ? 'Payouts Ledger (...)'
    : error
    ? 'Payouts Ledger (—)'
    : `Payouts Ledger (${payouts.length})`

  const invoicesTabLabel = loading
    ? 'Invoices (...)'
    : error
    ? 'Invoices (—)'
    : `Invoices (${invoices.length})`

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Escrow & Payment Milestone Ledger"
        subtitle="Track customer milestone deposits, escrow releases, invoice creation, and settlement receipts."
        badgeText={badgeLabel}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="vendor-btn-secondary" onClick={() => handleOpenInvoiceModal()} id="createInvoiceBtn">
              + Create New Invoice
            </button>
            <button className="vendor-btn-primary" onClick={handleOpenPayoutModal} id="createPayoutBtn">
              + Create Payout
            </button>
          </div>
        }
      />

      {/* KPI Financial Metric Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="vendor-glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Settled (Paid)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--vendor-success)', marginTop: '4px' }}>
            {displaySettled}
          </div>
        </div>

        <div className="vendor-glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Pending Escrow Release
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--vendor-warning)', marginTop: '4px' }}>
            {displayPending}
          </div>
        </div>

        <div className="vendor-glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Invoices Generated
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--vendor-secondary)', marginTop: '4px' }}>
            {displayInvoicesCount}
          </div>
        </div>
      </div>

      {/* Tab Controls & Search Bar */}
      <div
        className="vendor-glass-card"
        style={{
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`vendor-btn-${activeTab === 'payouts' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            id="payoutsTabBtn"
            onClick={() => setActiveTab('payouts')}
          >
            {payoutsTabLabel}
          </button>
          <button
            className={`vendor-btn-${activeTab === 'invoices' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            id="invoicesTabBtn"
            onClick={() => setActiveTab('invoices')}
          >
            {invoicesTabLabel}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeTab === 'payouts' && (
            <select
              className="vendor-input"
              style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
              value={statusFilter}
              id="statusFilterSelect"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
          )}

          <div style={{ width: '220px' }}>
            <input
              type="text"
              className="vendor-input"
              placeholder={activeTab === 'payouts' ? 'Search payouts by Txn...' : 'Search invoices...'}
              value={search}
              id="paymentsSearchInput"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--vendor-text-muted)' }}>
            <div className="vendor-spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading payment records from live database...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--vendor-danger)', fontWeight: 600, fontSize: '15px' }}>
              Unable to load payment records
            </p>
            <p style={{ color: 'var(--vendor-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {error}
            </p>
            <button
              className="vendor-btn-secondary"
              id="retryPaymentsBtn"
              style={{ marginTop: '16px' }}
              onClick={fetchPaymentData}
            >
              🔄 Retry Load
            </button>
          </div>
        ) : activeTab === 'payouts' ? (
          filteredPayouts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="vendor-table-container">
                <thead>
                  <tr>
                    <th>Txn Ref</th>
                    <th>Notes / Purpose</th>
                    <th>Amount</th>
                    <th>Channel</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>
                        {p.reference_id || `PAY-${p.id}`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.notes || 'Milestone Settlement'}</td>
                      <td style={{ fontWeight: 700, color: p.status === 'Paid' ? 'var(--vendor-success)' : '#FFFFFF' }}>
                        ₹{p.amount?.toLocaleString('en-IN')} {p.currency || 'INR'}
                      </td>
                      <td style={{ color: 'var(--vendor-text-muted)' }}>{p.payment_method}</td>
                      <td style={{ color: 'var(--vendor-text-secondary)', fontSize: '12px' }}>
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN') : p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Receipt PDF */}
                          <button
                            className="vendor-btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              opacity: p.status === 'Paid' ? 1 : 0.6,
                            }}
                            disabled={downloadingId === p.id}
                            onClick={() => handleDownloadReceipt(p)}
                            title={p.status === 'Paid' ? 'Download PDF Receipt' : 'Receipt available once Paid'}
                          >
                            {downloadingId === p.id ? 'Loading...' : 'Receipt PDF'}
                          </button>

                          {/* Quick Status Update for Operations */}
                          {p.status !== 'Paid' && (
                            <button
                              className="vendor-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--vendor-success)' }}
                              onClick={() => handleStatusChange(p, 'Paid')}
                              title="Mark as Paid"
                            >
                              Mark Paid
                            </button>
                          )}

                          {/* Invoice trigger */}
                          <button
                            className="vendor-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenInvoiceModal(p.id)}
                            title="Generate/View Invoice"
                          >
                            Invoice
                          </button>

                          {/* Delete */}
                          <button
                            className="vendor-btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              color: 'var(--vendor-danger)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                            }}
                            onClick={() => handleDeletePayout(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <VendorEmptyState
              title={search ? 'No Matching Payouts Found' : 'No Payment Records Found'}
              description={search ? `No payout records match "${search}".` : 'No settlement payouts found for this account.'}
              action={search ? { label: 'Reset Filter', onClick: () => setSearch('') } : { label: '+ Create First Payout', onClick: handleOpenPayoutModal }}
            />
          )
        ) : (
          filteredInvoices.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="vendor-table-container">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Payout Link</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Created Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 800, color: 'var(--vendor-secondary)' }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ fontWeight: 600 }}>Payout #{inv.payout_id}</td>
                      <td style={{ color: 'var(--vendor-text-secondary)' }}>{inv.description || 'Milestone Execution'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--vendor-success)' }}>
                        ₹{inv.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ color: 'var(--vendor-text-muted)', fontSize: '12px' }}>
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <StatusBadge status={inv.status || 'Issued'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <VendorEmptyState
              title={search ? 'No Matching Invoices Found' : 'No Invoices Found'}
              description={search ? `No invoice records match "${search}".` : 'No milestone invoices have been generated yet.'}
              action={search ? { label: 'Reset Filter', onClick: () => setSearch('') } : { label: '+ Generate Invoice', onClick: () => handleOpenInvoiceModal() }}
            />
          )
        )}
      </div>

      {/* Create Payout Modal */}
      {isPayoutModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 15, 31, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="vendor-glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              border: '1px solid var(--vendor-primary-border)',
              background: '#0a1a2f',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF', fontWeight: 700 }}>
                Create Payout Transaction
              </h3>
              <button
                type="button"
                onClick={() => !submitting && setIsPayoutModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--vendor-text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                  Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="vendor-input"
                  placeholder="e.g. 150000"
                  value={payoutForm.amount}
                  id="payoutAmountInput"
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                  Payment Channel / Method
                </label>
                <select
                  className="vendor-input"
                  value={payoutForm.payment_method}
                  onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                >
                  <option value="NEFT Transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="Escrow Milestone Release">Escrow Milestone Release</option>
                  <option value="UPI Settlement">UPI Commercial Settlement</option>
                  <option value="Direct ACH">Direct ACH</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                  Notes / Milestone Purpose
                </label>
                <input
                  type="text"
                  className="vendor-input"
                  placeholder="e.g. 50kW Commercial Structure Delivery Milestone"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="vendor-btn-secondary"
                  onClick={() => setIsPayoutModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendor-btn-primary"
                  disabled={submitting}
                  id="submitPayoutBtn"
                >
                  {submitting ? 'Creating...' : 'Submit Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 15, 31, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="vendor-glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              border: '1px solid var(--vendor-secondary-border)',
              background: '#0a1a2f',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF', fontWeight: 700 }}>
                Generate Milestone Invoice
              </h3>
              <button
                type="button"
                onClick={() => !submitting && setIsInvoiceModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--vendor-text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                  Linked Payout Transaction *
                </label>
                {payouts.length > 0 ? (
                  <select
                    className="vendor-input"
                    value={invoiceForm.payout_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, payout_id: parseInt(e.target.value) || 0 })}
                  >
                    {payouts.map((p) => (
                      <option key={p.id} value={p.id}>
                        Payout #{p.id} — ₹{p.amount?.toLocaleString('en-IN')} ({p.notes || 'Settlement'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--vendor-warning)', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                    No payout transactions exist yet. Please create a payout first before generating an invoice.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                  Invoice Scope / Description
                </label>
                <input
                  type="text"
                  className="vendor-input"
                  placeholder="e.g. 50kW Commercial PV Turnkey Settlement"
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="vendor-btn-secondary"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendor-btn-secondary"
                  style={{ background: 'var(--vendor-secondary)', color: '#FFFFFF', borderColor: 'transparent' }}
                  disabled={submitting || payouts.length === 0}
                  id="submitInvoiceBtn"
                >
                  {submitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default VendorPayments
