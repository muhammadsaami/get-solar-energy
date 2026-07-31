const MOCK_DOCUMENTS = [
  {
    id: 'doc-001',
    title: 'Residential Solar PV Installation Guide',
    category: 'Installation',
    equipment: 'Module',
    difficulty: 'Beginner',
    author: 'Rajesh Kumar',
    readingTime: 18,
    updatedAt: '2026-07-28',
    summary: 'End-to-end residential solar PV installation covering site assessment, mounting, wiring, and pre-commissioning checks.',
    tags: ['installation', 'residential', 'pv', 'mounting', 'wiring'],
    featured: true,
    bookmarked: true,
    recentlyViewed: true,
    downloads: 1240,
    views: 8600,
    rating: 4.8,
    offline: true,
    relatedDocumentIds: ['doc-004', 'doc-007', 'doc-011'],
  },
  {
    id: 'doc-002',
    title: 'Electrical Safety SOP for Solar Technicians',
    category: 'Safety',
    equipment: 'None',
    difficulty: 'Beginner',
    author: 'Ankit Patel',
    readingTime: 12,
    updatedAt: '2026-07-25',
    summary: 'Mandatory electrical safety standard operating procedures including lockout/tagout, PPE, and arc-flash precautions.',
    tags: ['safety', 'sop', 'electrical', 'ppe', 'arc-flash'],
    featured: true,
    bookmarked: true,
    recentlyViewed: false,
    downloads: 2310,
    views: 14200,
    rating: 4.9,
    offline: true,
    relatedDocumentIds: ['doc-005', 'doc-009'],
  },
  {
    id: 'doc-003',
    title: 'Advanced Inverter Configuration & Optimization',
    category: 'Technical',
    equipment: 'Inverter',
    difficulty: 'Advanced',
    author: 'Priya Sharma',
    readingTime: 25,
    updatedAt: '2026-07-20',
    summary: 'Deep dive into inverter parameter tuning, grid-code compliance, and performance optimization for modern string inverters.',
    tags: ['inverter', 'optimization', 'grid-code', 'configuration'],
    featured: true,
    bookmarked: false,
    recentlyViewed: true,
    downloads: 760,
    views: 4100,
    rating: 4.6,
    offline: false,
    relatedDocumentIds: ['doc-008', 'doc-012'],
  },
  {
    id: 'doc-004',
    title: 'Rooftop Mounting Systems & Structural Checks',
    category: 'Installation',
    equipment: 'Module',
    difficulty: 'Intermediate',
    author: 'Vikram Singh',
    readingTime: 15,
    updatedAt: '2026-07-15',
    summary: 'Selection and installation of rooftop mounting systems with structural integrity and waterproofing considerations.',
    tags: ['mounting', 'roof', 'structure', 'waterproofing'],
    featured: false,
    bookmarked: true,
    recentlyViewed: false,
    downloads: 540,
    views: 2900,
    rating: 4.5,
    offline: true,
    relatedDocumentIds: ['doc-001', 'doc-007'],
  },
  {
    id: 'doc-005',
    title: 'PPE & Fall Protection Field Guide',
    category: 'Safety',
    equipment: 'None',
    difficulty: 'Beginner',
    author: 'Sunita Patel',
    readingTime: 8,
    updatedAt: '2026-07-12',
    summary: 'Quick-reference field guide for personal protective equipment, fall protection anchors, and working-at-height rules.',
    tags: ['safety', 'ppe', 'fall-protection', 'height'],
    featured: false,
    bookmarked: true,
    recentlyViewed: true,
    downloads: 1890,
    views: 11800,
    rating: 4.7,
    offline: true,
    relatedDocumentIds: ['doc-002', 'doc-009'],
  },
  {
    id: 'doc-006',
    title: 'Net Metering & Grid Interconnection Compliance',
    category: 'Compliance',
    equipment: 'Inverter',
    difficulty: 'Intermediate',
    author: 'Suresh Reddy',
    readingTime: 20,
    updatedAt: '2026-07-08',
    summary: 'Complete walkthrough of net-metering applications, DISCOM interconnection agreements, and required documentation.',
    tags: ['net-metering', 'compliance', 'discom', 'grid'],
    featured: false,
    bookmarked: false,
    recentlyViewed: false,
    downloads: 920,
    views: 5300,
    rating: 4.4,
    offline: false,
    relatedDocumentIds: ['doc-008', 'doc-013'],
  },
  {
    id: 'doc-007',
    title: 'Battery Energy Storage System Commissioning',
    category: 'Technical',
    equipment: 'Battery',
    difficulty: 'Advanced',
    author: 'Neha Gupta',
    readingTime: 22,
    updatedAt: '2026-07-02',
    summary: 'Commissioning checklist and best practices for residential and commercial battery energy storage systems.',
    tags: ['bess', 'battery', 'commissioning', 'storage'],
    featured: false,
    bookmarked: false,
    recentlyViewed: false,
    downloads: 410,
    views: 2200,
    rating: 4.3,
    offline: false,
    relatedDocumentIds: ['doc-003', 'doc-001'],
  },
  {
    id: 'doc-008',
    title: 'MNRE Subsidy & Documentation Guidelines',
    category: 'Compliance',
    equipment: 'None',
    difficulty: 'Beginner',
    author: 'Suresh Reddy',
    readingTime: 14,
    updatedAt: '2026-06-28',
    summary: 'Understanding MNRE subsidy structures, application flows, and the complete documentation set required for claims.',
    tags: ['mnre', 'subsidy', 'documentation', 'policy'],
    featured: true,
    bookmarked: false,
    recentlyViewed: false,
    downloads: 1450,
    views: 9700,
    rating: 4.6,
    offline: true,
    relatedDocumentIds: ['doc-006', 'doc-013'],
  },
  {
    id: 'doc-009',
    title: 'Arc Flash & Electrical Hazard Mitigation',
    category: 'Safety',
    equipment: 'None',
    difficulty: 'Intermediate',
    author: 'Ankit Patel',
    readingTime: 16,
    updatedAt: '2026-06-24',
    summary: 'Arc-flash boundary calculations, incident energy awareness, and mitigation techniques for energized work.',
    tags: ['safety', 'arc-flash', 'electrical', 'hazard'],
    featured: false,
    bookmarked: false,
    recentlyViewed: false,
    downloads: 680,
    views: 3700,
    rating: 4.5,
    offline: true,
    relatedDocumentIds: ['doc-002', 'doc-005'],
  },
  {
    id: 'doc-010',
    title: 'Solar Module Cleaning & Preventive Maintenance',
    category: 'Technical',
    equipment: 'Module',
    difficulty: 'Beginner',
    author: 'Rahul Verma',
    readingTime: 10,
    updatedAt: '2026-06-20',
    summary: 'Scheduled cleaning, soiling-loss management, and preventive maintenance routines that preserve module performance.',
    tags: ['maintenance', 'module', 'cleaning', 'amc'],
    featured: false,
    bookmarked: true,
    recentlyViewed: false,
    downloads: 1120,
    views: 6400,
    rating: 4.4,
    offline: true,
    relatedDocumentIds: ['doc-004', 'doc-011'],
  },
  {
    id: 'doc-011',
    title: 'String Sizing & DC Sizing Calculator',
    category: 'Installation',
    equipment: 'Inverter',
    difficulty: 'Advanced',
    author: 'Priya Sharma',
    readingTime: 19,
    updatedAt: '2026-06-15',
    summary: 'Methodology for string sizing, voltage window matching, and DC overloading ratio calculations across climates.',
    tags: ['sizing', 'string', 'dc', 'inverter', 'design'],
    featured: false,
    bookmarked: false,
    recentlyViewed: false,
    downloads: 380,
    views: 1900,
    rating: 4.2,
    offline: false,
    relatedDocumentIds: ['doc-003', 'doc-001'],
  },
  {
    id: 'doc-012',
    title: 'Inverter Troubleshooting Decision Tree',
    category: 'Technical',
    equipment: 'Inverter',
    difficulty: 'Intermediate',
    author: 'Priya Sharma',
    readingTime: 13,
    updatedAt: '2026-06-10',
    summary: 'Structured decision tree for diagnosing common inverter faults, alarms, and grid-disconnection events.',
    tags: ['inverter', 'troubleshooting', 'faults', 'diagnostics'],
    featured: false,
    bookmarked: false,
    recentlyViewed: true,
    downloads: 830,
    views: 4800,
    rating: 4.6,
    offline: true,
    relatedDocumentIds: ['doc-003', 'doc-008'],
  },
  {
    id: 'doc-013',
    title: 'Site Survey Checklist for Installers',
    category: 'Installation',
    equipment: 'Module',
    difficulty: 'Beginner',
    author: 'Vikram Singh',
    readingTime: 9,
    updatedAt: '2026-06-05',
    summary: 'Standardized pre-installation site survey checklist covering shading, roof condition, access, and electrical readiness.',
    tags: ['site-survey', 'checklist', 'shading', 'roof'],
    featured: false,
    bookmarked: false,
    recentlyViewed: false,
    downloads: 2010,
    views: 13500,
    rating: 4.7,
    offline: true,
    relatedDocumentIds: ['doc-006', 'doc-001', 'doc-004'],
  },
]

