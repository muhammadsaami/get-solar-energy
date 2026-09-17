import React, { useState, useEffect } from 'react'
import { getVendorTasks } from '../services/vendor.service'
import WorkOrderCard from '../components/WorkOrderCard'
import VendorEmptyState from '../components/VendorEmptyState'
import DashboardHeader from '../components/DashboardHeader'
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
    <div className="animate-fade-in">
      <DashboardHeader
        title="My Work & Assigned Operations"
        subtitle="Manage assigned field tasks, site visit schedules, and installation work orders."
        badgeText="Operational Dispatch"
      />

      <div className="vendor-glass-card" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'vendor-btn-primary' : 'vendor-btn-ghost'}
            style={{ flex: 1, justifyContent: 'center', padding: '10px 14px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'visits' && (
        <VendorEmptyState
          icon="icon-mappin"
          title="No Scheduled Site Visits"
          description="You're all caught up. Site visits will appear here once scheduled by the admin or CRM dispatch system."
        />
      )}

      {activeTab === 'installations' && (
        <VendorEmptyState
          icon="icon-wrench"
          title="No Active Installation Projects"
          description="Active installation projects managed by your field crew will appear here."
        />
      )}

      {(activeTab === 'tasks' || activeTab === 'orders') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="vendor-glass-card vendor-skeleton" style={{ height: '76px' }} />
            ))
          ) : filteredTasks.length === 0 ? (
            <VendorEmptyState
              icon={activeTab === 'orders' ? 'icon-clipboard-check' : 'icon-clipboard'}
              title={activeTab === 'orders' ? 'No Work Orders Assigned' : 'No Tasks Pending'}
              description={activeTab === 'orders' ? 'Great job! Installation work orders will appear here when assigned.' : "You're all caught up. Assigned tasks will appear here."}
            />
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
