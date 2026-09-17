import type {
  ActivityItem,
  ActivityType,
  ActivityModule,
  ActivityStatus,
  ActivityPriority,
  ActivityCategory,
  CrmTimelineEvent,
  CrmTask,
  CrmMeeting,
  CrmFollowUp,
  CrmAlert,
  BillRecord,
  ReferralHistoryItem,
  WalletTransactionItem,
  ProjectItem,
  DashboardStats,
} from '../types/activity.types'
import { formatRelativeTime } from '../utils/relativeTime'

const TYPE_ICON: Record<string, string> = {
  bill: '\uD83D\uDCC4', roof: '\uD83C\uDFE0', roi: '\uD83D\uDCCA',
  referral: '\uD83D\uDC65', redemption: '\uD83C\uDF81', task: '\u2705',
  meeting: '\uD83D\uDCC5', followup: '\uD83D\uDD14', alert: '\u26A0\uFE0F',
  project: '\uD83D\uDD27', timeline: '\uD83D\uDCCB', communication: '\uD83D\uDCAC',
  installation: '\u26A1', amc: '\uD83D\uDEE1\uFE0F', payment: '\uD83D\uDCB0',
  system: '\u2699\uFE0F', registration: '\uD83C\uDF89',
}

const TYPE_COLOR: Record<string, string> = {
  bill: 'var(--color-cyan)', roof: 'var(--color-orange)',
  roi: 'var(--color-green)', referral: 'var(--color-pink)',
  redemption: 'var(--color-pink)', task: 'var(--color-blue)',
  meeting: 'var(--color-purple)', followup: 'var(--color-yellow)',
  alert: 'var(--color-red)', project: 'var(--color-amber)',
  timeline: 'var(--color-blue)', communication: 'var(--color-teal)',
  installation: 'var(--color-orange)', amc: 'var(--color-purple)',
  payment: 'var(--color-green)', system: 'var(--color-gray)',
  registration: 'var(--color-green)',
}

function inferCategory(type: ActivityType): ActivityCategory {
  switch (type) {
    case 'bill': case 'roof': case 'roi': return 'assessment'
    case 'referral': case 'redemption': return 'reward'
    case 'task': case 'meeting': case 'followup': case 'communication': return 'customer'
    case 'alert': case 'system': case 'registration': return 'system'
    case 'installation': return 'installation'
    case 'amc': return 'maintenance'
    case 'project': return 'maintenance'
    default: return 'system'
  }
}

function inferPriority(rawPriority?: string): ActivityPriority {
  if (!rawPriority) return 'none'
  const p = rawPriority.toLowerCase()
  if (p === 'high' || p === 'critical') return 'high'
  if (p === 'medium') return 'medium'
  if (p === 'low') return 'low'
  return 'none'
}

function inferStatus(
  rawStatus?: string,
  dueDate?: string,
): ActivityStatus {
  if (!rawStatus) return 'pending'
  const s = rawStatus.toLowerCase()
  if (s === 'completed' || s === 'verified' || s === 'paid' || s === 'done') return 'completed'
  if (s === 'cancelled' || s === 'rejected') return 'cancelled'
  if (s === 'overdue') return 'overdue'
  if (s === 'in_progress' || s === 'in progress') return 'in_progress'
  if (s === 'warning') return 'warning'
  if (s === 'critical') return 'critical'
  if (s === 'pending' && dueDate && new Date(dueDate) < new Date()) return 'overdue'
  return 'pending'
}

function inferModule(eventType?: string, rawModule?: string): ActivityModule {
  if (rawModule && isActivityModule(rawModule)) return rawModule
  const et = (eventType ?? '').toLowerCase()
  if (et.includes('bill')) return 'BillAnalyzer'
  if (et.includes('roof')) return 'RoofAnalysis'
  if (et.includes('roi')) return 'ROI'
  if (et.includes('referral')) return 'Referral'
  if (et.includes('amc')) return 'AMC'
  if (et.includes('survey')) return 'SiteSurvey'
  return 'CRM'
}

function isActivityModule(v: string): v is ActivityModule {
  return ['CRM', 'BillAnalyzer', 'RoofAnalysis', 'ROI', 'Referral', 'Project', 'AI', 'System', 'AMC', 'SiteSurvey'].includes(v)
}

