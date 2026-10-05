/**
 * Phase 7B - Solar Production Client Service
 * Communicates with backend /api/solar-production persistence endpoints.
 * Handles customer-scoped storage and historical retrieval.
 */
import api from './api/client'
import type { SolarReportData } from '../hooks/billAnalyzer.types'

export interface ServerSolarReading {
  id: number
  customerEmail: string
  periodType: string
  startDate: string | null
  endDate: string | null
  month: string | null
  year: number | null
  productionKwh: number
  installedCapacityKwp: number | null
  systemSizeKw: number | null
  source: string
  dailyGenerationKwh: number | null
  dailyPoints?: Array<{ id?: string; date: string; productionKwh: number }> | null
  createdAt: string | null
  updatedAt: string | null
}

export interface SaveSolarProductionResponse {
  success: boolean
  message: string
  data: ServerSolarReading
}

export interface LatestSolarProductionResponse {
  success: boolean
  data: ServerSolarReading | null
}

export interface SolarProductionHistoryResponse {
  success: boolean
  count: number
  data: ServerSolarReading[]
}

/**
 * Converts server reading to SolarReportData format
 */
export function serverReadingToSolarReport(reading: ServerSolarReading): SolarReportData {
  return {
    productionKwh: reading.productionKwh,
    systemSizeKw: reading.installedCapacityKwp ?? reading.systemSizeKw ?? null,
    month: reading.month,
    year: reading.year,
    periodType: reading.periodType as SolarReportData['periodType'],
    startDate: reading.startDate,
    endDate: reading.endDate,
    source: reading.source,
    dailyGenerationKwh: reading.dailyGenerationKwh,
    dailyPoints: reading.dailyPoints,
  }
}

/**
 * Persists solar production reading to the server database.
 */
export async function saveSolarProductionToServer(
  data: SolarReportData
): Promise<ServerSolarReading | null> {
  if (data.productionKwh == null || data.productionKwh < 0) return null

  const payload = {
    productionKwh: data.productionKwh,
    installedCapacityKwp: data.systemSizeKw ?? undefined,
    periodType: data.periodType || (data.month ? 'month' : 'custom'),
    startDate: data.startDate ?? undefined,
    endDate: data.endDate ?? undefined,
    month: data.month ?? undefined,
    year: data.year ? Number(data.year) : undefined,
    source: data.source || 'manual',
    dailyGenerationKwh: data.dailyGenerationKwh ?? undefined,
    dailyPoints: data.dailyPoints ?? undefined,
  }

  try {
    const res = await api.post<SaveSolarProductionResponse>('/solar-production', payload)
    if (res?.data?.success && res?.data?.data) {
      return res.data.data
    }
    return null
  } catch (err) {
    // Graceful error handling - will fall back to local storage if server unreachable
    return null
  }
}

/**
 * Fetches the latest verified solar production reading for the authenticated customer.
 */
export async function fetchLatestSolarProductionFromServer(): Promise<SolarReportData | null> {
  try {
    const res = await api.get<LatestSolarProductionResponse>('/solar-production/latest')
    if (res?.data?.success && res?.data?.data) {
      return serverReadingToSolarReport(res.data.data)
    }
    return null
  } catch (err) {
    // If unauthenticated (401/403) or offline, return null
    return null
  }
}

/**
 * Fetches historical solar production readings for the authenticated customer.
 */
export async function fetchSolarProductionHistoryFromServer(
  limit: number = 24
): Promise<SolarReportData[]> {
  try {
    const res = await api.get<SolarProductionHistoryResponse>(
      `/solar-production/history?limit=${limit}`
    )
    if (res?.data?.success && Array.isArray(res?.data?.data)) {
      return res.data.data.map(serverReadingToSolarReport)
    }
    return []
  } catch {
    return []
  }
}

/**
 * Deletes a solar production reading by ID.
 */
export async function deleteSolarProductionFromServer(readingId: number): Promise<boolean> {
  try {
    const res = await api.delete<{ success: boolean }>(`/solar-production/${readingId}`)
    return !!res?.data?.success
  } catch {
    return false
  }
}
