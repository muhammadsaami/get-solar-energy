import React, { useState, useMemo, useCallback } from 'react'
import { crmService } from '../../services/crm.service'
import {
  adminProposalService,
  type AdminCustomerBundle,
  type AdminGeneratedProposal,
} from '../../services/adminProposal.service'
import { computeProposalInsights } from '../../utils/proposalInsights'
import { generateProposalPdf } from '../../services/pdf/proposalPdfGenerator'
import ProposalPreview from '../../components/proposal/ProposalPreview'
import type { CrmCustomer } from '../crm/crm.types'

interface ProposalInputs {
  monthlyBill: string
  monthlyUnits: string
  electricityRate: string
  roofArea: string
  recommendedKw: string
  address: string
  city: string
  vendorName: string
}

const EMPTY_INPUTS: ProposalInputs = {
  monthlyBill: '',
  monthlyUnits: '',
  electricityRate: '8.0',
  roofArea: '',
  recommendedKw: '',
  address: '',
  city: '',
  vendorName: 'Get Solar Energy',
}

const numOrNull = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

const textOrEmpty = (v: unknown): string => (typeof v === 'string' ? v : '')

export default function AdminProposals() {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<CrmCustomer[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const [selected, setSelected] = useState<AdminCustomerBundle | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [customerError, setCustomerError] = useState<string | null>(null)

  const [inputs, setInputs] = useState<ProposalInputs>(EMPTY_INPUTS)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [proposal, setProposal] = useState<AdminGeneratedProposal | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)

  const insights = useMemo(
    () =>
      computeProposalInsights({
        recommendedKw: inputs.recommendedKw,
        electricityRate: inputs.electricityRate,
        roofArea: inputs.roofArea,
        monthlyBill: inputs.monthlyBill,
      }),
    [inputs.recommendedKw, inputs.electricityRate, inputs.roofArea, inputs.monthlyBill],
  )

  const clearCustomerState = useCallback(() => {
    setSelected(null)
    setInputs(EMPTY_INPUTS)
    setProposal(null)
    setPreviewOpen(false)
    setConfirmOpen(false)
    setGenerateError(null)
    setSendError(null)
    setSendSuccess(null)
    setCustomerError(null)
  }, [])

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = search.trim()
    if (!q || searching) return
    setSearching(true)
    setSearchError(null)
    try {
      const customers = await crmService.searchCustomers(q)
      setResults(customers)
      setSearched(true)
      if (customers.length === 0) setSearchError('No customer found for this search.')
    } catch {
      setResults([])
      setSearched(true)
      setSearchError('Customer search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }, [search, searching])

  const handleSelect = useCallback(async (customer: CrmCustomer) => {
    clearCustomerState()
    setLoadingCustomer(true)
    try {
      const bundle = await adminProposalService.getCustomerBundle(customer.id)
      if (!bundle) {
        setCustomerError('Customer not found.')
        return
      }
      setSelected(bundle)
      const bill = bundle.latest_bill
      setInputs({
        monthlyBill: numOrNull(bill?.bill_amount)?.toString() ?? '',
        monthlyUnits: numOrNull(bill?.monthly_units)?.toString() ?? '',
        electricityRate: numOrNull(bill?.per_unit_rate)?.toString() ?? '8.0',
        roofArea: '',
        recommendedKw: numOrNull(bill?.recommended_kw)?.toString() ?? '',
        address: textOrEmpty(bundle.address),
        city: textOrEmpty(bundle.city),
        vendorName: 'Get Solar Energy',
      })
    } catch {
      setCustomerError('Unable to load customer data. Please try again.')
    } finally {
      setLoadingCustomer(false)
    }
  }, [clearCustomerState])

  const setField = useCallback((field: keyof ProposalInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }, [])

  const validateInputs = useCallback((): string | null => {
    if (!(parseFloat(inputs.monthlyBill) > 0)) {
      return 'Monthly electricity bill is required to generate this proposal.'
    }
    if (!(parseFloat(inputs.monthlyUnits) > 0)) {
      return 'Monthly electricity consumption (units) is required to generate this proposal.'
    }
    if (!(parseFloat(inputs.recommendedKw) > 0)) {
      return 'Recommended system size (kW) is required to generate this proposal.'
    }
    return null
  }, [inputs])

  const handleGenerate = useCallback(async () => {
    if (!selected || generating) return
    const validationError = validateInputs()
    if (validationError) {
      setGenerateError(validationError)
      return
    }
    setGenerating(true)
    setGenerateError(null)
    setProposal(null)
    setPreviewOpen(false)
    setSendError(null)
    setSendSuccess(null)
    try {
      const result = await adminProposalService.generate({
        customer_id: selected.customer_id,
        customer_name: selected.customer_name,
        customer_address: inputs.address,
        city: inputs.city,
        monthly_units: parseFloat(inputs.monthlyUnits),
        monthly_bill_rs: parseFloat(inputs.monthlyBill),
        per_unit_rate: parseFloat(inputs.electricityRate) || 8.0,
        recommended_kw: parseFloat(inputs.recommendedKw),
        roof_area_sqft: parseFloat(inputs.roofArea) || 0,
        vendor_name: inputs.vendorName || 'Get Solar Energy',
      })
      if (!result || result.success !== true || !result.data) {
        throw new Error(result?.error || 'Proposal generation failed. Please try again.')
      }
      if (String(result.data.customer_id) !== String(selected.customer_id)) {
        throw new Error('Proposal customer mismatch. Please regenerate.')
      }
      setProposal(result.data)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Proposal generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [selected, generating, validateInputs, inputs])

  const previewForm = useMemo(() => ({
    customerName: selected?.customer_name || '',
    phone: selected?.phone || '',
    email: selected?.email || '',
    city: inputs.city,
    address: inputs.address,
    roofArea: inputs.roofArea,
    monthlyBill: inputs.monthlyBill,
    monthlyUnits: inputs.monthlyUnits,
    electricityRate: inputs.electricityRate,
    recommendedKw: inputs.recommendedKw,
    panelType: 'Tier-1 Mono PERC',
    inverterType: '5kW 3-Phase MPPT String Inverter',
    batteryOption: 'None (Grid-Tied Net Metering)',
  }), [selected, inputs])

  const handleExportPdf = useCallback(async () => {
    if (!proposal) return
    setIsExportingPdf(true)
    try {
      await generateProposalPdf({
        form: previewForm,
        insights,
        proposal: { id: proposal.proposal_reference, ...proposal },
        version: 'v1.0',
      })
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate PDF document. Please try again.')
    } finally {
      setIsExportingPdf(false)
    }
  }, [proposal, previewForm, insights])

  const handleSend = useCallback(async () => {
    if (!selected || !proposal || sending) return
    setSending(true)
    setSendError(null)
    try {
      const result = await adminProposalService.send(selected.customer_id, proposal)
      if (!result || result.success !== true) {
        throw new Error('Unable to send the proposal right now. Please try again.')
      }
      setSendSuccess(`Proposal sent to ${result.recipient || selected.email || 'the customer'}. Reference: ${result.proposal_reference || proposal.proposal_reference}.`)
      setConfirmOpen(false)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unable to send the proposal right now. Please try again.')
    } finally {
      setSending(false)
    }
  }, [selected, proposal, sending])

  return (
    <div className="ew-page" role="tabpanel" aria-label="admin proposals">
      <div className="card-glass" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Admin Proposal Management
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Select a customer, review auto-filled data, generate a proposal, and send it to the customer.
        </p>
      </div>

      <div className="card-base" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="ew-divider-head">
          <h3 className="ew-divider-title">Customer Selection</h3>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '540px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search Customer ID / Name / Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={searching}
            style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={searching || !search.trim()} style={{ padding: '9px 16px', fontSize: '12px' }}>
            {searching ? 'Searching...' : 'Search Customer'}
          </button>
        </form>
        {searchError && (
          <div role="alert" style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-primary)' }}>
            {searchError}
          </div>
        )}
        {searched && results.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.slice(0, 8).map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                  <strong>Customer ID: {c.consumerNumber}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}> · {c.customerName} · {c.email || 'no email on record'}</span>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSelect(c)} disabled={loadingCustomer}>
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(54, 211, 153, 0.25)', background: 'rgba(54, 211, 153, 0.06)', fontSize: '12px', color: 'var(--text-primary)' }}>
            <strong>Selected Customer</strong>
            <div>ID: {selected.consumer_number} · {selected.customer_name} · {selected.email || 'no email on record'}</div>
          </div>
        )}
        {loadingCustomer && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading customer...</p>}
        {customerError && (
          <div role="alert" style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-primary)' }}>
            {customerError}
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="card-base" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="ew-divider-head">
              <h3 className="ew-divider-title">Customer Information (auto-filled, read-only)</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--text-primary)' }}>
              <div><strong>Customer ID:</strong> {selected.consumer_number}</div>
              <div><strong>Name:</strong> {selected.customer_name}</div>
              <div><strong>Email:</strong> {selected.email || '—'}</div>
              <div><strong>Phone:</strong> {selected.phone || '—'}</div>
            </div>
          </div>

          <div className="card-base" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="ew-divider-head">
              <h3 className="ew-divider-title">Proposal Configuration (admin-editable)</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {([
                ['address', 'Address'],
                ['city', 'City'],
                ['monthlyBill', 'Monthly Bill (₹)'],
                ['monthlyUnits', 'Monthly Units (kWh)'],
                ['electricityRate', 'Electricity Rate (₹/kWh)'],
                ['roofArea', 'Roof Area (sq ft)'],
                ['recommendedKw', 'System Size (kW)'],
                ['vendorName', 'Vendor Name'],
              ] as Array<[keyof ProposalInputs, string]>).map(([field, label]) => (
                <div key={field}>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input
                    type="text"
                    value={inputs[field]}
                    onChange={(e) => setField(field, e.target.value)}
                    disabled={generating}
                    placeholder={inputs[field] ? undefined : '—'}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              ))}
            </div>
            {generateError && (
              <div role="alert" style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', fontSize: '12px', color: 'var(--text-primary)' }}>
                {generateError}
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ padding: '9px 16px', fontSize: '12px' }}>
                {generating ? 'Generating...' : 'Generate Proposal'}
              </button>
              {proposal && (
                <button type="button" className="btn btn-ghost" onClick={() => setPreviewOpen(true)} style={{ padding: '9px 16px', fontSize: '12px' }}>
                  Preview Proposal
                </button>
              )}
            </div>
          </div>

          {proposal && (
            <div className="card-base" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div className="ew-divider-head">
                <h3 className="ew-divider-title">Generated Proposal</h3>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Reference: <strong>{String(proposal.proposal_reference)}</strong> · Generated:{' '}
                {String(proposal.generated_at)} · For: {selected.customer_name} ({selected.consumer_number})
              </div>
              {sendSuccess && (
                <div role="status" style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(54, 211, 153, 0.08)', border: '1px solid rgba(54, 211, 153, 0.25)', fontSize: '12px', color: 'var(--text-primary)' }}>
                  {sendSuccess}
                </div>
              )}
              {sendError && (
                <div role="alert" style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', fontSize: '12px', color: 'var(--text-primary)' }}>
                  {sendError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-primary" onClick={() => setConfirmOpen(true)} disabled={sending} style={{ padding: '9px 16px', fontSize: '12px' }}>
                  {sending ? 'Sending...' : 'Send Proposal'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {previewOpen && proposal && (
        <ProposalPreview
          form={previewForm}
          insights={insights}
          proposal={{ id: String(proposal.proposal_reference), ...proposal }}
          version="v1.0"
          onClose={() => setPreviewOpen(false)}
          onExportPdf={handleExportPdf}
          isExportingPdf={isExportingPdf}
        />
      )}

      {confirmOpen && selected && proposal && (
        <div role="dialog" aria-modal="true" aria-label="Confirm proposal send" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card-base" style={{ padding: 'var(--space-5)', maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Send proposal to:
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {selected.customer_name}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              {selected.consumer_number} · {selected.email || 'no email on record'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Reference: {String(proposal.proposal_reference)}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)} disabled={sending} style={{ padding: '9px 16px', fontSize: '12px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ padding: '9px 16px', fontSize: '12px' }}>
                {sending ? 'Sending...' : 'Send Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
