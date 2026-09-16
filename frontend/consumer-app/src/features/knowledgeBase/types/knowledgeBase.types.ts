export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Document {
  id: string
  title: string
  category: string
  equipment: string
  difficulty: Difficulty
  author: string
  readingTime: number
  updatedAt: string
  summary: string
  tags: string[]
  featured: boolean
  bookmarked: boolean
  recentlyViewed: boolean
  downloads: number
  views: number
  rating: number
  offline: boolean
  relatedDocumentIds: string[]
}

export interface KnowledgeMetrics {
  completedReading: number
  bookmarkedResources: number
  trainingProgress: number
  certifications: number
  assessments: number
}

export interface KnowledgeDashboard {
  featuredDocuments: Document[]
  bookmarkedDocuments: Document[]
  recentlyViewedDocuments: Document[]
  popularDocuments: Document[]
  latestDocuments: Document[]
  categories: string[]
  score: number
}

export interface SearchQuery {
  text: string
  filters: Record<string, string[]>
  sortBy?: 'relevance' | 'updated' | 'popular' | 'rating'
}

export interface KnowledgeScoreResult {
  score: number
  label: string
}
