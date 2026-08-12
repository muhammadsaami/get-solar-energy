const MOCK_LEARNING_PATHS = [
  { id: 'lp1', title: 'Residential Solar', description: 'Complete residential solar installation from roof assessment to final commissioning.', progress: 60, difficulty: 'Intermediate', duration: '40 hours', modules: 24, completed: false, icon: 'icon-home' },
  { id: 'lp2', title: 'Commercial Solar', description: 'Large-scale commercial solar systems, design, and project management.', progress: 25, difficulty: 'Advanced', duration: '60 hours', modules: 32, completed: false, icon: 'icon-briefcase' },
  { id: 'lp3', title: 'Installation Excellence', description: 'Best practices for high-quality solar installations with zero defects.', progress: 80, difficulty: 'Intermediate', duration: '30 hours', modules: 18, completed: false, icon: 'icon-clipboard-check' },
  { id: 'lp4', title: 'Maintenance & AMC', description: 'Preventive maintenance, troubleshooting, and annual maintenance contract execution.', progress: 10, difficulty: 'Beginner', duration: '20 hours', modules: 12, completed: false, icon: 'icon-wrench' },
  { id: 'lp5', title: 'Electrical Safety', description: 'Comprehensive safety protocols, hazard identification, and emergency procedures.', progress: 100, difficulty: 'Beginner', duration: '15 hours', modules: 8, completed: true, icon: 'icon-shield' },
  { id: 'lp6', title: 'Customer Service', description: 'Professional communication, customer handling, and service excellence.', progress: 0, difficulty: 'Beginner', duration: '10 hours', modules: 6, completed: false, icon: 'icon-chat' },
  { id: 'lp7', title: 'Government Compliance', description: 'Understanding subsidies, MNRE guidelines, and regulatory documentation.', progress: 35, difficulty: 'Intermediate', duration: '18 hours', modules: 10, completed: false, icon: 'icon-route' },
]

const MOCK_ASSESSMENTS = [
  { id: 'a1', title: 'Solar PV Installation Final Exam', date: '2026-08-05', duration: '2 hours', passingScore: 80, preparationStatus: 'In Progress', courseTitle: 'Solar PV Installation Fundamentals' },
  { id: 'a2', title: 'Inverter Configuration Quiz', date: '2026-08-12', duration: '45 minutes', passingScore: 70, preparationStatus: 'Not Started', courseTitle: 'Advanced Inverter Configuration' },
  { id: 'a3', title: 'Electrical Safety Certification Test', date: '2026-07-28', duration: '1 hour', passingScore: 85, preparationStatus: 'Ready', courseTitle: 'Electrical Safety for Solar Technicians' },
  { id: 'a4', title: 'BESS Design & Installation Assessment', date: '2026-08-20', duration: '3 hours', passingScore: 75, preparationStatus: 'Not Started', courseTitle: 'Battery Energy Storage Systems' },
]

const MOCK_ACHIEVEMENTS = [
  { id: 'ach1', title: 'First Course', description: 'Completed your first training course', icon: 'icon-star', unlocked: true, unlockedDate: '2026-03-20' },
  { id: 'ach2', title: '100 Hours Club', description: 'Logged 100+ hours of learning', icon: 'icon-trending', unlocked: true, unlockedDate: '2026-06-15' },
  { id: 'ach3', title: 'Safety Champion', description: 'Completed all safety courses with 100% score', icon: 'icon-shield', unlocked: true, unlockedDate: '2026-05-10' },
  { id: 'ach4', title: 'Solar Expert', description: 'Completed 5+ advanced courses', icon: 'icon-solar-readiness', unlocked: true, unlockedDate: '2026-07-01' },
  { id: 'ach5', title: 'Perfect Assessment', description: 'Scored 100% in any certification exam', icon: 'icon-clipboard-check', unlocked: false, unlockedDate: null },
  { id: 'ach6', title: 'Top Performer', description: 'Reached #1 on the leaderboard', icon: 'icon-crown', unlocked: false, unlockedDate: null },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Arun Mehta', role: 'Senior Technician', points: 2850, coursesCompleted: 12, streak: 45, isCurrentUser: false },
  { rank: 2, name: 'Priya Sharma', role: 'Field Engineer', points: 2420, coursesCompleted: 10, streak: 38, isCurrentUser: false },
  { rank: 3, name: 'Vikram Singh', role: 'Lead Technician', points: 2180, coursesCompleted: 9, streak: 30, isCurrentUser: true },
  { rank: 4, name: 'Sunita Patel', role: 'Technician', points: 1950, coursesCompleted: 7, streak: 25, isCurrentUser: false },
  { rank: 5, name: 'Rahul Verma', role: 'Junior Technician', points: 1620, coursesCompleted: 5, streak: 18, isCurrentUser: false },
  { rank: 6, name: 'Deepa Krishnan', role: 'Technician', points: 1480, coursesCompleted: 4, streak: 12, isCurrentUser: false },
  { rank: 7, name: 'Karan Joshi', role: 'Apprentice', points: 1100, coursesCompleted: 3, streak: 7, isCurrentUser: false },
  { rank: 8, name: 'Ananya Reddy', role: 'Apprentice', points: 850, coursesCompleted: 2, streak: 5, isCurrentUser: false },
]

