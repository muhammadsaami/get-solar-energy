export interface TrainingKpis {
  coursesEnrolled: number
  coursesCompleted: number
  certificationsEarned: number
  learningHours: number
  currentStreak: number
  overallProgress: number
}

export interface Course {
  id: string
  title: string
  category: string
  description: string
  instructor: string
  duration: string
  progress: number
  thumbnail: string
  lastAccessed: string
  modules: number
  modulesCompleted: number
}

export interface ContinueLearningCourse {
  id: string
  title: string
  description: string
  progress: number
  remainingTime: string
  instructor: string
  category: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  progress: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  modules: number
  completed: boolean
  icon: string
}

export interface Certification {
  id: string
  title: string
  issuer: string
  issueDate: string
  expiryDate: string | null
  status: 'Active' | 'Expired' | 'In Progress'
  credentialId: string
}

export interface Assessment {
  id: string
  title: string
  date: string
  duration: string
  passingScore: number
  preparationStatus: 'Ready' | 'In Progress' | 'Not Started'
  courseTitle: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedDate: string | null
}

export interface LeaderboardEntry {
  rank: number
  name: string
  role: string
  points: number
  coursesCompleted: number
  streak: number
  isCurrentUser: boolean
}

export interface TrainingAnalytics {
  monthlyHours: { month: string; hours: number }[]
  completionTrend: { month: string; rate: number }[]
  certificationGrowth: { month: string; count: number }[]
  skillDistribution: { skill: string; percentage: number }[]
}
