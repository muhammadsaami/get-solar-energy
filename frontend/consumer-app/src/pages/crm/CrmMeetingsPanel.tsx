import { useState, useEffect, useCallback } from 'react'
import { crmService } from '../../services/crm.service'
import type { CrmMeetingItem } from './crm.types'

const TYPE_STYLE: Record<string, React.CSSProperties> = {
  'Phone': { background: 'rgba(59,130,246,0.15)', color: 'var(--color-blue)' },
  'Video': { background: 'rgba(23,168,229,0.15)', color: 'var(--color-blue)' },
  'Office': { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' },
  'Site Visit': { background: 'rgba(34,197,94,0.15)', color: 'var(--color-green)' },
}

const defaultMeeting = {
  customer_id: 0,
  title: '',
  meeting_type: 'Phone',
  scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '10:00',
  assigned_to: '',
  outcome: '',
  notes: '',
  next_action: '',
}

export default function CrmMeetingsPanel() {
  const [meetings, setMeetings] = useState<CrmMeetingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('upcoming')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultMeeting)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await crmService.getMeetings()
      setMeetings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const now = new Date()

  const filtered = meetings.filter(m => {
    const meetingDate = m.scheduledDate ? new Date(m.scheduledDate) : null
    if (filter === 'upcoming') return meetingDate && meetingDate >= now
    if (filter === 'completed') return m.outcome && m.outcome.toLowerCase() === 'completed'
    if (filter === 'cancelled') return m.outcome && m.outcome.toLowerCase() === 'cancelled'
    return true
  }).filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.title.toLowerCase().includes(q) || (m.assignedTo || '').toLowerCase().includes(q)
  })

  const handleSave = async () => {
    if (!form.title.trim() || !form.customer_id) return
    setSaving(true)
    try {
      if (editingId !== null) {
        const updated = await crmService.updateMeeting(editingId, form as unknown as Record<string, unknown>)
        if (updated) setMeetings(prev => prev.map(m => m.id === editingId ? updated : m))
      } else {
        const created = await crmService.createMeeting(form as unknown as Record<string, unknown>)
        if (created) setMeetings(prev => [created, ...prev])
      }
      setShowForm(false); setEditingId(null); setForm(defaultMeeting)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleEdit = (m: CrmMeetingItem) => {
    setForm({
      customer_id: 0,
      title: m.title,
      meeting_type: m.meetingType,
      scheduled_date: m.scheduledDate || '',
      scheduled_time: m.scheduledTime || '10:00',
      assigned_to: m.assignedTo || '',
      outcome: m.outcome || '',
      notes: '',
      next_action: '',
    })
    setEditingId(m.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this meeting?')) return
    const ok = await crmService.deleteMeeting(id)
    if (ok) setMeetings(prev => prev.filter(m => m.id !== id))
  }

  const FILTERS = [
    { id: 'all', label: `All (${meetings.length})` },
    { id: 'upcoming', label: `Upcoming (${meetings.filter(m => m.scheduledDate && new Date(m.scheduledDate) >= now).length})` },
    { id: 'completed', label: `Completed (${meetings.filter(m => m.outcome?.toLowerCase() === 'completed').length})` },
    { id: 'cancelled', label: `Cancelled (${meetings.filter(m => m.outcome?.toLowerCase() === 'cancelled').length})` },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
          <input type="text" placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search meetings"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: 180 }} />
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setForm(defaultMeeting); setShowForm(true) }}>+ Schedule Meeting</button>
        </div>
      </div>

      {error && <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-red)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      {showForm && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{editingId ? 'Edit Meeting' : 'Schedule Meeting'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <input type="text" placeholder="Meeting title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} aria-label="Meeting title"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
            <input type="number" placeholder="Customer ID" value={form.customer_id || ''} onChange={e => setForm(f => ({ ...f, customer_id: Number(e.target.value) }))} aria-label="Customer ID"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <select value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))} aria-label="Meeting type"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['Phone', 'Video', 'Office', 'Site Visit'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Assigned to" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} aria-label="Assigned to"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} aria-label="Date"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} aria-label="Time"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="text" placeholder="Outcome (optional)" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} aria-label="Outcome"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="text" placeholder="Next action (optional)" value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} aria-label="Next action"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} aria-label="Notes"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !form.title.trim() || !form.customer_id}>
              {saving ? 'Saving...' : editingId ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultMeeting) }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-loader" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {search || filter !== 'all' ? 'No meetings match your filters' : 'No meetings scheduled yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${m.outcome?.toLowerCase() === 'completed' ? 'var(--color-green)' : m.outcome?.toLowerCase() === 'cancelled' ? 'var(--color-red)' : 'var(--color-blue)'}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{m.title}</span>
                  <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', ...TYPE_STYLE[m.meetingType] || TYPE_STYLE.Phone }}>{m.meetingType}</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {m.assignedTo ? `${m.assignedTo} · ` : ''}
                  {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : ''}
                  {m.scheduledTime ? ` ${m.scheduledTime}` : ''}
                </div>
                {m.outcome && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>Outcome: {m.outcome}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(m)} aria-label="Edit meeting" title="Edit"
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)' }}>✎</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(m.id)} aria-label="Delete meeting" title="Delete"
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-red)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