const SCORE_METRICS = {
  completedReading: 6,
  bookmarkedResources: 4,
  trainingProgress: 65,
  certifications: 4,
  assessments: 3,
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function deriveKnowledgeScore(metrics = SCORE_METRICS) {
  const score = clamp(
    Math.round(
      (metrics.completedReading ?? 0) * 3.0 +
      (metrics.trainingProgress ?? 0) * 0.25 +
      (metrics.bookmarkedResources ?? 0) * 1.5 +
      (metrics.certifications ?? 0) * 2.5 +
      (metrics.assessments ?? 0) * 1.5
    ),
    0,
    100
  )
  let label = 'Emerging'
  if (score >= 85) label = 'Expert'
  else if (score >= 65) label = 'Proficient'
  else if (score >= 40) label = 'Advancing'
  return { score, label }
}

function sortBy(collection, key, direction = 'desc') {
  return [...collection].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return direction === 'asc' ? cmp : -cmp
  })
}

function resolveRelated(document) {
  const candidates = MOCK_DOCUMENTS.filter((d) => d.id !== document.id)
  const scored = candidates.map((c) => {
    let score = 0
    if (c.category === document.category) score += 3
    if (c.equipment === document.equipment && document.equipment !== 'None') score += 2
    score += c.tags.filter((t) => document.tags.includes(t)).length
    return { doc: c, score }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, 3).map((s) => s.doc)
  const fallback = document.relatedDocumentIds
    .map((id) => MOCK_DOCUMENTS.find((d) => d.id === id))
    .filter(Boolean)
  const merged = [...top, ...fallback]
  return [...new Map(merged.map((d) => [d.id, d])).values()].slice(0, 4)
}

export const knowledgeBaseService = {
  getDocuments() {
    return MOCK_DOCUMENTS.map((d) => ({ ...d }))
  },

  getDashboard() {
    const docs = this.getDocuments()
    return {
      allDocuments: docs,
      featuredDocuments: docs.filter((d) => d.featured),
      bookmarkedDocuments: docs.filter((d) => d.bookmarked),
      recentlyViewedDocuments: docs.filter((d) => d.recentlyViewed).slice(0, 5),
      popularDocuments: sortBy(docs, 'views').slice(0, 6),
      latestDocuments: sortBy(docs, 'updatedAt').slice(0, 6),
      categories: [...new Set(docs.map((d) => d.category))],
      score: deriveKnowledgeScore().score,
    }
  },

  getDocument(id) {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id)
    if (!doc) return null
    return { ...doc }
  },

  getRelatedDocuments(id) {
    const document = MOCK_DOCUMENTS.find((d) => d.id === id)
    if (!document) return []
    return resolveRelated(document).map((d) => ({ ...d }))
  },

  getCategories() {
    return [...new Set(MOCK_DOCUMENTS.map((d) => d.category))]
  },

  getRecentDocuments() {
    return this.getDocuments().filter((d) => d.recentlyViewed)
  },

  getPopularDocuments() {
    return sortBy(this.getDocuments(), 'views').slice(0, 6)
  },

  toggleBookmark(id) {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id)
    if (!doc) return null
    doc.bookmarked = !doc.bookmarked
    return { id, bookmarked: doc.bookmarked }
  },

  downloadDocument(id) {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id)
    if (!doc) return null
    doc.downloads += 1
    return { ok: true, downloads: doc.downloads }
  },

  shareDocument(id) {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id)
    if (!doc) return null
    return { ok: true, title: doc.title }
  },
}
