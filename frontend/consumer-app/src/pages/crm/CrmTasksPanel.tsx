import { useState, useEffect, useCallback } from 'react'
import { crmService } from '../../services/crm.service'
import type { CrmTaskItem } from './crm.types'

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  High: { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' },
  Medium: { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' },
  Low: { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Completed: { background: 'rgba(34,197,94,0.15)', color: 'var(--color-green)' },
  'In Progress': { background: 'rgba(59,130,246,0.15)', color: 'var(--color-blue)' },
  Pending: { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' },
  Cancelled: { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' },
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date() && !isNaN(new Date(dueDate).getTime())
}

const defaultTask = {
  customer_id: null as number | null,
  title: '',
  department: 'Sales',
  assigned_to: '',
  priority: 'Medium',
  due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  status: 'Pending',
  progress: 0,
  notes: '',
}

export default function CrmTasksPanel() {
  const [tasks, setTasks] = useState<CrmTaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultTask)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await crmService.getTasks()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editingId !== null) {
        const updated = await crmService.updateTask(editingId, form as unknown as Record<string, unknown>)
        if (updated) setTasks(prev => prev.map(t => t.id === editingId ? updated : t))
      } else {
        const created = await crmService.createTask(form as unknown as Record<string, unknown>)
        if (created) setTasks(prev => [created, ...prev])
      }
      setShowForm(false); setEditingId(null); setForm(defaultTask)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleEdit = (task: CrmTaskItem) => {
    setForm({
      customer_id: null,
      title: task.title,
      department: task.department || 'Sales',
      assigned_to: task.assignedTo || '',
      priority: task.priority,
      due_date: task.dueDate || '',
      status: task.status,
      progress: task.progress || 0,
      notes: task.notes || '',
    })
    setEditingId(task.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return
    const ok = await crmService.deleteTask(id)
    if (ok) setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleQuickStatus = async (id: number, status: string) => {
    const updated = await crmService.updateTask(id, { status })
    if (updated) setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      await crmService.updateTask(id, { status: 'Completed', progress: 100 })
    }
    setSelectedIds(new Set())
    load()
  }

  const filtered = tasks.filter(t => {
    if (filter === 'open') return t.status !== 'Completed' && t.status !== 'Cancelled'
    if (filter === 'completed') return t.status === 'Completed'
    if (filter === 'overdue') return isOverdue(t.dueDate) && t.status !== 'Completed'
    if (filter === 'high') return t.priority === 'High'
    return true
  }).filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || (t.assignedTo || '').toLowerCase().includes(q)
  })

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const FILTERS = [
    { id: 'all', label: `All (${tasks.length})` },
    { id: 'open', label: `Open (${tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length})` },
    { id: 'completed', label: `Completed (${tasks.filter(t => t.status === 'Completed').length})` },
    { id: 'overdue', label: `Overdue (${tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'Completed').length})` },
    { id: 'high', label: `High Priority (${tasks.filter(t => t.priority === 'High').length})` },
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
          {selectedIds.size > 0 && (
            <button className="btn btn-sm btn-primary" onClick={handleBulkComplete}>
              Complete {selectedIds.size} task{selectedIds.size > 1 ? 's' : ''}
            </button>
          )}
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search tasks"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: 180 }} />
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setForm(defaultTask); setShowForm(true) }}>+ New Task</button>
        </div>
      </div>

      {error && <div style={{ padding: 'var(--space-3)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-red)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      {showForm && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{editingId ? 'Edit Task' : 'New Task'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <input type="text" placeholder="Task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} aria-label="Task title"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} aria-label="Department"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['Sales', 'Survey', 'Installation', 'Finance', 'AMC', 'Support'].map(d => <option key={d}>{d}</option>)}
            </select>
            <input type="text" placeholder="Assigned to" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} aria-label="Assigned to"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} aria-label="Priority"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} aria-label="Due date"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} aria-label="Status"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="Progress %" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Math.min(100, Math.max(0, Number(e.target.value)))}))} aria-label="Progress"
              min={0} max={100}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }} />
            <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} aria-label="Notes"
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultTask) }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-loader" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {search || filter !== 'all' ? 'No tasks match your filters' : 'No tasks yet. Create one to get started.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${task.priority === 'High' ? 'var(--color-red)' : task.priority === 'Medium' ? 'var(--color-amber)' : 'var(--border-subtle)'}`,
              opacity: task.status === 'Completed' ? 0.6 : 1,
            }}>
              <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} aria-label={`Select ${task.title}`}
                style={{ marginTop: 3, accentColor: 'var(--color-blue)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>{task.title}</span>
                  <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', ...PRIORITY_STYLE[task.priority] }}>{task.priority}</span>
                  <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', ...STATUS_STYLE[task.status] || STATUS_STYLE.Pending }}>{task.status}</span>
                  {isOverdue(task.dueDate) && task.status !== 'Completed' && (
                    <span style={{ fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' }}>Overdue</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {task.department} · {task.assignedTo || 'Unassigned'}{task.dueDate ? ` · Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                </div>
                {task.progress != null && task.status !== 'Completed' && (
                  <div style={{ marginTop: 'var(--space-1)', height: 4, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
                    <div style={{ width: `${task.progress}%`, height: '100%', borderRadius: 2, background: 'var(--color-blue)', transition: 'width 0.3s ease' }} />
                  </div>
                )}
                {task.notes && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{task.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {task.status !== 'Completed' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleQuickStatus(task.id, 'Completed')} aria-label="Mark complete" title="Mark complete"
                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)' }}>✓</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(task)} aria-label="Edit task" title="Edit"
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)' }}>✎</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)} aria-label="Delete task" title="Delete"
                  style={{ padding: '4px 8px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-red)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
