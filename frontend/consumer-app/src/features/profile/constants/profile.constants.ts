import type { AchievementBadge } from '../types/profile.types'

export const DEFAULT_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'badge-1',
    title: 'Zero Defect Installation',
    description: 'Passed 10 consecutive DISCOM quality audits without minor defects.',
    category: 'Quality',
    issuedDate: '2026-03-10',
    icon: 'verified',
  },
  {
    id: 'badge-2',
    title: 'Master High-Voltage Specialist',
    description: 'Certified for 1000V DC String Inverter & Micro-inverter Commissioning.',
    category: 'Mastery',
    issuedDate: '2026-04-15',
    icon: 'flash',
  },
  {
    id: 'badge-3',
    title: 'LOTO Safety Ambassador',
    description: 'Maintained 100% Lockout-Tagout compliance across 25+ rooftop installations.',
    category: 'Safety',
    issuedDate: '2026-05-20',
    icon: 'shield',
  },
  {
    id: 'badge-4',
    title: '5-Star Customer Rating',
    description: 'Achieved 4.9+ customer review score across all residential installations.',
    category: 'Efficiency',
    issuedDate: '2026-06-01',
    icon: 'star',
  },
]

export const TECH_SERVICE_REGIONS = ['Mumbai Metropolitan', 'Navi Mumbai', 'Thane', 'Pune Urban', 'Bengaluru South']
