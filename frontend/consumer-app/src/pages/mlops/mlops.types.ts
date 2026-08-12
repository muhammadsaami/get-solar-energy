export interface MlopsModel {
  name: string
  version: string
  algorithm: string
  framework: string
  task: string
  lifecycleState: string
  checksum: string
  fileSize: number
  features: string[]
  trainingDate: string | null
  lastDeployment: string | null
  lastRollback: string | null
}

export interface MlopsHealth {
  timestamp: string
  totalPredictions: number
  successfulPredictions: number
  failedPredictions: number
  successRate: number
  averageLatencyMs: number
  p95LatencyMs: number
  uptimeSeconds: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  modelLoadFailures: number
  registryLookupLatencyMs: number
  totalModels: number
  loadedModels: number
  modelAvailabilityPct: number
  cpuPercent: number
  memoryPercent: number
  psutilAvailable: boolean
}

export interface LatencyStats {
  minMs: number
  maxMs: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
}

export interface MlopsMetrics {
  timestamp: string
  totalPredictions: number
  successfulPredictions: number
  failedPredictions: number
  successRate: number
  averageLatencyMs: number
  p95LatencyMs: number
  modelUsage: Record<string, number>
  failuresByModel: Record<string, number>
  latencyStats: LatencyStats
  totalModels: number
  totalEncoders: number
  toolUsage: Record<string, unknown>
  assistantUsage: Record<string, unknown>
}

export interface DriftWindowSizes {
  baseline: number
  sliding: number
  current: number
}

export interface DriftMetricDetail {
  driftDetected: boolean
  severity: string
  baselineAvgMs?: number
  currentAvgMs?: number
  pctChange?: number
  baselineValue?: number
  currentValue?: number
}

export interface MlopsDrift {
  timestamp: string
  modelName: string
  sufficientData: boolean
  totalEntries: number
  windowSizes: DriftWindowSizes
  driftDetected: boolean
  alertCount: number
  alerts: unknown[]
  latencyDrift: DriftMetricDetail
  successRateDrift: DriftMetricDetail
  predictionDrift: DriftMetricDetail
  confidenceDrift: DriftMetricDetail
}

export interface MlopsEvent {
  eventType: string
  timestamp: string
  modelName: string
  stage?: string
  deploymentId?: string
  fromState?: string
  toState?: string
  success?: boolean
  error?: string | null
  strategy?: string
  version?: string
}

export interface VersionHistoryEntry {
  version: string
  status: string
  deploymentDate: string
  rollbackTarget: boolean
}

export interface MlopsVersion {
  modelName: string
  currentVersion: string
  previousVersion: string | null
  history: VersionHistoryEntry[]
}

export interface MlModelInfo {
  name: string
  version: string
  algorithm: string
  framework: string
  task: string
  status: string
  checksum: string
  fileSize: number
  features: string[]
}

export interface MlopsFilterState {
  modelName: string
  status: string
  severity: string
  datePreset: string
  search: string
}

export interface AICapability {
  name: string
  endpoint: string
  method: string
  description: string
  available: boolean
}
