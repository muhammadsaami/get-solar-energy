import type {
  TechnicianDashboardData,
  TechnicianKpis,
  TechnicianProfile,
  ScheduleItem,
  NotificationItem,
  PerformanceData,
  TrainingProgress,
} from '../technician/types/technician.types'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function getDayGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 18) return 'Afternoon'
  return 'Evening'
}

const MOCK_KPIS: TechnicianKpis = {
  activeWorkOrders: 4,
  completedJobs: 127,
  monthlyEarnings: 18450,
  customerRating: 4.8,
  trainingProgress: 72,
  certificationScore: 88,
}

function buildMockProfile(): TechnicianProfile {
  const savedUser = (() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  return {
    name: savedUser?.name || 'Technician',
    email: savedUser?.email || 'technician@getsolar.com',
    phone: savedUser?.phone || '+91 98765 43210',
    city: savedUser?.city || 'Jaipur',
    skillLevel: 'Level 2',
    technicianId: 'TECH-' + (savedUser?.id?.toString().padStart(4, '0') || '0001'),
    certificationLevel: 'Certified Technician',
    verificationStatus: 'Verified',
    availability: 'Available Today',
    serviceArea: 'Jaipur Metropolitan',
  }
}

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: 's1', title: 'Solar Panel Installation - Sharma Residence', time: '09:00 AM - 12:00 PM', location: 'Bani Park, Jaipur', priority: 'high', status: 'In Progress' },
  { id: 's2', title: 'Routine Maintenance - Verma House', time: '01:00 PM - 02:30 PM', location: 'Malviya Nagar, Jaipur', priority: 'medium', status: 'Scheduled' },
  { id: 's3', title: 'QA Inspection - Patel Installation', time: '03:00 PM - 04:00 PM', location: 'Mansarovar, Jaipur', priority: 'high', status: 'Scheduled' },
  { id: 's4', title: 'Customer Consultation - New Lead', time: '04:30 PM - 05:30 PM', location: 'C-Scheme, Jaipur', priority: 'low', status: 'Scheduled' },
]

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', message: 'New work order assigned: Solar installation at Gupta residence', type: 'work_order', timestamp: '10 min ago', read: false },
  { id: 'n2', message: 'Training module "Advanced PV Systems" completed successfully', type: 'training', timestamp: '2 hours ago', read: false },
  { id: 'n3', message: 'Payment of ₹12,500 released for completed installation', type: 'payment', timestamp: '1 day ago', read: true },
  { id: 'n4', message: 'Certification "Master Installer" expires in 30 days', type: 'certification', timestamp: '2 days ago', read: true },
  { id: 'n5', message: 'New job match in your area: 5kW residential system', type: 'work_order', timestamp: '3 days ago', read: true },
]

const MOCK_PERFORMANCE: PerformanceData = {
  completedJobs: [
    { label: 'Jan', value: 8 },
    { label: 'Feb', value: 12 },
    { label: 'Mar', value: 10 },
    { label: 'Apr', value: 15 },
    { label: 'May', value: 18 },
    { label: 'Jun', value: 14 },
    { label: 'Jul', value: 20 },
  ],
  monthlyEarnings: [
    { label: 'Jan', value: 9500 },
    { label: 'Feb', value: 12000 },
    { label: 'Mar', value: 11000 },
    { label: 'Apr', value: 16500 },
    { label: 'May', value: 18000 },
    { label: 'Jun', value: 14500 },
    { label: 'Jul', value: 18450 },
  ],
  customerSatisfaction: [
    { label: 'Jan', value: 4.5 },
    { label: 'Feb', value: 4.6 },
    { label: 'Mar', value: 4.7 },
    { label: 'Apr', value: 4.8 },
    { label: 'May', value: 4.7 },
    { label: 'Jun', value: 4.9 },
    { label: 'Jul', value: 4.8 },
  ],
  trainingCompletion: [
    { label: 'Basic Safety', value: 100 },
    { label: 'PV Fundamentals', value: 100 },
    { label: 'Installation Tech', value: 100 },
    { label: 'Advanced PV', value: 85 },
    { label: 'System Design', value: 60 },
    { label: 'Smart Grid', value: 30 },
  ],
}

const MOCK_TRAINING: TrainingProgress = {
  currentLevel: 'Level 2',
  nextCertification: 'Master Installer',
  completionPercentage: 72,
  remainingModules: 2,
  totalModules: 6,
}

let useMockData = true

export function setUseMockData(mock: boolean) {
  useMockData = mock
}

export const technicianDashboardService = {
  async loadDashboard(): Promise<TechnicianDashboardData | null> {
    if (useMockData) {
      await new Promise((r) => setTimeout(r, 400))
      return {
        kpis: MOCK_KPIS,
        profile: buildMockProfile(),
        schedule: MOCK_SCHEDULE,
        notifications: MOCK_NOTIFICATIONS,
        performance: MOCK_PERFORMANCE,
        training: MOCK_TRAINING,
      }
    }

    try {
      const { default: api } = await import('./api/client')
      const res = await api.get('/technician/dashboard')
      return res.data?.data ?? null
    } catch {
      return null
    }
  },
}

export { getGreeting, getDayGreeting }
