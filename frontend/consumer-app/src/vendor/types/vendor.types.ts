export interface VendorKpis {
  todaysJobs: number
  activeInstallations: number
  pendingSiteVisits: number
  overdueWorkOrders: number
  slaCompliance: number
  escalatedIssues: number
  amcVisitsThisWeek: number
  completionRate: number
  totalProjects: number
  activeProjects: number
  delayedProjects: number
  avgHealthScore: number
  avgProgress: number
}

export interface VendorVisit {
  id: number
  title: string
  customerId: number
  scheduledDate: string
  scheduledTime: string
  meetingType: string
  outcome?: string
}

export interface VendorTask {
  id: number
  title: string
  priority: string
  dueDate: string
  status: string
  overdueDays?: number
  customerId?: number
  department?: string
  assignedTo?: string
  progress?: number
  notes?: string
}

export interface VendorAlert {
  type: string
  severity: 'critical' | 'warning'
  title: string
  description: string
  taskId?: number
  customerId?: number
  projectId?: string
}

export interface VendorDashboardData {
  kpis: VendorKpis
  projects: unknown[]
  todaysVisits: VendorVisit[]
  upcomingVisits: VendorVisit[]
  todaysTasks: VendorTask[]
  overdueTasks: VendorTask[]
  team: string
}

export interface VendorAlertsData {
  alerts: VendorAlert[]
  total: number
  critical: number
}
