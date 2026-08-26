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

const EMPTY_ANALYTICS = {
  monthlyHours: [],
  completionTrend: [],
  certificationGrowth: [],
  skillDistribution: [],
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
  return []
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
  return []
}

export function getAchievements() {
  return []
}

export function getLeaderboard() {
  return []
}

export function getTrainingAnalytics() {
  return EMPTY_ANALYTICS
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
