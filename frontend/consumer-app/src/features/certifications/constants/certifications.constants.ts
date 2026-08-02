import type { CertificationCategory, SkillLevel } from '../types/certifications.types'

export const CERTIFICATION_CATEGORIES: CertificationCategory[] = [
  'Solar Installation',
  'Safety & Compliance',
  'Grid Integration',
  'AMC & Repair',
]

export const SKILL_LEVELS: SkillLevel[] = ['Level 1', 'Level 2', 'Master']

export const EXPIRATION_THRESHOLD_DAYS = 30

export const DEFAULT_ISSUER = 'GET Solar Energy Academy'
