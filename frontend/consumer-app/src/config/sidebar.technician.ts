import { ROUTES } from './routes'
import type { SidebarGroupConfig } from './sidebar'

export const TECHNICIAN_SIDEBAR_GROUPS: SidebarGroupConfig[] = [
  {
    groupName: 'Technician Network',
    items: [
      { id: 't-dashboard', label: 'Dashboard', route: ROUTES.TECHNICIAN_DASHBOARD, color: 'blue', symbolId: 'home', visible: true, requiredFeature: 'technician-dashboard' },
      { id: 't-training', label: 'Training Academy', route: ROUTES.TECHNICIAN_TRAINING, color: 'cyan', symbolId: 'book', visible: true, requiredFeature: 'technician-training' },
      { id: 't-knowledge-base', label: 'Knowledge Base', route: ROUTES.KNOWLEDGE_BASE, color: 'teal', symbolId: 'book', visible: true, requiredFeature: 'knowledge-base' },
      { id: 't-certifications', label: 'Certifications', route: ROUTES.TECHNICIAN_CERTIFICATIONS, color: 'green', symbolId: 'badge', visible: true, requiredFeature: 'technician-certifications' },
      { id: 't-marketplace', label: 'Job Marketplace', route: ROUTES.TECHNICIAN_MARKETPLACE, color: 'orange', symbolId: 'briefcase', visible: true, requiredFeature: 'technician-marketplace' },
      { id: 't-work-orders', label: 'Work Orders', route: ROUTES.TECHNICIAN_WORK_ORDERS, color: 'purple', symbolId: 'clipboard', visible: true, requiredFeature: 'technician-work-orders' },
      { id: 't-earnings', label: 'Earnings', route: ROUTES.TECHNICIAN_EARNINGS, color: 'green', symbolId: 'currency', visible: true, requiredFeature: 'technician-earnings' },
      { id: 't-profile', label: 'Profile & Performance', route: ROUTES.TECHNICIAN_PROFILE, color: 'gray', symbolId: 'user', visible: true, requiredFeature: 'technician-profile' },
      { id: 't-ai', label: 'AI Troubleshooting', route: ROUTES.TECHNICIAN_AI, color: 'indigo', symbolId: 'sparkles', visible: true, requiredFeature: 'technician-ai' },
    ],
  },
]
