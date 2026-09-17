import type {
  AMCContract,
  AMCKpiSummary,
  AMCVisit,
  AMCServiceRecord,
  AMCRecommendationResult,
  AMCApiContract,
  AMCRecommendationApiResponse,
} from '../types/amc.types'
import {
  mapAMCContract,
  mapAMCKpis,
  mapAMCVisits,
  mapAMCServiceHistory,
  mapAMCRecommendation,
} from '../mappers/amcMapper'

export interface AMCAggregatedData {
  contract: AMCContract | null
  kpis: AMCKpiSummary
  visits: AMCVisit[]
  serviceHistory: AMCServiceRecord[]
  recommendation: AMCRecommendationResult | null
  hasContract: boolean
}

export function aggregateAMCData(
  rawContract: AMCApiContract | null,
  rawRecommendation: AMCRecommendationApiResponse | null,
): AMCAggregatedData {
  const contract = mapAMCContract(rawContract)

  const visits = contract && rawContract
    ? mapAMCVisits(rawContract.visits)
    : []

  const serviceHistory = contract && rawContract
    ? mapAMCServiceHistory(rawContract.service_history)
    : []

  const recommendation = rawRecommendation
    ? mapAMCRecommendation(rawRecommendation)
    : null

  const kpis = mapAMCKpis(contract, visits, serviceHistory)

  return {
    contract,
    kpis,
    visits,
    serviceHistory,
    recommendation,
    hasContract: contract !== null,
  }
}
