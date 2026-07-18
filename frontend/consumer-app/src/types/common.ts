export type StageId = `ST-${string}`

export interface StageConfig {
  id: StageId
  slug: string
  displayName: string
  description: string
  owner: 'system' | 'customer' | 'admin' | 'engineer' | 'vendor'
  etaDays: number
  unlockRoutes: string[]
  requiredDocs: string[]
  customerAction: string
  completionRules: string
  progressWeight: number
}

export type Theme = 'light' | 'dark'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