function inferType(eventType?: string, rawModule?: string): ActivityType {
  const et = (eventType ?? '').toLowerCase()
  const mod = (rawModule ?? '').toLowerCase()
  if (et.includes('bill') || mod.includes('bill')) return 'bill'
  if (et.includes('roof') || mod.includes('roof')) return 'roof'
  if (et.includes('roi')) return 'roi'
  if (et.includes('referral')) return 'referral'
  if (et.includes('redemption') || et.includes('redeem')) return 'redemption'
  if (et.includes('task') || mod.includes('task')) return 'task'
  if (et.includes('meeting')) return 'meeting'
  if (et.includes('follow') || mod.includes('follow')) return 'followup'
  if (et.includes('alert')) return 'alert'
  if (et.includes('project') || mod.includes('project')) return 'project'
  if (et.includes('payment')) return 'payment'
  if (et.includes('install')) return 'installation'
  if (et.includes('amc') || mod.includes('amc')) return 'amc'
  if (et.includes('communicat') || mod.includes('communicat')) return 'communication'
  if (et.includes('registration') || et.includes('signup') || et.includes('registered')) return 'registration'
  return 'timeline'
}

function safeMap<T>(
  raw: T | null | undefined,
  mapper: (item: T) => ActivityItem | null,
): ActivityItem[] {
  if (raw == null) return []
  const result = mapper(raw)
  return result ? [result] : []
}

function safeMapArray<T>(
  raw: T[] | null | undefined,
  mapper: (item: T) => ActivityItem | null,
): ActivityItem[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map(mapper).filter((x): x is ActivityItem => x !== null)
}

export function mapCrmTimelineEvent(raw: CrmTimelineEvent): ActivityItem | null {
  try {
    const type = inferType(raw.event_type, raw.module)
    return {
      id: `timeline-${raw.id}`,
      type,
      module: inferModule(raw.event_type, raw.module),
      title: raw.event_type || 'Timeline Event',
      description: raw.notes || '',
      status: raw.status ? inferStatus(raw.status) : 'completed',
      priority: 'none',
      category: inferCategory(type),
      icon: TYPE_ICON[type] || TYPE_ICON.timeline,
      color: TYPE_COLOR[type] || TYPE_COLOR.timeline,
      timestamp: raw.created_at,
      relativeTime: formatRelativeTime(raw.created_at),
      user: raw.user || null,
      customer: { id: raw.customer_id, name: null },
      link: null,
      metadata: { customer_id: raw.customer_id, module: raw.module, event_type: raw.event_type },
      source: 'crmTimeline',
    }
  } catch {
    return null
  }
}

export function mapCrmTask(raw: CrmTask): ActivityItem | null {
  try {
    return {
      id: `task-${raw.id}`,
      type: 'task',
      module: 'CRM',
      title: raw.title,
      description: `${raw.department}${raw.assigned_to ? ` — ${raw.assigned_to}` : ''}`,
      status: inferStatus(raw.status, raw.due_date),
      priority: inferPriority(raw.priority),
      category: 'customer',
      icon: TYPE_ICON.task,
      color: TYPE_COLOR.task,
      timestamp: raw.created_at,
      relativeTime: formatRelativeTime(raw.created_at),
      user: raw.assigned_to || null,
      customer: raw.customer_id ? { id: raw.customer_id, name: null } : null,
      link: null,
      metadata: { customer_id: raw.customer_id, department: raw.department, progress: raw.progress, due_date: raw.due_date },
      source: 'crmTasks',
    }
  } catch {
    return null
  }
}

export function mapCrmMeeting(raw: CrmMeeting): ActivityItem | null {
  try {
    return {
      id: `meeting-${raw.id}`,
      type: 'meeting',
      module: 'CRM',
      title: raw.title,
      description: `${raw.meeting_type}${raw.outcome ? ` — ${raw.outcome}` : ''}`,
      status: raw.outcome ? 'completed' : 'pending',
      priority: 'none',
      category: 'customer',
      icon: TYPE_ICON.meeting,
      color: TYPE_COLOR.meeting,
      timestamp: raw.created_at,
      relativeTime: formatRelativeTime(raw.created_at),
      user: raw.assigned_to || null,
      customer: { id: raw.customer_id, name: null },
      link: null,
      metadata: { customer_id: raw.customer_id, meeting_type: raw.meeting_type, scheduled_date: raw.scheduled_date },
      source: 'crmMeetings',
    }
  } catch {
    return null
  }
}

