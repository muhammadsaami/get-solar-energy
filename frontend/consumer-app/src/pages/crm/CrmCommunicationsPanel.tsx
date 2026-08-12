import { useState, useCallback } from 'react'
import { crmService } from '../../services/crm.service'
import type { CrmCommunicationItem } from './crm.types'

const CHANNEL_STYLE: Record<string, React.CSSProperties> = {
  Email: { background: 'rgba(59,130,246,0.15)', color: 'var(--color-blue)' },
  SMS: { background: 'rgba(23,168,229,0.15)', color: 'var(--color-blue)' },
  WhatsApp: { background: 'rgba(34,197,94,0.15)', color: 'var(--color-green)' },
  'Phone Call': { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' },
  'Internal Note': { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
}

const defaultComm = {
  customer_id: 0,
  channel: 'Phone Call' as string,
  subject: '',
  message: '',
  sender: '',
  receiver: '',
  delivery_status: 'Sent',
}

export default function CrmCommunicationsPanel() {
  const [communications, setCommunications] = useState<CrmCommunicationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultComm)
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState<number | null>(null)

  const load = useCallback(async (cid: number) => {
    setLoading(true); setError(null)
    try {
      const data = await crmService.getCustomerCommunications(cid, 0, 100)
      setCommunications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communications')
    } finally { setLoading(false) }
  }, [])

  const handleSave = async () => {
    if (!form.message.trim() || !form.customer_id || !form.sender || !form.receiver) return
    setSaving(true)
    try {
      const created = await crmService.createCommunication(form as unknown as Record<string, unknown>)
      if (created) setCommunications(prev => [created, ...prev])
      setShowForm(false); setForm(defaultComm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const filtered = communications.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.subject || '').toLowerCase().includes(q) || c.message.toLowerCase().includes(q) || c.sender.toLowerCase().includes(q) || c.receiver.toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="number" placeholder="Customer ID" value={customerId || ''}
            onChange={e => { const v = Number(e.target.value); setCustomerId(v); if (v > 0) load(v) }}
            aria-label="Customer ID"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: 120 }}
          />
          <button className="btn btn-outline btn-sm" onClick={() => { if (customerId && customerId > 0) load(customerId) }} disabled={!customerId}>
            Load
          </button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
          <input type="text" placeholder="Search communications..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search communications"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: 180 }} />
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(defaultComm); setShowForm(true) }}>+ Log Communication</button>
        </div>
      </div>

      {error && <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-red)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      {showForm && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Log Communication</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <input type="number" placeholder="Customer ID *" value={form.customer_id || ''} onChange={e => setForm(f => ({ ...f, customer_id: Number(e.target.value) }))} aria-label="Customer ID"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} aria-label="Channel"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['Email', 'SMS', 'WhatsApp', 'Phone Call', 'Internal Note'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="Sender *" value={form.sender} onChange={e => setForm(f => ({ ...f, sender: e.target.value }))} aria-label="Sender"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="text" placeholder="Receiver *" value={form.receiver} onChange={e => setForm(f => ({ ...f, receiver: e.target.value }))} aria-label="Receiver"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="text" placeholder="Subject (optional)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} aria-label="Subject"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <select value={form.delivery_status} onChange={e => setForm(f => ({ ...f, delivery_status: e.target.value }))} aria-label="Delivery status"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['Sent', 'Delivered', 'Read', 'Failed'].map(s => <option key={s}>{s}</option>)}
            </select>
            <textarea placeholder="Message *" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} aria-label="Message" rows={3}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !form.message.trim() || !form.customer_id || !form.sender || !form.receiver}>
              {saving ? 'Saving...' : 'Log Communication'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm(defaultComm) }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : !customerId ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Enter a Customer ID above to view their communications.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {search ? 'No communications match your search' : 'No communications recorded for this customer.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(c => (
            <div key={c.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{c.subject || c.channel}</span>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', ...CHANNEL_STYLE[c.channel] || CHANNEL_STYLE['Internal Note'] }}>
                    {c.channel}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>{c.message}</div>
              <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-3)' }}>
                <span>From: {c.sender}</span>
                <span>To: {c.receiver}</span>
                <span style={{ color: c.deliveryStatus === 'Delivered' || c.deliveryStatus === 'Read' ? 'var(--color-green)' : 'var(--text-muted)' }}>{c.deliveryStatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
