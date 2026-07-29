import React, { useState, useEffect } from 'react'
import { getVendorTasks } from '../services/vendor.service'
import WorkOrderCard from '../components/WorkOrderCard'
import VendorEmptyState from '../components/VendorEmptyState'
import type { VendorTask } from '../types/vendor.types'

type Tab = 'tasks' | 'visits' | 'installations' | 'orders'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'visits', label: 'Site Visits' },
  { id: 'installations', label: 'Installations' },
  { id: 'orders', label: 'Work Orders' },
]

export default function MyWork() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [tasks, setTasks] = useState<VendorTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getVendorTasks()
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'orders') return t.department === 'Installation'
    if (activeTab === 'tasks') return t.department !== 'Installation'
    return false
  })

  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="card-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>
          My Work
        </h1>
      </div>

      <div className="card-glass" style={{ padding: 'var(--space-2)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-1)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
              border: 'none', borderRadius: 'var(--radius-md)',
              background: activeTab === tab.id ? 'var(--color-orange-surface)' : 'transparent',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--color-orange)' : 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)',
            }}
            aria-label={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'visits' && (
        <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
          <VendorEmptyState
            icon="icon-mappin"
            title="No Site Visits"
            description="You're all caught up. Site visits will appear here once scheduled by the admin or via the CRM."
          />
        </div>
      )}

      {activeTab === 'installations' && (
        <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
          <VendorEmptyState
            icon="icon-wrench"
            title="No Installations"
            description="Active installation projects managed by your team will appear here."
          />
        </div>
      )}

      {(activeTab === 'tasks' || activeTab === 'orders') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 76, borderRadius: 'var(--radius-lg)' }} />
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="card-glass">
              <VendorEmptyState
                icon={activeTab === 'orders' ? 'icon-clipboard-check' : 'icon-clipboard'}
                title={activeTab === 'orders' ? 'No Work Orders' : 'No Tasks'}
                description={activeTab === 'orders' ? 'Great job. Installation work orders will appear here when assigned.' : 'You\'re all caught up. Assigned tasks will appear here.'}
              />
            </div>
          ) : (
            filteredTasks.map((t) => (
              <WorkOrderCard key={t.id} task={t} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