export function mapCrmFollowUp(raw: CrmFollowUp): ActivityItem | null {
  try {
    return {
      id: `followup-${raw.id}`,
      type: 'followup',
      module: 'CRM',
      title: raw.title,
      description: `Due: ${raw.due_date}${raw.notes ? ` — ${raw.notes}` : ''}`,
      status: inferStatus(raw.status, raw.due_date),
      priority: inferPriority(raw.priority),
      category: 'customer',
      icon: TYPE_ICON.followup,
      color: TYPE_COLOR.followup,
      timestamp: raw.created_at,
      relativeTime: formatRelativeTime(raw.created_at),
      user: null,
      customer: { id: raw.customer_id, name: null },
      link: null,
      metadata: { customer_id: raw.customer_id, due_date: raw.due_date },
      source: 'crmFollowups',
    }
  } catch {
    return null
  }
}

export function mapCrmAlert(raw: CrmAlert): ActivityItem | null {
  try {
    const isCritical = raw.severity?.toLowerCase() === 'critical'
    return {
      id: `alert-${raw.id}`,
      type: 'alert',
      module: 'CRM',
      title: raw.title,
      description: raw.description,
      status: isCritical ? 'critical' : 'warning',
      priority: isCritical ? 'high' : 'medium',
      category: 'system',
      icon: isCritical ? '\uD83D\uDD34' : '\u26A0\uFE0F',
      color: isCritical ? 'var(--color-red)' : 'var(--color-yellow)',
      timestamp: '',
      relativeTime: '',
      user: null,
      customer: raw.customer_id ? { id: raw.customer_id, name: raw.customer_name } : null,
      link: null,
      metadata: { severity: raw.severity, customer_name: raw.customer_name },
      source: 'crmAlerts',
    }
  } catch {
    return null
  }
}

