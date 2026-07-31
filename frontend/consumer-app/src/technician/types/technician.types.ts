export interface TechnicianKpis {
  activeWorkOrders: number
  completedJobs: number
  monthlyEarnings: number
  customerRating: number
  trainingProgress: number
  certificationScore: number
}

export interface TechnicianProfile {
  name: string
  email: string
  phone: string
  city: string
  skillLevel: string
  technicianId: string
  certificationLevel: string
  verificationStatus: string
  availability: string
  serviceArea: string
}

export interface ScheduleItem {
  id: string
  title: string
  time: string
  location: string
  priority: 'high' | 'medium' | 'low'
  status: string
}

export interface NotificationItem {
  id: string
  message: string
  type: 'work_order' | 'training' | 'payment' | 'certification' | 'general'
  timestamp: string
  read: boolean
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface PerformanceData {
  completedJobs: ChartDataPoint[]
  monthlyEarnings: ChartDataPoint[]
  customerSatisfaction: ChartDataPoint[]
  trainingCompletion: ChartDataPoint[]
}

export interface TrainingProgress {
  currentLevel: string
  nextCertification: string
  completionPercentage: number
  remainingModules: number
  totalModules: number
}

export interface TechnicianDashboardData {
  kpis: TechnicianKpis
  profile: TechnicianProfile
  schedule: ScheduleItem[]
  notifications: NotificationItem[]
  performance: PerformanceData
  training: TrainingProgress
}

export type DashboardSection =
  | 'hero'
  | 'kpis'
  | 'quickActions'
  | 'schedule'
  | 'notifications'
  | 'performance'
  | 'training'
  | 'profile'
