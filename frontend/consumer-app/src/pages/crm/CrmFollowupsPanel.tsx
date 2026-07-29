import { useState, useEffect, useCallback } from 'react'
import { crmService } from '../../services/crm.service'
import type { CrmFollowUpItem } from './crm.types'

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  High: { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' },
  Medium: { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' },
  Low: { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Pending: { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' },
  Completed: { background: 'rgba(34,197,94,0.15)', color: 'var(--color-green)' },
  Cancelled: { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' },
  Overdue: { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' },
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date() && !isNaN(new Date(dueDate).getTime())
}

function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  const d = new Date(dueDate)
  const t = new Date()
  return d.toDateString() === t.toDateString()
}

const defaultFollowup = {
  customer_id: 0,
  title: '',
  due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  priority: 'Medium',
  status: 'Pending',
  notes: '',
}

export default function CrmFollowupsPanel() {
  const [followups, setFollowups] = useState<CrmFollowUpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultFollowup)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await crmService.getFollowups()
      setFollowups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = followups.filter(f => {
    if (filter === 'overdue') return isOverdue(f.dueDate) && f.status !== 'Completed'
    if (filter === 'today') return isToday(f.dueDate) && f.status !== 'Completed'
    if (filter === 'completed') return f.status === 'Completed'
    if (filter === 'upcoming') return f.dueDate && !isOverdue(f.dueDate) && !isToday(f.dueDate) && f.status !== 'Completed'
    return true
  }).filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.title.toLowerCase().includes(q) || (f.notes || '').toLowerCase().includes(q)
  })

  const handleSave = async () => {
    if (!form.title.trim() || !form.customer_id) return
    setSaving(true)
    try {
      if (editingId !== null) {
        const updated = await crmService.updateFollowup(editingId, form as unknown as Record<string, unknown>)
        if (updated) setFollowups(prev => prev.map(f => f.id === editingId ? updated : f))
      } else {
        const created = await crmService.createFollowup(form as unknown as Record<string, unknown>)
        if (created) setFollowups(prev => [created, ...prev])
      }
      setShowForm(false); setEditingId(null); setForm(defaultFollowup)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleEdit = (f: CrmFollowUpItem) => {
    setForm({
      customer_id: 0,
      title: f.title,
      due_date: f.dueDate || '',
      priority: f.priority,
      status: f.status,
      notes: f.notes || '',
    })
    setEditingId(f.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this follow-up?')) return
    const ok = await crmService.deleteFollowup(id)
    if (ok) setFollowups(prev => prev.filter(f => f.id !== id))
  }

  const handleQuickStatus = async (id: number, status: string) => {
    const updated = await crmService.updateFollowup(id, { status })
    if (updated) setFollowups(prev => prev.map(f => f.id === id ? updated : f))
  }

  const FILTERS = [
    { id: 'all', label: `All (${followups.length})` },
    { id: 'overdue', label: `Overdue (${followups.filter(f => isOverdue(f.dueDate) && f.status !== 'Completed').length})` },
    { id: 'today', label: `Due Today (${followups.filter(f => isToday(f.dueDate) && f.status !== 'Completed').length})` },
    { id: 'upcoming', label: `Upcoming (${followups.filter(f => f.dueDate && !isOverdue(f.dueDate) && !isToday(f.dueDate) && f.status !== 'Completed').length})` },
    { id: 'completed', label: `Completed (${followups.filter(f => f.status === 'Completed').length})` },
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
          <input type="text" placeholder="Search follow-ups..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search follow-ups"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: 180 }} />
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setForm(defaultFollowup); setShowForm(true) }}>+ New Follow-up</button>
        </div>
      </div>

      {error && <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-red)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      {showForm && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{editingId ? 'Edit Follow-up' : 'New Follow-up'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <input type="text" placeholder="Follow-up title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} aria-label="Title"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
            <input type="number" placeholder="Customer ID" value={form.customer_id || ''} onChange={e => setForm(f => ({ ...f, customer_id: Number(e.target.value) }))} aria-label="Customer ID"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} aria-label="Due date"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} aria-label="Priority"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} aria-label="Status"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['Pending', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} aria-label="Notes"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !form.title.trim() || !form.customer_id}>
              {saving ? 'Saving...' : editingId ? 'Update Follow-up' : 'Create Follow-up'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultFollowup) }}>Cancel</button>
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
          {search || filter !== 'all' ? 'No follow-ups match your filters' : 'No follow-ups yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${f.priority === 'High' ? 'var(--color-red)' : f.priority === 'Medium' ? 'var(--color-amber)' : 'var(--border-subtle)'}`,
              opacity: f.status === 'Completed' ? 0.6 : 1,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', textDecoration: f.status === 'Completed' ? 'line-through' : 'none' }}>{f.title}</span>
                  <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', ...PRIORITY_STYLE[f.priority] }}>{f.priority}</span>
                  <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', ...STATUS_STYLE[f.status] || STATUS_STYLE.Pending }}>{f.status}</span>
                  {isOverdue(f.dueDate) && f.status !== 'Completed' && (
                    <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' }}>Overdue</span>
                  )}
                  {isToday(f.dueDate) && f.status !== 'Completed' && (
                    <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'rgba(34,197,94,0.15)', color: 'var(--color-green)' }}>Due Today</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {f.dueDate ? `Due: ${new Date(f.dueDate).toLocaleDateString()}` : 'No due date'}
                </div>
                {f.notes && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{f.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {f.status !== 'Completed' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleQuickStatus(f.id, 'Completed')} aria-label="Mark complete" title="Mark complete"
                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)' }}>✓</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(f)} aria-label="Edit follow-up" title="Edit"
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)' }}>✎</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f.id)} aria-label="Delete follow-up" title="Delete"
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-red)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
