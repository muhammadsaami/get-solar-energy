import api from './api/client'
import type {
  SolarAdvisorRequest,
  SolarAdvisorResponse,
  EnterpriseAIRequest,
  EnterpriseAIResponse,
} from '../types/chat'

export async function sendSolarAdvisorMessage(
  payload: SolarAdvisorRequest
): Promise<SolarAdvisorResponse> {
  const { data } = await api.post<SolarAdvisorResponse>(
    '/api/solar-assistant',
    payload
  )
  return data
}

export async function sendEnterpriseAIMessage(
  payload: EnterpriseAIRequest
): Promise<EnterpriseAIResponse> {
  const { data } = await api.post<EnterpriseAIResponse>(
    '/api/assistant/chat',
    payload
  )
  return data
}
