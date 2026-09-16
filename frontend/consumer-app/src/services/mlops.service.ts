import api from './api/client'
import { deepMapKeys } from './admin.mapper'
import type { MlopsModel, MlopsHealth, MlopsMetrics, MlopsDrift, MlopsEvent, MlopsVersion, MlModelInfo } from '../pages/mlops/mlops.types'

export const mlopsService = {
  async getStatus(): Promise<{ status: string; totalModels: number; activeModels: number; registryLoaded: boolean; operational: boolean } | null> {
    const res = await api.get('/mlops/status')
    const raw = res.data?.data
    return raw ? deepMapKeys(raw) as { status: string; totalModels: number; activeModels: number; registryLoaded: boolean; operational: boolean } : null
  },

  async getModels(): Promise<MlopsModel[]> {
    const res = await api.get('/mlops/models')
    const raw = res.data?.data?.models
    return Array.isArray(raw) ? deepMapKeys(raw) as MlopsModel[] : []
  },

  async getModel(name: string): Promise<MlopsModel | null> {
    const res = await api.get(`/mlops/models/${encodeURIComponent(name)}`)
    const raw = res.data?.data
    return raw ? deepMapKeys(raw) as MlopsModel : null
  },

  async getVersions(modelName?: string): Promise<MlopsVersion[]> {
    const params: Record<string, string> = {}
    if (modelName) params.model_name = modelName
    const res = await api.get('/mlops/versions', { params })
    const raw = res.data?.data?.versions
    return Array.isArray(raw) ? deepMapKeys(raw) as MlopsVersion[] : []
  },

  async getHealth(modelName?: string): Promise<MlopsHealth | null> {
    const params: Record<string, string> = {}
    if (modelName) params.model_name = modelName
    const res = await api.get('/mlops/health', { params })
    const raw = res.data?.data
    return raw ? deepMapKeys(raw) as MlopsHealth : null
  },

  async getMetrics(): Promise<MlopsMetrics | null> {
    const res = await api.get('/mlops/metrics')
    const raw = res.data?.data
    return raw ? deepMapKeys(raw) as MlopsMetrics : null
  },

  async getDrift(modelName?: string): Promise<MlopsDrift | null> {
    const params: Record<string, string> = {}
    if (modelName) params.model_name = modelName
    const res = await api.get('/mlops/drift', { params })
    const raw = res.data?.data
    return raw ? deepMapKeys(raw) as MlopsDrift : null
  },

  async getEvents(eventType?: string, limit = 100): Promise<MlopsEvent[]> {
    const params: Record<string, string | number> = { limit }
    if (eventType) params.event_type = eventType
    const res = await api.get('/mlops/events', { params })
    const raw = res.data?.data?.events
    return Array.isArray(raw) ? deepMapKeys(raw) as MlopsEvent[] : []
  },

  async getMlModels(): Promise<MlModelInfo[]> {
    const res = await api.get('/ml/models')
    const raw = res.data?.data?.models
    return Array.isArray(raw) ? deepMapKeys(raw) as MlModelInfo[] : []
  },
}