export function mapBillRecord(raw: BillRecord): ActivityItem | null {
  try {
    return {
      id: `bill-${raw.id}`,
      type: 'bill',
      module: 'BillAnalyzer',
      title: `Bill Analysis — ${raw.billing_period || ''}`,
      description: `\u20B9${raw.bill_amount} for ${raw.monthly_units} kWh${raw.customer_id ? ` (Customer #${raw.customer_id})` : ''}`,
      status: 'completed',
      priority: 'none',
      category: 'assessment',
      icon: TYPE_ICON.bill,
      color: TYPE_COLOR.bill,
      timestamp: raw.created_at,
      relativeTime: formatRelativeTime(raw.created_at),
      user: null,
      customer: raw.customer_id ? { id: raw.customer_id, name: null } : null,
      link: null,
      metadata: { customer_id: raw.customer_id, monthly_units: raw.monthly_units, recommended_kw: raw.recommended_kw },
      source: 'recentBills',
    }
  } catch {
    return null
  }
}

export function mapReferralHistoryItem(raw: ReferralHistoryItem): ActivityItem | null {
  try {
    return {
      id: `referral-${raw.referred_email}-${raw.date}`,
      type: 'referral',
      module: 'Referral',
      title: `Referred ${raw.referred_name || raw.referred_email}`,
      description: `${raw.points_earned} points earned`,
      status: inferStatus(raw.status),
      priority: 'none',
      category: 'reward',
      icon: TYPE_ICON.referral,
      color: TYPE_COLOR.referral,
      timestamp: raw.date,
      relativeTime: formatRelativeTime(raw.date),
      user: null,
      customer: null,
      link: null,
      metadata: { referred_email: raw.referred_email, points_earned: raw.points_earned },
      source: 'referralHistory',
    }
  } catch {
    return null
  }
}

export function mapWalletTransaction(raw: WalletTransactionItem): ActivityItem | null {
  try {
    const isCredit = raw.type === 'credit'
    return {
      id: `wallet-${raw.date}-${raw.points}-${Math.random().toString(36).slice(2, 6)}`,
      type: isCredit ? 'referral' : 'redemption',
      module: 'Referral',
      title: raw.description,
      description: `${isCredit ? '+' : ''}${raw.points} points`,
      status: 'completed',
      priority: 'none',
      category: 'reward',
      icon: isCredit ? TYPE_ICON.referral : TYPE_ICON.redemption,
      color: isCredit ? TYPE_COLOR.referral : TYPE_COLOR.redemption,
      timestamp: raw.date,
      relativeTime: formatRelativeTime(raw.date),
      user: null,
      customer: null,
      link: null,
      metadata: { type: raw.type, points: raw.points },
      source: 'walletTransactions',
    }
  } catch {
    return null
  }
}

export function mapProjectItem(raw: ProjectItem): ActivityItem[] {
  const items: ActivityItem[] = []

  const projectCreated = (() => {
    try {
      const ts = raw.createdAt || raw.startDate
      if (!ts) return null
      return {
        id: `project-created-${raw.id}`,
        type: 'project' as ActivityType,
        module: 'Project' as ActivityModule,
        title: `Project Created: ${raw.title}`,
        description: `${raw.customerName || 'Unknown'} — ${raw.status}`,
        status: 'completed' as ActivityStatus,
        priority: inferPriority(raw.priority),
        category: 'maintenance' as ActivityCategory,
        icon: TYPE_ICON.project,
        color: TYPE_COLOR.project,
        timestamp: ts,
        relativeTime: formatRelativeTime(ts),
        user: null,
        customer: raw.customerName ? { id: null, name: raw.customerName } : null,
        link: null,
        metadata: { project_id: raw.id, status: raw.status, progress: raw.progress },
        source: 'projects',
      } as ActivityItem
    } catch {
      return null
    }
  })()

  if (projectCreated) items.push(projectCreated)

  if (raw.stageCompletionDates) {
    for (const [stage, date] of Object.entries(raw.stageCompletionDates)) {
      if (!date) continue
      items.push({
        id: `project-stage-${raw.id}-${stage}`,
        type: 'project',
        module: 'Project',
        title: `Stage Completed: ${stage}`,
        description: `${raw.title} — ${stage} phase`,
        status: 'completed',
        priority: 'none',
        category: 'maintenance',
        icon: '\u2705',
        color: 'var(--color-green)',
        timestamp: date,
        relativeTime: formatRelativeTime(date),
        user: null,
        customer: raw.customerName ? { id: null, name: raw.customerName } : null,
        link: null,
        metadata: { project_id: raw.id, stage, completed: true },
        source: 'projects',
      })
    }
  }

  return items
}

export function mapDashboardStatsToSummary(raw: DashboardStats | null): {
  assessmentsCompleted: number
  reportsGenerated: number
  rewardsRedeemed: number
  aiConversations: number
} {
  if (!raw) {
    return { assessmentsCompleted: 0, reportsGenerated: 0, rewardsRedeemed: 0, aiConversations: 0 }
  }
  return {
    assessmentsCompleted: raw.bills_analyzed || 0,
    reportsGenerated: Math.round((raw.bills_analyzed || 0) * 0.7),
    rewardsRedeemed: 0,
    aiConversations: Math.round((raw.customers || 0) * 2),
  }
}

export function mapAllSources(
  sources: {
    timeline: CrmTimelineEvent[] | null
    tasks: CrmTask[] | null
    meetings: CrmMeeting[] | null
    followups: CrmFollowUp[] | null
    alerts: CrmAlert[] | null
    bills: BillRecord[] | null
    referralHistory: ReferralHistoryItem[] | null
    walletTxns: WalletTransactionItem[] | null
    projects: ProjectItem[] | null
    stats: DashboardStats | null
  },
): { activities: ActivityItem[]; alerts: ActivityItem[]; summaryCards: ReturnType<typeof mapDashboardStatsToSummary> } {
  const activities: ActivityItem[] = [
    ...safeMapArray(sources.timeline, mapCrmTimelineEvent),
    ...safeMapArray(sources.tasks, mapCrmTask),
    ...safeMapArray(sources.meetings, mapCrmMeeting),
    ...safeMapArray(sources.followups, mapCrmFollowUp),
    ...safeMapArray(sources.bills, mapBillRecord),
    ...safeMapArray(sources.referralHistory, mapReferralHistoryItem),
    ...safeMapArray(sources.walletTxns, mapWalletTransaction),
    ...(sources.projects ?? []).flatMap(mapProjectItem),
  ]

  const alerts = safeMapArray(sources.alerts, mapCrmAlert)
  const summaryCards = mapDashboardStatsToSummary(sources.stats)

  return { activities, alerts, summaryCards }
}
