import React from 'react'
import { useNavigate } from 'react-router-dom'
import VendorHeroSection from '../components/VendorHeroSection'
import KpiCard from '../components/KpiCard'
import { useVendorDashboard } from '../hooks/useVendorDashboard'
import { ROUTES } from '../../config/routes'

const NUM = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0)

interface PipelineBucket {
  stage: string
  count: number
  pct: number
  color: string
}

interface Activity {
  id: string
  title: string
  desc: string
  actor: string
  status: string
  color: string
  time: string
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'var(--color-green)',
  amc: 'var(--color-green)',
  active: 'var(--color-orange)',
  on_hold: 'var(--color-yellow)',
  delayed: 'var(--color-red)',
  planning: 'var(--color-blue)',
  'in progress': 'var(--color-blue)',
}

export function VendorDashboard() {
  const navigate = useNavigate()
  const { data, kpis, todaysVisits, todaysTasks, overdueTasks, alerts, loading, error, refresh } = useVendorDashboard()

  const projects = Array.isArray(data?.projects) ? (data.projects as Array<Record<string, unknown>>) : []

  const kpiCards = [
    { title: 'Total Projects', value: String(kpis?.totalProjects ?? 0), subtext: 'across your pipeline', previousPeriod: 'portfolio', trend: { value: 'portfolio', positive: true }, icon: 'icon-folder', color: 'blue' as const },
    { title: 'Active Projects', value: `${kpis?.activeProjects ?? 0} Sites`, subtext: `${kpis?.activeInstallations ?? 0} in execution`, previousPeriod: 'now', trend: { value: `${kpis?.completionRate ?? 0}% done`, positive: true }, icon: 'icon-activity', color: 'orange' as const },
    { title: 'Pending Site Visits', value: String(kpis?.pendingSiteVisits ?? 0), subtext: 'surveys to schedule', previousPeriod: 'surveys', trend: { value: `${kpis?.surveysApproved ?? 0} approved`, positive: true }, icon: 'icon-calendar', color: 'cyan' as const },
    { title: 'Overdue Work Orders', value: String(kpis?.overdueWorkOrders ?? 0), subtext: 'need attention', previousPeriod: 'SLA', trend: { value: `${kpis?.slaCompliance ?? 0}% compliant`, positive: (kpis?.slaCompliance ?? 0) >= 90 }, icon: 'icon-alert-triangle', color: 'orange' as const },
    { title: 'AMC Visits (Week)', value: String(kpis?.amcVisitsThisWeek ?? 0), subtext: 'service visits planned', previousPeriod: 'AMC', trend: { value: 'on schedule', positive: true }, icon: 'icon-shield', color: 'green' as const },
    { title: 'Avg Health Score', value: `${kpis?.avgHealthScore ?? 0}%`, subtext: `${kpis?.avgProgress ?? 0}% avg progress`, previousPeriod: 'health', trend: { value: 'healthy', positive: (kpis?.avgHealthScore ?? 0) >= 80 }, icon: 'icon-trending', color: 'green' as const },
  ]

  const buckets: Record<string, { count: number; progSum: number }> = {}
  for (const p of projects) {
    const st = String(p.status ?? 'active')
    const b = buckets[st] || { count: 0, progSum: 0 }
    b.count += 1
    b.progSum += NUM(p.progress)
    buckets[st] = b
  }
  const pipeline: PipelineBucket[] = Object.entries(buckets)
    .map(([stage, b]) => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: b.count,
      pct: b.count ? Math.round(b.progSum / b.count) : 0,
      color: STATUS_COLORS[stage.toLowerCase()] || 'var(--color-blue)',
    }))
    .sort((a, b2) => b2.count - a.count)

  const activities: Activity[] = []
  const push = (title: string, note: string, actor: string, status: string, color: string, key: string, time?: string) => {
    activities.push({ id: key, title, desc: note, actor, status, color, time: time || 'Today' })
  }
  for (const v of todaysVisits) {
    push(v.title || 'Site Visit', 'Site inspection for project', 'Site Visit', v.meetingType || 'Scheduled', 'var(--color-blue)', `visit-${v.id}`)
  }
  for (const t of todaysTasks) {
    const color = t.priority === 'high' ? 'var(--color-red)' : 'var(--color-orange)'
    push(t.title || 'Task', t.notes || 'Milestone task', t.assignedTo || 'Task', t.status || 'Pending', color, `task-${t.id}`, t.dueDate || 'Today')
  }
  for (const a of alerts) {
    const color = a.severity === 'critical' ? 'var(--color-red)' : 'var(--color-yellow)'
    push(a.title, a.description, a.severity === 'critical' ? 'Critical' : 'Warning', a.severity, color, `alert-${a.projectId ?? a.taskId ?? a.title}`)
  }

  const totalProjectValue = projects.reduce((sum, p) => sum + NUM(p.value ?? p.budget), 0)
  const totalProgress = projects.reduce((sum, p) => sum + NUM(p.progress), 0)
  const avgProgress = projects.length ? Math.round(totalProgress / projects.length) : 0

  const erpModules = [
    {
      id: 'revenue', title: 'Revenue', accent: 'var(--vendor-success)', icon: 'icon-trending-up',
      stat: `₹${(totalProjectValue / 100000).toFixed(1)}L`, statLabel: 'Projected pipeline value',
      footer: `${avgProgress}% avg delivery progress`, trend: '+',
    },
    {
      id: 'inventory', title: 'Inventory', accent: 'var(--vendor-primary)', icon: 'icon-box',
      stat: `${pipeline.length}`, statLabel: 'Pipeline stages tracked',
      footer: `${projects.length} total projects`, trend: '',
    },
    {
      id: 'teams', title: 'Teams', accent: 'var(--vendor-accent)', icon: 'icon-users',
      stat: `${kpis?.activeProjects ?? 0}`, statLabel: 'Projects under execution',
      footer: `${kpis?.pendingSiteVisits ?? 0} field assignments`, trend: '',
    },
    {
      id: 'payout', title: 'Payouts & Invoicing', accent: 'var(--vendor-primary)', icon: 'icon-file-text',
      stat: `${kpis?.overdueWorkOrders ?? 0}`, statLabel: 'Overdue work orders',
      footer: `${kpis?.completionRate ?? 0}% completion rate`, trend: '↓',
    },
  ]

  return (
    <div className="animate-fade-in">
      <VendorHeroSection
        kpis={kpis}
        visitCount={todaysVisits.length}
        taskCount={todaysTasks.length}
        overdueCount={overdueTasks.length}
        onRefresh={() => { refresh() }}
        onCreateProject={() => navigate(ROUTES.VENDOR_PROJECTS)}
        onAddCustomer={() => navigate(ROUTES.VENDOR_CUSTOMERS)}
        onCreateInvoice={() => navigate(ROUTES.VENDOR_PAYMENTS)}
        onAssignTeam={() => navigate(ROUTES.VENDOR_TEAMS)}
      />

      {error && (
        <div className="vendor-glass-card" style={{ padding: '16px', marginBottom: '24px', color: 'var(--vendor-danger)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpiCards.map((k) => (
          <KpiCard key={k.title} title={k.title} value={k.value} subtext={k.subtext} previousPeriod={k.previousPeriod} trend={k.trend} icon={k.icon} iconColor={k.color} loading={loading} />
        ))}
      </div>

      <div className="vendor-erp-modules" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vendor-text-primary)', margin: 0, fontFamily: 'var(--font-family)' }}>
            ERP Command Modules
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--vendor-success)', fontWeight: 700 }}>● All systems nominal</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {erpModules.map(mod => (
            <div key={mod.id} className="vendor-glass-card" style={{ padding: '18px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{mod.title}</span>
                <span style={{
                  width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${mod.accent}18`, border: `1px solid ${mod.accent}40`, color: mod.accent,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><use href={`#${mod.icon}`} /></svg>
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {mod.stat} {mod.trend && <span style={{ fontSize: '12px', color: mod.trend === '↓' ? 'var(--vendor-danger)' : 'var(--vendor-success)' }}>{mod.trend}</span>}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', marginTop: '4px' }}>{mod.statLabel}</div>
              <div style={{ fontSize: '10.5px', color: mod.accent, fontWeight: 700, marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>{mod.footer}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="vendor-glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vendor-text-primary)', margin: 0, fontFamily: 'var(--font-family)' }}>
                Installation Pipeline by Status
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--vendor-text-muted)' }}>
                Live progress across {projects.length} projects &middot; avg {avgProgress}%
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--vendor-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Ops</span>
          </div>

          {pipeline.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--vendor-text-muted)', margin: 0 }}>No projects assigned to this vendor yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {pipeline.map((p) => (
                <div key={p.stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--vendor-text-primary)', fontWeight: 700 }}>{p.stage} ({p.count})</span>
                    <span style={{ color: 'var(--vendor-primary)', fontWeight: 700 }}>{p.pct}% avg progress</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${p.pct}%`, height: '100%', backgroundColor: p.color, borderRadius: '5px', boxShadow: `0 0 12px ${p.color}80`, transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="vendor-glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vendor-text-primary)', margin: 0, fontFamily: 'var(--font-family)' }}>
              Live Operations Feed
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--vendor-success)', fontWeight: 700 }}>● Realtime</span>
          </div>

          {activities.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--vendor-text-muted)', margin: 0 }}>No recent activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.map((a) => (
                <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${a.color}20`, border: `1px solid ${a.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: a.color, flexShrink: 0 }}>
                    {a.actor.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--vendor-text-primary)' }}>{a.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--vendor-text-muted)' }}>{a.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--vendor-text-secondary)', lineHeight: 1.4 }}>{a.desc}</p>
                    <span style={{ fontSize: '10px', color: a.color, fontWeight: 700, marginTop: '4px', display: 'inline-block' }}>{a.actor} &middot; {a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VendorDashboard