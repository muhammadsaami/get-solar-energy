import { useState, useEffect, useCallback, useRef } from 'react'
import { crmService } from '../../services/crm.service'
import type { CrmTaskItem, CrmMeetingItem, CrmFollowUpItem, CrmCommunicationItem } from './crm.types'

interface UnifiedEvent {
  id: string
  type: 'task' | 'meeting' | 'followup' | 'communication'
  title: string
  description: string
  user: string
  status: string
  timestamp: string
  color: string
  icon: string
}

const EVENT_CONFIG: Record<string, { color: string; icon: string }> = {
  task: { color: 'var(--color-blue)', icon: 'icon-check-square' },
  meeting: { color: 'var(--color-purple)', icon: 'icon-calendar' },
  followup: { color: 'var(--color-amber)', icon: 'icon-clock' },
  communication: { color: 'var(--color-green)', icon: 'icon-message-square' },
}

function buildEvents(tasks: CrmTaskItem[], meetings: CrmMeetingItem[], followups: CrmFollowUpItem[], communications: CrmCommunicationItem[]): UnifiedEvent[] {
  const events: UnifiedEvent[] = []

  for (const t of tasks) {
    events.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title,
      description: `${t.department} · ${t.assignedTo || 'Unassigned'}${t.notes ? ` — ${t.notes}` : ''}`,
      user: t.assignedTo || 'System',
      status: t.status,
      timestamp: t.dueDate || t.createdAt,
      ...EVENT_CONFIG.task,
    })
  }

  for (const m of meetings) {
    events.push({
      id: `meeting-${m.id}`,
      type: 'meeting',
      title: m.title,
      description: `${m.meetingType}${m.outcome ? ` · ${m.outcome}` : ''}`,
      user: m.assignedTo || 'System',
      status: m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '',
      timestamp: m.scheduledDate || '',
      ...EVENT_CONFIG.meeting,
    })
  }

  for (const f of followups) {
    events.push({
      id: `followup-${f.id}`,
      type: 'followup',
      title: f.title,
      description: `${f.priority} priority${f.notes ? ` — ${f.notes}` : ''}`,
      user: 'System',
      status: f.status,
      timestamp: f.dueDate || '',
      ...EVENT_CONFIG.followup,
    })
  }

  for (const c of communications) {
    events.push({
      id: `comm-${c.id}`,
      type: 'communication',
      title: c.subject || c.channel,
      description: `${c.channel} · ${c.sender} → ${c.receiver}${c.message ? ` — ${c.message.substring(0, 100)}` : ''}`,
      user: c.sender,
      status: c.deliveryStatus,
      timestamp: c.createdAt,
      ...EVENT_CONFIG.communication,
    })
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return events
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'sent' || s === 'delivered') return { background: 'rgba(34,197,94,0.15)', color: 'var(--color-green)' }
  if (s === 'pending' || s === 'in progress') return { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)' }
  if (s === 'overdue' || s === 'cancelled') return { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)' }
  return { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }
}

export default function CrmActivityTimeline() {
  const [events, setEvents] = useState<UnifiedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const pageRef = useRef(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (page = 1, append = false) => {
    if (page === 1) { setLoading(true); setError(null) } else { setLoadingMore(true) }
    try {
      const [tasks, meetings, followups] = await Promise.all([
        crmService.getTasks(),
        crmService.getMeetings(),
        crmService.getFollowups(),
      ])
      const all = buildEvents(tasks, meetings, followups, [])
      const merged = append ? [...events, ...all] : all
      const unique = merged.filter((e, i, a) => a.findIndex(x => x.id === e.id) === i)
      setEvents(unique)
      setHasMore(all.length >= 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline')
    } finally {
      setLoading(false); setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        pageRef.current += 1
        load(pageRef.current, true)
      }
    }, { rootMargin: '200px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, load])

  const filtered = events.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    }
    return true
  })

  const FILTERS = [
    { id: 'all', label: 'All Events' },
    { id: 'task', label: 'Tasks' },
    { id: 'meeting', label: 'Meetings' },
    { id: 'followup', label: 'Follow-ups' },
    { id: 'communication', label: 'Communications' },
  ]

  if (error && !events.length) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
        <p>Failed to load timeline</p>
        <button className="btn btn-primary btn-sm" onClick={() => load()}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search timeline..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search timeline events"
          style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', width: 220,
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <div className="skeleton-loader" style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-loader" style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 4 }} />
                <div className="skeleton-loader" style={{ width: '40%', height: 12, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {search || filter !== 'all' ? 'No events match your search' : 'No timeline events yet'}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {filtered.map((ev, i) => (
            <div key={ev.id} style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: 'var(--space-4)', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: ev.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${ev.color}`,
                }} />
                {i < filtered.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{ev.title}</span>
                  <span style={{
                    fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                  }}>
                    {ev.type}
                  </span>
                  <span style={getStatusBadgeStyle(ev.status)}>{ev.status}</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{ev.description}</div>
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                </div>
              </div>
            </div>
          ))}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading more...</div>}
        </div>
      )}
    </div>
  )
}