import api from '../../../services/api/client'

let liveModules = null
let liveCertifications = null

export async function syncFromBackend() {
  const [modulesRes, certsRes] = await Promise.all([
    api.get('/technician/training/modules'),
    api.get('/technician/training/certifications'),
  ])
  if (modulesRes?.data?.success && Array.isArray(modulesRes.data.modules)) {
    liveModules = modulesRes.data.modules
  } else {
    throw new Error('Training modules could not be loaded from the server.')
  }
  if (certsRes?.data?.success && Array.isArray(certsRes.data.certifications)) {
    liveCertifications = certsRes.data.certifications
  } else {
    throw new Error('Certifications could not be loaded from the server.')
  }
  return true
}

const MOCK_ANALYTICS = {
  monthlyHours: [
    { month: 'Feb', hours: 18 },
    { month: 'Mar', hours: 24 },
    { month: 'Apr', hours: 32 },
    { month: 'May', hours: 28 },
    { month: 'Jun', hours: 36 },
    { month: 'Jul', hours: 42 },
  ],
  completionTrend: [
    { month: 'Feb', rate: 45 },
    { month: 'Mar', rate: 55 },
    { month: 'Apr', rate: 60 },
    { month: 'May', rate: 68 },
    { month: 'Jun', rate: 75 },
    { month: 'Jul', rate: 82 },
  ],
  certificationGrowth: [
    { month: 'Feb', count: 1 },
    { month: 'Mar', count: 1 },
    { month: 'Apr', count: 2 },
    { month: 'May', count: 3 },
    { month: 'Jun', count: 3 },
    { month: 'Jul', count: 4 },
  ],
  skillDistribution: [
    { skill: 'Installation', percentage: 65 },
    { skill: 'Safety', percentage: 90 },
    { skill: 'Electrical', percentage: 70 },
    { skill: 'Design', percentage: 45 },
    { skill: 'Customer Service', percentage: 55 },
    { skill: 'Compliance', percentage: 60 },
  ],
}

export function getTrainingKpis() {
  const modules = liveModules ?? []
  const coursesEnrolled = modules.length
  const coursesCompleted = modules.filter((m) => m.status === 'Passed').length
  const certificationsEarned = liveCertifications ? liveCertifications.length : 0
  return {
    coursesEnrolled,
    coursesCompleted,
    certificationsEarned,
    learningHours: 142,
    currentStreak: 30,
    overallProgress: coursesEnrolled ? Math.round((coursesCompleted / coursesEnrolled) * 100) : 0,
  }
}

export function getContinueLearningCourse() {
  const next = liveModules ? liveModules.find((m) => m.status === 'In Progress' || m.status === 'Not Started') : null
  if (next) {
    return {
      id: String(next.id),
      title: next.title,
      description: next.description,
      progress: 0,
      remainingTime: 'In progress',
      instructor: 'GET Solar Academy',
      category: next.level || 'Technical',
      backendId: next.id,
      status: next.status,
      score: next.score,
    }
  }
  return null
}

export function getActiveCourses() {
  const modules = liveModules ?? []
  return modules.map((m, idx) => ({
    id: String(m.id),
    title: m.title,
    description: m.description,
    category: m.level || 'Technical',
    instructor: 'GET Solar Academy',
    duration: 'Live module',
    progress: m.status === 'Passed' ? 100 : m.status === 'In Progress' ? 50 : 0,
    thumbnail: idx % 2 === 0 ? 'solar' : 'inverter',
    lastAccessed: m.status === 'Not Started' ? null : 'Recently',
    modules: 1,
    modulesCompleted: m.status === 'Passed' ? 1 : 0,
    status: m.status,
    score: m.score,
  }))
}

export function getLearningPaths() {
  return MOCK_LEARNING_PATHS
}

export function getCertifications() {
  const certs = liveCertifications ?? []
  return certs.map((c, idx) => ({
    id: `cert-live-${idx + 1}`,
    title: c.badge_name || `GET Solar Certified Technician - ${c.level}`,
    issuer: 'GET Solar Academy',
    issueDate: c.issued_at ? c.issued_at.split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: null,
    status: 'Active',
    credentialId: c.certificate_number || '',
    level: c.level,
  }))
}

export function getUpcomingAssessments() {
  return MOCK_ASSESSMENTS
}

export function getAchievements() {
  return MOCK_ACHIEVEMENTS
}

export function getLeaderboard() {
  return MOCK_LEADERBOARD
}

export function getTrainingAnalytics() {
  return MOCK_ANALYTICS
}

export function getTrainingDashboard() {
  if (liveModules === null || liveCertifications === null) {
    throw new Error('Training data is not available. Please retry.')
  }
  return {
    kpis: getTrainingKpis(),
    continueLearning: getContinueLearningCourse(),
    activeCourses: getActiveCourses(),
    learningPaths: getLearningPaths(),
    certifications: getCertifications(),
    assessments: getUpcomingAssessments(),
    achievements: getAchievements(),
    leaderboard: getLeaderboard(),
    analytics: getTrainingAnalytics(),
  }
}
