import React from 'react'
import { MdOutlineDescription, MdAccessTime } from 'react-icons/md'
import { useCustomer360 } from './useCrmQueries'

interface ProposalCard {
  id: string
  customerId: number
  customerName: string
  consumerNumber: string
  systemSize: number
  proposalValue: number
  estimatedSavings: number
  roi: number
  expiry: string
  salesperson: string
  status: 'Draft' | 'Generated' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted'
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'var(--text-muted)',
  Generated: 'var(--color-blue)',
  Sent: 'var(--color-purple)',
  Viewed: 'var(--color-cyan)',
  Accepted: 'var(--color-green)',
  Rejected: 'var(--color-red)',
  Expired: 'var(--color-orange)',
  Converted: 'var(--color-emerald)',
}

interface Props {
  customerId?: number
  compact?: boolean
}

export default function CrmProposalTracking({ customerId, compact }: Props) {
  const { data: c360, isLoading: loading } = useCustomer360(customerId ?? null)

  const proposals: ProposalCard[] = React.useMemo(() => {
    if (!c360?.proposal) return []
    const p = c360.proposal
    const c = c360.customer
    const card: ProposalCard = {
      id: p.proposalRef || `PROP-${c.id}`,
      customerId: c.id,
      customerName: c.customerName || '',
      consumerNumber: c.consumerNumber || '',
      systemSize: p.recommendedKw ?? 0,
      proposalValue: p.netSystemCost ?? 0,
      estimatedSavings: p.savings25yr ?? 0,
      roi: p.paybackYears ? Math.round((1 / p.paybackYears) * 100) : 0,
      expiry: '',
      salesperson: c.salesperson || '',
      status: c.status === 'Won' ? 'Accepted' : p.proposalRef ? 'Generated' : 'Draft',
    }
    return [card]
  }, [c360])

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <div className="skeleton-loader" style={{ width: '100%', height: 100, borderRadius: 8 }} />
      </div>
    )
  }

  if (!proposals.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {!compact && (
        <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Proposal Tracking</h4>
      )}
      {proposals.map(p => (
        <div key={p.id} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                <MdOutlineDescription size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {p.id}
                </span>
              </div>
              {!compact && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {p.customerName} · {p.consumerNumber}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 'var(--font-size-2xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: `${STATUS_COLORS[p.status] || 'var(--text-muted)'}20`,
              color: STATUS_COLORS[p.status] || 'var(--text-muted)',
              fontWeight: 600, whiteSpace: 'nowrap',
            }}>{p.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Metric label="System" value={`${p.systemSize} kW`} />
            <Metric label="Value" value={`₹${(p.proposalValue / 100000).toFixed(1)}L`} />
            <Metric label="Savings" value={`₹${(p.estimatedSavings / 100000).toFixed(1)}L`} />
            <Metric label="ROI" value={`${p.roi}%`} />
          </div>
          {p.expiry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>
              <MdAccessTime size={12} />
              Expires: {new Date(p.expiry).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{value}</div>
    </div>
  )
}
