const MOCK_COURSES = [
  { id: 'c1', title: 'Solar PV Installation Fundamentals', category: 'Installation', description: 'Learn the fundamentals of solar PV installation including site assessment, mounting, wiring, and commissioning.', instructor: 'Rajesh Kumar', duration: '12 hours', progress: 65, thumbnail: 'solar', lastAccessed: '2 hours ago', modules: 8, modulesCompleted: 5 },
  { id: 'c2', title: 'Advanced Inverter Configuration', category: 'Technical', description: 'Master advanced inverter configuration, troubleshooting, and optimization techniques for modern solar systems.', instructor: 'Priya Sharma', duration: '8 hours', progress: 30, thumbnail: 'inverter', lastAccessed: '1 day ago', modules: 6, modulesCompleted: 2 },
  { id: 'c3', title: 'Electrical Safety for Solar Technicians', category: 'Safety', description: 'Comprehensive electrical safety training covering arc flash, lockout/tagout, PPE, and emergency response.', instructor: 'Ankit Patel', duration: '6 hours', progress: 100, thumbnail: 'safety', lastAccessed: '1 week ago', modules: 4, modulesCompleted: 4 },
  { id: 'c4', title: 'Rooftop Solar Mounting Systems', category: 'Installation', description: 'Detailed training on various rooftop mounting systems, structural considerations, and waterproofing techniques.', instructor: 'Vikram Singh', duration: '10 hours', progress: 0, thumbnail: 'roof', lastAccessed: null, modules: 7, modulesCompleted: 0 },
  { id: 'c5', title: 'Battery Energy Storage Systems', category: 'Technical', description: 'Learn BESS design, installation, commissioning, and maintenance for residential and commercial applications.', instructor: 'Neha Gupta', duration: '14 hours', progress: 45, thumbnail: 'battery', lastAccessed: '3 days ago', modules: 9, modulesCompleted: 4 },
  { id: 'c6', title: 'Net Metering & Grid Compliance', category: 'Compliance', description: 'Understanding net metering policies, grid interconnection requirements, and documentation processes.', instructor: 'Suresh Reddy', duration: '5 hours', progress: 80, thumbnail: 'grid', lastAccessed: '5 days ago', modules: 3, modulesCompleted: 2 },
]

const MOCK_LEARNING_PATHS = [
  { id: 'lp1', title: 'Residential Solar', description: 'Complete residential solar installation from roof assessment to final commissioning.', progress: 60, difficulty: 'Intermediate', duration: '40 hours', modules: 24, completed: false, icon: 'icon-home' },
  { id: 'lp2', title: 'Commercial Solar', description: 'Large-scale commercial solar systems, design, and project management.', progress: 25, difficulty: 'Advanced', duration: '60 hours', modules: 32, completed: false, icon: 'icon-briefcase' },
  { id: 'lp3', title: 'Installation Excellence', description: 'Best practices for high-quality solar installations with zero defects.', progress: 80, difficulty: 'Intermediate', duration: '30 hours', modules: 18, completed: false, icon: 'icon-clipboard-check' },
  { id: 'lp4', title: 'Maintenance & AMC', description: 'Preventive maintenance, troubleshooting, and annual maintenance contract execution.', progress: 10, difficulty: 'Beginner', duration: '20 hours', modules: 12, completed: false, icon: 'icon-wrench' },
  { id: 'lp5', title: 'Electrical Safety', description: 'Comprehensive safety protocols, hazard identification, and emergency procedures.', progress: 100, difficulty: 'Beginner', duration: '15 hours', modules: 8, completed: true, icon: 'icon-shield' },
  { id: 'lp6', title: 'Customer Service', description: 'Professional communication, customer handling, and service excellence.', progress: 0, difficulty: 'Beginner', duration: '10 hours', modules: 6, completed: false, icon: 'icon-chat' },
  { id: 'lp7', title: 'Government Compliance', description: 'Understanding subsidies, MNRE guidelines, and regulatory documentation.', progress: 35, difficulty: 'Intermediate', duration: '18 hours', modules: 10, completed: false, icon: 'icon-route' },
]

const MOCK_CERTIFICATIONS = [
  { id: 'cert1', title: 'Solar PV Installation Professional', issuer: 'GET Solar Academy', issueDate: '2026-03-15', expiryDate: '2028-03-15', status: 'Active', credentialId: 'GSA-SPV-2026-0421' },
  { id: 'cert2', title: 'Rooftop Safety Certified', issuer: 'GET Solar Academy', issueDate: '2026-05-01', expiryDate: '2027-05-01', status: 'Active', credentialId: 'GSA-RSC-2026-0817' },
  { id: 'cert3', title: 'Electrical Compliance Inspector', issuer: 'National Solar Institute', issueDate: '2025-11-20', expiryDate: '2026-11-20', status: 'Active', credentialId: 'NSI-ECI-2025-3301' },
  { id: 'cert4', title: 'Advanced Inverter Systems', issuer: 'GET Solar Academy', issueDate: '2026-07-10', expiryDate: null, status: 'In Progress', credentialId: '' },
  { id: 'cert5', title: 'Battery Storage Specialist', issuer: 'Energy Storage Council', issueDate: '2024-09-05', expiryDate: '2026-09-05', status: 'Expired', credentialId: 'ESC-BSS-2024-1129' },
  { id: 'cert6', title: 'MNRE Government Standards', issuer: 'Ministry of New & Renewable Energy', issueDate: '2026-01-10', expiryDate: '2029-01-10', status: 'Active', credentialId: 'MNRE-GS-2026-0056' },
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
  return {
    coursesEnrolled: 6,
    coursesCompleted: 3,
    certificationsEarned: 4,
    learningHours: 142,
    currentStreak: 30,
    overallProgress: 65,
  }
}

export function getContinueLearningCourse() {
  const c = MOCK_COURSES[0]
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    progress: c.progress,
    remainingTime: `${Math.round(parseInt(c.duration) * (1 - c.progress / 100))} hours`,
    instructor: c.instructor,
    category: c.category,
  }
}

export function getActiveCourses() {
  return MOCK_COURSES
}

export function getLearningPaths() {
  return MOCK_LEARNING_PATHS
}

export function getCertifications() {
  return MOCK_CERTIFICATIONS
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
