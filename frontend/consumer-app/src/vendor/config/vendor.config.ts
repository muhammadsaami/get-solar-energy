export const VENDOR_STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'site-survey', label: 'Site Survey' },
  { id: 'installation', label: 'Installation' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'completed', label: 'Completed' },
]

export const VENDOR_ROUTES = {
  DASHBOARD: '/app/vendor',
  MY_WORK: '/app/vendor/my-work',
  TASKS: '/app/vendor/my-work/tasks',
  VISITS: '/app/vendor/my-work/visits',
  INSTALLATIONS: '/app/vendor/my-work/installations',
  WORK_ORDERS: '/app/vendor/my-work/orders',
  PROJECTS_ACTIVE: '/app/vendor/projects/active',
  PROJECTS_COMPLETED: '/app/vendor/projects/completed',
  CUSTOMERS: '/app/vendor/customers',
  AMC: '/app/vendor/amc',
  REPORTS: '/app/vendor/reports',
}

export const QUICK_ACTIONS = [
  { id: 'site-visit', label: 'Start Site Visit', icon: 'icon-mappin', description: 'Begin today\'s inspection.', action: 'schedule_visit' },
  { id: 'update-installation', label: 'Update Installation', icon: 'icon-wrench', description: 'Report installation progress.', action: 'update_installation' },
  { id: 'upload-photos', label: 'Upload Photos', icon: 'icon-camera', description: 'Attach site photos to project.', action: 'upload_photos' },
  { id: 'complete-checklist', label: 'Complete Checklist', icon: 'icon-clipboard-check', description: 'Mark inspection items done.', action: 'complete_task' },
  { id: 'schedule-followup', label: 'Schedule Follow-up', icon: 'icon-calendar', description: 'Book next site visit.', action: 'schedule_followup' },
  { id: 'generate-report', label: 'Generate Report', icon: 'icon-reports', description: 'Export installation summary.', action: 'generate_report' },
  { id: 'request-support', label: 'Request Support', icon: 'icon-chat', description: 'Get help from operations.', action: 'request_support' },
  { id: 'create-amc-visit', label: 'Create AMC Visit', icon: 'icon-shield', description: 'Log maintenance service.', action: 'create_amc' },
]

export const DRAWER_TABS_VENDOR = [
  'customer', 'timeline', 'team', 'installation', 'documents', 'notes', 'activity', 'milestones',
]

export const DRAWER_TABS_ADMIN = [
  'customer', 'timeline', 'team', 'installation', 'documents', 'notes', 'activity', 'milestones', 'financials', 'risks',
]
